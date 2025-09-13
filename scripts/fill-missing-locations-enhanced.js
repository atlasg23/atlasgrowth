const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Your Google Maps API key
const GOOGLE_MAPS_API_KEY = 'AIzaSyDJe6jp7mNRZm-dAGFAMrSSADU5KwD0vtc';

async function reverseGeocode(lat, lng) {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status !== 'OK' || !data.results.length) {
      console.warn(`Geocoding failed for ${lat},${lng}: ${data.status}`);
      return null;
    }
    
    const result = data.results[0];
    let city, state, zipCode, county;
    
    // Extract location components
    for (const component of result.address_components) {
      if (component.types.includes('locality')) {
        city = component.long_name;
      } else if (component.types.includes('administrative_area_level_2') && !city) {
        // Use county as fallback for city
        county = component.long_name;
      } else if (component.types.includes('administrative_area_level_1')) {
        state = component.short_name; // Use abbreviated state name (e.g., "LA", "AR", "AL")
      } else if (component.types.includes('postal_code')) {
        zipCode = component.long_name;
      }
    }
    
    // If no city found, use county
    if (!city && county) {
      city = county;
    }
    
    return { 
      city, 
      state, 
      zipCode,
      full_address: result.formatted_address,
      place_id: result.place_id
    };
    
  } catch (error) {
    console.error(`Error geocoding ${lat},${lng}:`, error.message);
    return null;
  }
}

async function fillMissingLocations() {
  console.log('🔍 Finding leads with missing city/state but with lat/lng...');
  
  // Find leads with lat/lng but missing city or state
  const { data: leadsToUpdate, error: fetchError } = await supabaseAdmin
    .from('leads')
    .select('id, name, latitude, longitude, city, state, full_address')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .or('city.is.null,state.is.null,city.eq.,state.eq.')
    .limit(10000); // Process all records
  
  if (fetchError) {
    console.error('❌ Error fetching leads:', fetchError);
    return;
  }

  if (!leadsToUpdate || leadsToUpdate.length === 0) {
    console.log('✅ No leads found that need location updates');
    return;
  }

  console.log(`📍 Found ${leadsToUpdate.length} leads needing location data`);
  console.log(`🌍 Starting Google Maps geocoding with API key: ${GOOGLE_MAPS_API_KEY.substring(0, 20)}...`);
  
  let updated = 0;
  let errors = 0;
  let skipped = 0;
  let apiCalls = 0;

  for (const [index, lead] of leadsToUpdate.entries()) {
    try {
      // Progress indicator
      if (index % 10 === 0) {
        console.log(`⏳ Progress: ${index + 1}/${leadsToUpdate.length} (${Math.round((index + 1) / leadsToUpdate.length * 100)}%)`);
      }
      
      // Add delay to respect Google API rate limits (50 requests per second max, being conservative)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      apiCalls++;
      const locationData = await reverseGeocode(lead.latitude, lead.longitude);
      
      if (locationData && (locationData.city || locationData.state)) {
        // Build update data
        const updateData = {};
        
        if ((!lead.city || lead.city.trim() === '') && locationData.city) {
          updateData.city = locationData.city;
        }
        
        if ((!lead.state || lead.state.trim() === '') && locationData.state) {
          updateData.state = locationData.state;
          updateData.us_state = locationData.state; // Also update us_state field
        }
        
        // Always try to add full_address if we don't have it
        if ((!lead.full_address || lead.full_address.trim() === '') && locationData.full_address) {
          updateData.full_address = locationData.full_address;
        }
        
        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabaseAdmin
            .from('leads')
            .update(updateData)
            .eq('id', lead.id);
          
          if (updateError) {
            console.error(`❌ Failed to update lead ${lead.id}:`, updateError);
            errors++;
          } else {
            console.log(`✅ Updated "${lead.name || 'Unknown'}": ${JSON.stringify(updateData)}`);
            updated++;
          }
        } else {
          console.log(`⏭️  Skipped "${lead.name || 'Unknown'}" - already has location data`);
          skipped++;
        }
      } else {
        console.warn(`⚠️  No location data found for "${lead.name || 'Unknown'}" (${lead.latitude}, ${lead.longitude})`);
        errors++;
      }
    } catch (error) {
      console.error(`❌ Error processing lead ${lead.id}:`, error.message);
      errors++;
    }
  }
  
  console.log('\n📊 SUMMARY:');
  console.log(`📞 API calls made: ${apiCalls}`);
  console.log(`✅ Successfully updated: ${updated}`);
  console.log(`⚠️  Skipped (already had data): ${skipped}`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`📋 Total processed: ${leadsToUpdate.length}`);
  console.log(`🔄 Remaining leads needing location: ~${4946 - leadsToUpdate.length}`);
  
  if (updated > 0) {
    console.log('\n🎉 Location update completed successfully!');
    console.log('💡 Run this script again to process more batches.');
    console.log('💰 Estimated cost: ~$' + (apiCalls * 0.005).toFixed(3) + ' (Google Maps Geocoding API)');
  }
}

// Handle command line execution
if (require.main === module) {
  fillMissingLocations()
    .then(() => {
      console.log('\n🔚 Script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { fillMissingLocations };