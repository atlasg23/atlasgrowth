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

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

async function reverseGeocode(lat, lng) {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API key not found in environment variables');
  }

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
    let city, state, country;
    
    // Extract city and state from address components
    for (const component of result.address_components) {
      if (component.types.includes('locality')) {
        city = component.long_name;
      } else if (component.types.includes('administrative_area_level_2') && !city) {
        // Use county as fallback for city
        city = component.long_name;
      } else if (component.types.includes('administrative_area_level_1')) {
        state = component.short_name; // Use abbreviated state name (e.g., "LA", "AR", "AL")
      } else if (component.types.includes('country')) {
        country = component.long_name;
      }
    }
    
    return { city, state, country, formatted_address: result.formatted_address };
    
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
    .select('id, name, latitude, longitude, city, state')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .or('city.is.null,state.is.null,city.eq.,state.eq.')
    .limit(100); // Process in batches to avoid API limits
  
  if (fetchError) {
    console.error('❌ Error fetching leads:', fetchError);
    return;
  }

  if (!leadsToUpdate || leadsToUpdate.length === 0) {
    console.log('✅ No leads found that need location updates');
    return;
  }

  console.log(`📍 Found ${leadsToUpdate.length} leads needing location data`);
  console.log('🌍 Starting Google Maps geocoding...');
  
  let updated = 0;
  let errors = 0;
  let skipped = 0;

  for (const [index, lead] of leadsToUpdate.entries()) {
    try {
      // Progress indicator
      if (index % 10 === 0) {
        console.log(`⏳ Progress: ${index + 1}/${leadsToUpdate.length} (${Math.round((index + 1) / leadsToUpdate.length * 100)}%)`);
      }
      
      // Add delay to respect Google API rate limits (40 requests per second max)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const locationData = await reverseGeocode(lead.latitude, lead.longitude);
      
      if (locationData && (locationData.city || locationData.state)) {
        // Only update if we don't have the data or if we got better data
        const updateData = {};
        
        if ((!lead.city || lead.city.trim() === '') && locationData.city) {
          updateData.city = locationData.city;
        }
        
        if ((!lead.state || lead.state.trim() === '') && locationData.state) {
          updateData.state = locationData.state;
          updateData.us_state = locationData.state; // Also update us_state field
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
  console.log(`✅ Successfully updated: ${updated}`);
  console.log(`⚠️  Skipped (already had data): ${skipped}`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`📋 Total processed: ${leadsToUpdate.length}`);
  
  if (updated > 0) {
    console.log('\n🎉 Location update completed successfully!');
    console.log('💡 Run this script again to process more batches if needed.');
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