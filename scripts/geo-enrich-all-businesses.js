#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Use Node 18+ built-in fetch
const fetchFn = globalThis.fetch.bind(globalThis);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function geoEnrichBusiness(business) {
  // Skip if already has complete city and state data
  if (business.city && business.state) {
    return { success: false, reason: 'Already has city/state', skipped: true };
  }
  
  if (!business.name) {
    return { success: false, reason: 'No business name' };
  }
  
  try {
    console.log(`🗺️  Enriching location for: ${business.name}`);
    
    // Build search query with available address info
    let query = business.name;
    if (business.city) query += ` ${business.city}`;
    if (business.state) query += ` ${business.state}`;
    
    console.log(`   Query: ${query}`);
    
    const findUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id,geometry,formatted_address&key=${process.env.GOOGLE_MAPS_API_KEY}`;
    const findResponse = await fetchFn(findUrl);
    const findData = await findResponse.json();
    
    if (findData.status !== 'OK' || !findData.candidates.length) {
      console.log(`   ❌ No place found`);
      return { success: false, reason: 'No place found in Google Maps' };
    }
    
    const candidate = findData.candidates[0];
    
    // Get detailed info
    const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${candidate.place_id}&fields=geometry,address_components,formatted_address&key=${process.env.GOOGLE_MAPS_API_KEY}`;
    const detailResponse = await fetchFn(detailUrl);
    const detailData = await detailResponse.json();
    
    if (detailData.status !== 'OK') {
      return { success: false, reason: 'Failed to get place details' };
    }
    
    const placeDetails = detailData.result;
    const geometry = placeDetails.geometry?.location;
    const addressComponents = placeDetails.address_components || [];
    
    const locationData = {
      latitude: geometry?.lat,
      longitude: geometry?.lng
    };
    
    // Extract city and state from address components
    for (const component of addressComponents) {
      const types = component.types;
      
      if (types.includes('locality') || types.includes('administrative_area_level_3')) {
        locationData.city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        locationData.state = component.short_name;
      } else if (types.includes('country')) {
        locationData.country = component.short_name;
      } else if (types.includes('postal_code')) {
        locationData.postal_code = component.long_name;
      }
    }
    
    console.log(`   ✅ Found: ${locationData.city || 'Unknown'}, ${locationData.state || 'Unknown'} (${locationData.latitude}, ${locationData.longitude})`);
    
    // Update database
    const { error } = await supabase
      .from('leads')
      .update(locationData)
      .eq('id', business.id);
    
    if (error) {
      console.log(`   ❌ Database update failed: ${error.message}`);
      return { success: false, reason: error.message };
    }
    
    console.log(`   💾 Database updated successfully`);
    
    return {
      success: true,
      location: `${locationData.city || 'Unknown'}, ${locationData.state || 'Unknown'}`,
      coordinates: `(${locationData.latitude}, ${locationData.longitude})`
    };
    
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    return { success: false, reason: error.message };
  }
}

async function main() {
  console.log('🌍 GEO ENRICHMENT - ALL BUSINESSES');
  console.log('=======================================');
  console.log('🗺️  Adding precise coordinates via Google Maps API');
  console.log('💾 Updating database with location data');
  console.log('');
  
  // Get all businesses with missing city or state data
  const { data: businesses, error } = await supabase
    .from('leads')
    .select('id, name, city, state, country, latitude, longitude')
    .or('city.is.null,state.is.null,city.eq.,state.eq.')
    .order('name');
  
  if (error) {
    console.error('❌ Error fetching businesses:', error);
    return;
  }
  
  console.log(`✅ Found ${businesses.length} businesses with missing city/state data`);
  console.log('');
  
  let processed = 0;
  let successful = 0;
  let skipped = 0;
  let failed = 0;
  const errors = [];
  
  for (const business of businesses) {
    processed++;
    
    console.log(`[${processed}/${businesses.length}] Processing: ${business.name}`);
    
    const result = await geoEnrichBusiness(business);
    
    if (result.success) {
      successful++;
    } else if (result.skipped) {
      skipped++;
    } else {
      failed++;
      errors.push(`${business.name}: ${result.reason}`);
    }
    
    // Rate limiting - Google Maps API allows 50 requests per second
    // Being conservative with 10 requests per second
    if (processed % 10 === 0) {
      console.log(`   ⏸️  Rate limiting pause (${processed}/${businesses.length})...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('');
  }
  
  console.log('🎉 GEO ENRICHMENT COMPLETED!');
  console.log('=============================');
  console.log(`📊 Businesses processed: ${processed}`);
  console.log(`🗺️  Successfully enriched: ${successful}`);
  console.log(`⏭️  Skipped (already had city/state): ${skipped}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('');
  
  if (errors.length > 0) {
    console.log('❌ Errors encountered:');
    errors.slice(0, 10).forEach((error, i) => {
      console.log(`   ${i + 1}. ${error}`);
    });
    if (errors.length > 10) {
      console.log(`   ... and ${errors.length - 10} more errors`);
    }
    console.log('');
  }
  
  console.log('💡 Run the verification SQL to check results!');
}

if (require.main === module) {
  main().catch(console.error);
}