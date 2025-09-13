#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { Vibrant } = require('node-vibrant/node');

// Use Node 18+ built-in fetch
const fetchFn = globalThis.fetch.bind(globalThis);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function normalizeGoogleImageUrl(url) {
  if (!url || !url.includes('googleusercontent.com')) {
    return url;
  }
  
  // Try original URL first, but replace any existing size with a reasonable one
  if (url.includes('lh3.googleusercontent.com')) {
    // Replace existing size parameters with =s512 (smaller, more likely to work)
    return url.replace(/=s\d+/, '=s512').replace(/-k-no$/, '') + (url.includes('=s') ? '' : '=s512');
  }
  
  return url;
}

async function testLogoExtraction(business) {
  if (!business.photo) {
    return { success: false, reason: 'No logo URL' };
  }
  
  try {
    const normalizedUrl = normalizeGoogleImageUrl(business.photo);
    console.log(`🎨 Testing logo extraction for: ${business.name}`);
    console.log(`   Original: ${business.photo.substring(0, 60)}...`);
    console.log(`   Normalized: ${normalizedUrl.substring(0, 60)}...`);
    
    // Fetch image with proper headers then use buffer with Vibrant
    const imageResponse = await fetchFn(normalizedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/*',
        'Referer': 'https://www.google.com/'
      }
    });
    
    if (!imageResponse.ok) {
      throw new Error(`HTTP ${imageResponse.status}: ${imageResponse.statusText}`);
    }
    
    const buffer = Buffer.from(await imageResponse.arrayBuffer());
    const palette = await Vibrant.from(buffer).getPalette();
    
    const primaryColor = palette.Vibrant?.hex || palette.DarkVibrant?.hex || palette.LightVibrant?.hex;
    const secondaryColor = palette.DarkVibrant?.hex || palette.Muted?.hex || palette.DarkMuted?.hex;
    
    if (!primaryColor) {
      return { success: false, reason: 'No vibrant colors found' };
    }
    
    console.log(`   ✅ Colors: ${primaryColor} / ${secondaryColor || 'N/A'}`);
    
    return {
      success: true,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      normalized_photo_url: normalizedUrl
    };
    
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    return { success: false, reason: error.message };
  }
}

async function testGeoEnrichment(business) {
  // Skip geo enrichment for landline/fixed line phones
  const phoneType = business.phone_phones_enricher_carrier_type;
  if (phoneType === 'landline' || phoneType === 'fixed_line' || phoneType === 'fixed line') {
    return { success: false, reason: 'Skipped landline/fixed line phone' };
  }
  
  // Skip if location already complete
  if (business.lat && business.lng && business.city && business.state) {
    return { success: false, reason: 'Location already complete' };
  }
  
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    return { success: false, reason: 'No Google Maps API key' };
  }
  
  try {
    console.log(`🗺️  Testing geo enrichment for: ${business.name}`);
    
    // Try find place by name + existing location info first
    let query = business.name;
    if (business.city) query += ` ${business.city}`;
    if (business.state) query += ` ${business.state}`;
    
    const findUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id,geometry,formatted_address&key=${process.env.GOOGLE_MAPS_API_KEY}`;
    const findResponse = await fetchFn(findUrl);
    const findData = await findResponse.json();
    
    if (findData.status !== 'OK' || !findData.candidates.length) {
      console.log(`   ❌ No place found for: ${query}`);
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
      lat: geometry?.lat,
      lng: geometry?.lng
      // Note: Removed google_place_id and formatted_address since columns don't exist yet
    };
    
    // Extract address components
    for (const component of addressComponents) {
      const types = component.types;
      
      if (types.includes('locality')) {
        locationData.city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        locationData.state = component.long_name;
        locationData.us_state = component.short_name;
      } else if (types.includes('postal_code')) {
        locationData.postal_code = component.long_name;
      }
    }
    
    console.log(`   ✅ Location: ${locationData.city}, ${locationData.state} (${locationData.lat}, ${locationData.lng})`);
    
    return { success: true, ...locationData };
    
  } catch (error) {
    console.log(`   ❌ Geo failed: ${error.message}`);
    return { success: false, reason: error.message };
  }
}

async function testProcessing() {
  console.log('🧪 ACTUALLY Testing Business Processing (10 Real Tests)');
  console.log('======================================================');
  console.log('🎨 Will extract logo colors from actual images');
  console.log('🗺️  Will attempt geo enrichment via Google Maps');
  console.log('💾 Will update database with results');
  console.log('');
  
  try {
    // Get test businesses
    const { data: testBusinesses, error } = await supabase
      .from('leads')
      .select('*')
      .limit(10)
      .order('import_date', { ascending: false });
    
    if (error) {
      console.error('❌ Failed to fetch test businesses:', error);
      return;
    }
    
    console.log(`✅ Testing with ${testBusinesses.length} businesses\n`);
    
    const results = {
      processed: 0,
      logoSuccess: 0,
      geoSuccess: 0,
      dbUpdates: 0,
      errors: []
    };
    
    // Process each business
    for (const business of testBusinesses) {
      console.log(`\n[${results.processed + 1}/10] Processing: ${business.name || 'Unnamed Business'}`);
      
      const updates = { id: business.id };
      let hasUpdates = false;
      
      // Test logo extraction
      if (!business.primary_color) {
        const logoResult = await testLogoExtraction(business);
        if (logoResult.success) {
          updates.primary_color = logoResult.primary_color;
          updates.secondary_color = logoResult.secondary_color;
          // Note: Not saving cleaned_photo_url since column doesn't exist yet
          hasUpdates = true;
          results.logoSuccess++;
        } else {
          console.log(`   ⏭️  Logo skipped: ${logoResult.reason}`);
        }
      } else {
        console.log('   ⏭️  Already has colors');
      }
      
      // Test geo enrichment (check phone type logic)
      const phoneType = business.phone_phones_enricher_carrier_type || 'unknown';
      console.log(`   📞 Phone type: ${phoneType}`);
      
      if (phoneType === 'landline' || phoneType === 'fixed_line' || phoneType === 'fixed line') {
        console.log('   ⏭️  Skipping geo (landline/fixed line)');
      } else if (business.lat && business.lng && business.city && business.state) {
        console.log('   ⏭️  Already has complete location');
      } else {
        const geoResult = await testGeoEnrichment(business);
        if (geoResult.success) {
          Object.assign(updates, geoResult);
          delete updates.success;
          hasUpdates = true;
          results.geoSuccess++;
        } else {
          console.log(`   ⏭️  Geo skipped: ${geoResult.reason}`);
        }
        
        // Small delay to respect Google's rate limits
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Update database if we have changes
      if (hasUpdates) {
        try {
          const { error: updateError } = await supabase
            .from('leads')
            .update(updates)
            .eq('id', business.id);
          
          if (updateError) {
            console.log(`   ❌ Database update failed: ${updateError.message}`);
            results.errors.push(`${business.name}: ${updateError.message}`);
          } else {
            console.log('   💾 Database updated successfully');
            results.dbUpdates++;
          }
        } catch (dbError) {
          console.log(`   ❌ Database error: ${dbError.message}`);
          results.errors.push(`${business.name}: ${dbError.message}`);
        }
      } else {
        console.log('   ⏭️  No updates needed');
      }
      
      results.processed++;
    }
    
    // Final results
    console.log('\n🎉 TEST COMPLETED!');
    console.log('==================');
    console.log(`📊 Businesses processed: ${results.processed}`);
    console.log(`🎨 Logo colors extracted: ${results.logoSuccess}`);
    console.log(`🗺️  Locations enriched: ${results.geoSuccess}`);
    console.log(`💾 Database updates: ${results.dbUpdates}`);
    console.log(`❌ Errors: ${results.errors.length}`);
    
    if (results.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      results.errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`);
      });
    }
    
    console.log('\n💡 If this test worked well, run the full processing:');
    console.log('   node scripts/process-all-businesses.js --test (100 businesses)');
    console.log('   node scripts/process-all-businesses.js (all businesses)');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

if (require.main === module) {
  testProcessing();
}