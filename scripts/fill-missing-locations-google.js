#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

if (!GOOGLE_MAPS_API_KEY) {
  console.error('❌ GOOGLE_MAPS_API_KEY not found in environment variables');
  process.exit(1);
}

// Function to get location data from Google Places API
async function getLocationFromPlaceId(placeId) {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json`;
    const response = await axios.get(url, {
      params: {
        place_id: placeId,
        fields: 'address_components,formatted_address,geometry',
        key: GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.status === 'OK' && response.data.result) {
      const addressComponents = response.data.result.address_components || [];
      const geometry = response.data.result.geometry;
      
      let city = '';
      let state = '';
      let postalCode = '';
      let country = '';
      
      // Parse address components
      addressComponents.forEach(component => {
        const types = component.types;
        
        if (types.includes('locality') || types.includes('sublocality')) {
          city = component.long_name;
        } else if (types.includes('administrative_area_level_1')) {
          state = component.long_name;
        } else if (types.includes('postal_code')) {
          postalCode = component.long_name;
        } else if (types.includes('country')) {
          country = component.long_name;
        }
      });
      
      return {
        city: city || null,
        state: state || null,
        postal_code: postalCode || null,
        country: country || null,
        latitude: geometry?.location?.lat || null,
        longitude: geometry?.location?.lng || null,
        formatted_address: response.data.result.formatted_address || null
      };
    } else {
      console.error(`Google API error for place_id ${placeId}:`, response.data.status);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching location for place_id ${placeId}:`, error.message);
    return null;
  }
}

// Function to update lead with location data
async function updateLeadLocation(leadId, locationData) {
  try {
    const updateData = {
      updated_at: new Date().toISOString()
    };

    // Only update fields that have data and are currently missing
    if (locationData.city) updateData.city = locationData.city;
    if (locationData.state) updateData.state = locationData.state;
    if (locationData.postal_code) updateData.postal_code = locationData.postal_code;
    if (locationData.country) updateData.country = locationData.country;
    if (locationData.latitude) updateData.latitude = locationData.latitude;
    if (locationData.longitude) updateData.longitude = locationData.longitude;
    if (locationData.formatted_address) updateData.full_address = locationData.formatted_address;

    const { error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', leadId);

    return !error;
  } catch (error) {
    console.error(`Error updating lead ${leadId}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('FILLING MISSING CITY/STATE DATA FROM GOOGLE MAPS');
  console.log('='.repeat(60));
  
  // Find leads that are missing city or state and have place_id, excluding landlines
  console.log('\n1. FINDING LEADS WITH MISSING LOCATION DATA...');
  console.log('-'.repeat(50));
  
  const { data: leads, error } = await supabase
    .from('leads')
    .select('id, name, place_id, city, state, phone_phones_enricher_carrier_type, business_type')
    .not('place_id', 'is', null)
    .neq('place_id', '')
    .not('phone_phones_enricher_carrier_type', 'in', '(landline,fixed line)')
    .or('city.is.null,city.eq.,state.is.null,state.eq.')
    .order('business_type')
    .limit(1000); // Process in batches to avoid API limits

  if (error) {
    console.error('❌ Error fetching leads:', error.message);
    process.exit(1);
  }

  if (!leads || leads.length === 0) {
    console.log('✅ No leads found with missing location data');
    process.exit(0);
  }

  console.log(`📍 Found ${leads.length} leads with missing location data`);
  
  // Group by business type for better progress tracking
  const leadsByType = {};
  leads.forEach(lead => {
    if (!leadsByType[lead.business_type]) {
      leadsByType[lead.business_type] = [];
    }
    leadsByType[lead.business_type].push(lead);
  });

  console.log('\nBreakdown by business type:');
  Object.entries(leadsByType).forEach(([type, typeLeads]) => {
    console.log(`  ${type}: ${typeLeads.length} leads`);
  });

  // Process leads
  console.log('\n2. PROCESSING LEADS...');
  console.log('-'.repeat(50));
  
  let processed = 0;
  let updated = 0;
  let failed = 0;
  let apiCalls = 0;
  
  const MAX_API_CALLS = 900; // Stay under daily limit
  
  for (const [businessType, typeLeads] of Object.entries(leadsByType)) {
    console.log(`\n📋 Processing ${businessType} leads (${typeLeads.length})...`);
    
    for (let i = 0; i < typeLeads.length && apiCalls < MAX_API_CALLS; i++) {
      const lead = typeLeads[i];
      processed++;
      
      console.log(`  ${processed}/${leads.length}: ${lead.name} (${lead.business_type})`);
      
      // Check if we need to fetch location data
      const needsCity = !lead.city || lead.city === '';
      const needsState = !lead.state || lead.state === '';
      
      if (!needsCity && !needsState) {
        console.log('    ⏭ Skipping - already has location data');
        continue;
      }
      
      // Fetch location from Google Maps
      apiCalls++;
      const locationData = await getLocationFromPlaceId(lead.place_id);
      
      if (locationData) {
        // Only update if we got useful data
        const hasUsefulData = (needsCity && locationData.city) || 
                             (needsState && locationData.state);
        
        if (hasUsefulData) {
          const success = await updateLeadLocation(lead.id, locationData);
          
          if (success) {
            updated++;
            const cityPart = locationData.city ? ` city: ${locationData.city}` : '';
            const statePart = locationData.state ? ` state: ${locationData.state}` : '';
            console.log(`    ✅ Updated -${cityPart}${statePart}`);
          } else {
            failed++;
            console.log(`    ❌ Failed to update database`);
          }
        } else {
          console.log(`    ⚠ No useful location data found`);
        }
      } else {
        failed++;
        console.log(`    ❌ Failed to get location from Google`);
      }
      
      // Add a small delay to be respectful to the API
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Progress update every 10 records
      if (processed % 10 === 0) {
        console.log(`\n  📊 Progress: ${processed}/${leads.length} processed, ${updated} updated, ${failed} failed, ${apiCalls} API calls`);
      }
    }
    
    if (apiCalls >= MAX_API_CALLS) {
      console.log(`\n⚠ Reached API call limit (${MAX_API_CALLS}). Stopping to avoid exceeding quota.`);
      break;
    }
  }
  
  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('LOCATION FILLING COMPLETE');
  console.log('='.repeat(60));
  
  console.log(`\nSummary:`);
  console.log(`  Leads processed: ${processed}`);
  console.log(`  Successfully updated: ${updated}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Google API calls made: ${apiCalls}`);
  
  // Check final status
  const { count: stillMissingCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .not('place_id', 'is', null)
    .neq('place_id', '')
    .not('phone_phones_enricher_carrier_type', 'in', '(landline,fixed line)')
    .or('city.is.null,city.eq.,state.is.null,state.eq.');
  
  console.log(`  Leads still missing location: ${stillMissingCount || 0}`);
  
  if (apiCalls >= MAX_API_CALLS && stillMissingCount > 0) {
    console.log(`\n💡 To continue processing remaining leads, run this script again tomorrow.`);
  }
  
  console.log('\n✅ Script completed!');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⏹ Script interrupted by user. Exiting gracefully...');
  process.exit(0);
});

// Run the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });