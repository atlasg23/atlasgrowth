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

// Function to reverse geocode using lat/lng
async function reverseGeocode(lat, lng) {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json`;
    const response = await axios.get(url, {
      params: {
        latlng: `${lat},${lng}`,
        key: GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const result = response.data.results[0];
      const addressComponents = result.address_components;
      
      let city = '';
      let state = '';
      
      addressComponents.forEach(component => {
        const types = component.types;
        
        if (types.includes('locality')) {
          city = component.long_name;
        } else if (types.includes('administrative_area_level_1')) {
          state = component.long_name;
        }
      });
      
      return { city, state };
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

// Function to update lead location
async function updateLeadLocation(leadId, city, state) {
  try {
    const updateData = { updated_at: new Date().toISOString() };
    
    if (city) updateData.city = city;
    if (state) updateData.state = state;
    
    if (Object.keys(updateData).length > 1) {
      const { error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', leadId);
      
      return !error;
    }
    return false;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('📍 FILLING MISSING CITY/STATE WITH LAT/LNG');
  console.log('='.repeat(50));
  
  // Get leads missing city/state but have coordinates (non-landlines)
  const { data: leads, error } = await supabase
    .from('leads')
    .select('id, name, latitude, longitude, city, state, business_type')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .not('phone_phones_enricher_carrier_type', 'in', '(landline,fixed line)')
    .or('city.is.null,city.eq.,state.is.null,state.eq.')
    .limit(200);
  
  if (error || !leads?.length) {
    console.log('❌ No leads found or error:', error?.message);
    return;
  }
  
  console.log(`Found ${leads.length} leads with coordinates but missing location`);
  
  let processed = 0;
  let successful = 0;
  
  for (const lead of leads) {
    processed++;
    console.log(`${processed}/${leads.length}: ${lead.name}`);
    
    const locationData = await reverseGeocode(lead.latitude, lead.longitude);
    
    if (locationData && (locationData.city || locationData.state)) {
      const updated = await updateLeadLocation(lead.id, locationData.city, locationData.state);
      
      if (updated) {
        successful++;
        console.log(`  ✅ Updated: ${locationData.city || 'N/A'}, ${locationData.state || 'N/A'}`);
      } else {
        console.log(`  ❌ Database update failed`);
      }
    } else {
      console.log(`  ⚠ No location data found`);
    }
    
    // Delay to respect API limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n✅ Complete: ${successful}/${processed} successful`);
}

main().catch(console.error);