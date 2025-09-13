#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Use Node 18+ built-in fetch
const fetchFn = globalThis.fetch.bind(globalThis);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function reverseGeocodeBusiness(business) {
  // Skip if already has city and state
  if (business.city && business.state) {
    return { success: false, reason: 'Already has city and state', skipped: true };
  }
  
  // Must have coordinates to reverse geocode
  if (!business.latitude || !business.longitude) {
    return { success: false, reason: 'No coordinates available' };
  }
  
  try {
    console.log(`🗺️  Reverse geocoding: ${business.name}`);
    console.log(`   Coordinates: ${business.latitude}, ${business.longitude}`);
    
    // Google Maps Reverse Geocoding API
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${business.latitude},${business.longitude}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetchFn(url);
    const data = await response.json();
    
    if (data.status !== 'OK' || !data.results.length) {
      console.log(`   ❌ No reverse geocoding results`);
      return { success: false, reason: 'No reverse geocoding results' };
    }
    
    const result = data.results[0];
    const addressComponents = result.address_components || [];
    
    let city = null;
    let state = null;
    let country = null;
    
    // Extract city and state from address components
    for (const component of addressComponents) {
      const types = component.types;
      
      if (types.includes('locality') || types.includes('administrative_area_level_3')) {
        city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        state = component.short_name;
      } else if (types.includes('country')) {
        country = component.short_name;
      }
    }
    
    if (!city && !state) {
      console.log(`   ❌ Could not extract city/state from result`);
      return { success: false, reason: 'Could not extract city/state' };
    }
    
    console.log(`   ✅ Found: ${city || 'Unknown'}, ${state || 'Unknown'}`);
    
    // Update database - only update fields that are currently empty
    const updateData = {};
    if (!business.city && city) updateData.city = city;
    if (!business.state && state) updateData.state = state;
    
    if (Object.keys(updateData).length === 0) {
      console.log(`   ⏭️  No updates needed`);
      return { success: false, reason: 'No updates needed', skipped: true };
    }
    
    const { error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', business.id);
    
    if (error) {
      console.log(`   ❌ Database update failed: ${error.message}`);
      return { success: false, reason: error.message };
    }
    
    console.log(`   💾 Database updated: ${Object.keys(updateData).join(', ')}`);
    
    return {
      success: true,
      city: city,
      state: state,
      updated_fields: Object.keys(updateData)
    };
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, reason: error.message };
  }
}

async function main() {
  console.log('🌍 REVERSE GEOCODING - ALL BUSINESSES');
  console.log('==========================================');
  console.log('📍 Finding businesses with coordinates but missing city/state');
  console.log('🗺️  Using Google Maps reverse geocoding');
  console.log('💾 Updating database with city/state data');
  console.log('');
  
  // Get businesses with coordinates but missing city or state
  const { data: businesses, error } = await supabase
    .from('leads')
    .select('id, name, city, state, latitude, longitude')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .or('city.is.null,state.is.null,city.eq.,state.eq.')
;
  
  if (error) {
    console.error('❌ Error fetching businesses:', error);
    return;
  }
  
  if (!businesses.length) {
    console.log('✅ No businesses found that need reverse geocoding');
    return;
  }
  
  console.log(`✅ Testing with ${businesses.length} businesses`);
  console.log('');
  
  let processed = 0;
  let successful = 0;
  let skipped = 0;
  let failed = 0;
  const errors = [];
  
  for (const business of businesses) {
    processed++;
    
    console.log(`[${processed}/${businesses.length}] Processing: ${business.name}`);
    
    const result = await reverseGeocodeBusiness(business);
    
    if (result.success) {
      successful++;
    } else if (result.skipped) {
      skipped++;
    } else {
      failed++;
      errors.push(`${business.name}: ${result.reason}`);
    }
    
    // Small delay to be nice to Google's API
    await new Promise(resolve => setTimeout(resolve, 200));
    
    console.log('');
  }
  
  console.log('🎉 REVERSE GEOCODING TEST COMPLETED!');
  console.log('=====================================');
  console.log(`📊 Businesses processed: ${processed}`);
  console.log(`🗺️  Successfully enriched: ${successful}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('');
  
  if (errors.length > 0) {
    console.log('❌ Errors encountered:');
    errors.forEach((error, i) => {
      console.log(`   ${i + 1}. ${error}`);
    });
    console.log('');
  }
}

if (require.main === module) {
  main().catch(console.error);
}