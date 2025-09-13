#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const Vibrant = require('node-vibrant');
const fetch = require('node-fetch');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configuration
const BATCH_SIZE = 10;
const LOGO_NETWORK_CONCURRENCY = 5;
const GEO_API_LIMIT = 5; // requests per second for Google Maps
const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds

class ProcessingQueue {
  constructor(concurrency = 5) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }
  
  async add(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.process();
    });
  }
  
  async process() {
    if (this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }
    
    this.running++;
    const { fn, resolve, reject } = this.queue.shift();
    
    try {
      const result = await fn();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.running--;
      this.process();
    }
  }
}

const logoQueue = new ProcessingQueue(LOGO_NETWORK_CONCURRENCY);
let geoApiCalls = 0;
let geoApiLastReset = Date.now();

async function rateLimitGeoAPI() {
  const now = Date.now();
  if (now - geoApiLastReset >= 1000) {
    // Reset counter every second
    geoApiCalls = 0;
    geoApiLastReset = now;
  }
  
  if (geoApiCalls >= GEO_API_LIMIT) {
    // Wait until next second
    const waitTime = 1000 - (now - geoApiLastReset);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    geoApiCalls = 0;
    geoApiLastReset = Date.now();
  }
  
  geoApiCalls++;
}

function cleanGoogleImageUrl(url) {
  if (!url || !url.includes('googleusercontent.com')) {
    return url;
  }
  
  // Remove size restrictions and quality limitations
  const cleanedUrl = url
    .replace(/\/s\d+-[a-z-]+/g, '') // Remove /s44-p-k-no-ns-nd/ type restrictions
    .replace(/=s\d+/, '') // Remove =s44 size parameters
    .replace(/\/w\d+-h\d+-[a-z-]+/g, '') // Remove width/height restrictions
    .replace(/=w\d+-h\d+/, ''); // Remove width/height parameters
    
  return cleanedUrl;
}

async function extractLogoColors(business) {
  if (!business.photo) {
    return { success: false, reason: 'No logo URL' };
  }
  
  return await logoQueue.add(async () => {
    try {
      const cleanedUrl = cleanGoogleImageUrl(business.photo);
      console.log(`🎨 Analyzing: ${business.name}`);
      console.log(`🔧 Original URL: ${business.photo.substring(0, 80)}...`);
      console.log(`🔧 Cleaned URL: ${cleanedUrl.substring(0, 80)}...`);
      
      const palette = await Vibrant.from(cleanedUrl).getPalette();
      
      const primaryColor = palette.Vibrant?.hex || palette.DarkVibrant?.hex || palette.LightVibrant?.hex;
      const secondaryColor = palette.DarkVibrant?.hex || palette.Muted?.hex || palette.DarkMuted?.hex;
      
      if (!primaryColor) {
        return { success: false, reason: 'No vibrant colors found' };
      }
      
      console.log(`✅ Extracted: ${primaryColor} / ${secondaryColor || 'N/A'}`);
      
      return {
        success: true,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        cleaned_photo_url: cleanedUrl
      };
      
    } catch (error) {
      console.log(`❌ Logo extraction failed: ${error.message}`);
      return { success: false, reason: error.message };
    }
  });
}

async function enrichGeography(business) {
  // Skip geo enrichment for landline/fixed line phones
  const phoneType = business.phone_phones_enricher_carrier_type;
  if (phoneType === 'landline' || phoneType === 'fixed_line' || phoneType === 'fixed line') {
    return { success: false, reason: 'Skipped landline/fixed line phone' };
  }
  
  // Skip if location already exists
  if (business.lat && business.lng && business.city && business.state) {
    return { success: false, reason: 'Location already complete' };
  }
  
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    return { success: false, reason: 'No Google Maps API key' };
  }
  
  try {
    await rateLimitGeoAPI();
    
    console.log(`🗺️  Enriching location for: ${business.name}`);
    
    let placeDetails = null;
    
    // Try using existing place_id first
    if (business.google_place_id) {
      const placeUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${business.google_place_id}&fields=geometry,address_components&key=${process.env.GOOGLE_MAPS_API_KEY}`;
      const placeResponse = await fetch(placeUrl);
      const placeData = await placeResponse.json();
      
      if (placeData.status === 'OK') {
        placeDetails = placeData.result;
      }
    }
    
    // If no place_id or place details failed, try find place by phone/name
    if (!placeDetails && (business.phone || business.name)) {
      await rateLimitGeoAPI();
      
      const query = business.phone || business.name;
      const findUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id,geometry,formatted_address&key=${process.env.GOOGLE_MAPS_API_KEY}`;
      const findResponse = await fetch(findUrl);
      const findData = await findResponse.json();
      
      if (findData.status === 'OK' && findData.candidates.length > 0) {
        const candidate = findData.candidates[0];
        
        // Get detailed info
        await rateLimitGeoAPI();
        const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${candidate.place_id}&fields=geometry,address_components&key=${process.env.GOOGLE_MAPS_API_KEY}`;
        const detailResponse = await fetch(detailUrl);
        const detailData = await detailResponse.json();
        
        if (detailData.status === 'OK') {
          placeDetails = detailData.result;
          placeDetails.place_id = candidate.place_id;
        }
      }
    }
    
    if (!placeDetails) {
      return { success: false, reason: 'No place found in Google Maps' };
    }
    
    // Extract location data
    const geometry = placeDetails.geometry?.location;
    const addressComponents = placeDetails.address_components || [];
    
    const locationData = {
      lat: geometry?.lat,
      lng: geometry?.lng,
      google_place_id: placeDetails.place_id
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
      } else if (types.includes('country')) {
        locationData.country = component.long_name;
      }
    }
    
    console.log(`✅ Location: ${locationData.city}, ${locationData.state} (${locationData.lat}, ${locationData.lng})`);
    
    return { success: true, ...locationData };
    
  } catch (error) {
    console.log(`❌ Geo enrichment failed: ${error.message}`);
    return { success: false, reason: error.message };
  }
}

async function processBusinessBatch(businesses) {
  const results = {
    processed: 0,
    logoSuccess: 0,
    geoSuccess: 0,
    errors: []
  };
  
  for (const business of businesses) {
    console.log(`\n[${results.processed + 1}/${businesses.length}] ${business.name || 'Unnamed Business'}`);
    
    const updates = { id: business.id };
    let hasUpdates = false;
    
    // Logo color extraction (for ALL businesses)
    if (!business.primary_color || !business.secondary_color) {
      const logoResult = await extractLogoColors(business);
      if (logoResult.success) {
        updates.primary_color = logoResult.primary_color;
        updates.secondary_color = logoResult.secondary_color;
        updates.cleaned_photo_url = logoResult.cleaned_photo_url;
        hasUpdates = true;
        results.logoSuccess++;
      }
    }
    
    // Geography enrichment (mobile phones only)
    const geoResult = await enrichGeography(business);
    if (geoResult.success) {
      Object.assign(updates, geoResult);
      delete updates.success;
      hasUpdates = true;
      results.geoSuccess++;
    }
    
    // Update database if we have changes
    if (hasUpdates) {
      try {
        const { error } = await supabase
          .from('leads')
          .update(updates)
          .eq('id', business.id);
        
        if (error) {
          console.log(`❌ Database update failed: ${error.message}`);
          results.errors.push(`${business.name}: ${error.message}`);
        } else {
          console.log(`💾 Updated database successfully`);
        }
      } catch (dbError) {
        console.log(`❌ Database error: ${dbError.message}`);
        results.errors.push(`${business.name}: ${dbError.message}`);
      }
    }
    
    results.processed++;
  }
  
  return results;
}

async function main() {
  const testMode = process.argv.includes('--test');
  const limit = testMode ? 10 : undefined;
  
  console.log(`🚀 Starting ${testMode ? 'TEST' : 'FULL'} Business Processing`);
  console.log('=======================================');
  console.log('🎨 Logo extraction: ALL businesses');
  console.log('🗺️  Geo enrichment: Mobile phones only');
  console.log('');
  
  try {
    // Get businesses that need processing
    let query = supabase
      .from('leads')
      .select('*')
      .order('import_date', { ascending: false });
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data: businesses, error } = await query;
    
    if (error) {
      console.error('❌ Failed to fetch businesses:', error);
      return;
    }
    
    if (!businesses || businesses.length === 0) {
      console.log('📭 No businesses found to process');
      return;
    }
    
    console.log(`📊 Found ${businesses.length} businesses to process`);
    console.log('');
    
    // Process in batches
    const totalResults = {
      processed: 0,
      logoSuccess: 0,
      geoSuccess: 0,
      errors: []
    };
    
    for (let i = 0; i < businesses.length; i += BATCH_SIZE) {
      const batch = businesses.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(businesses.length / BATCH_SIZE);
      
      console.log(`🔄 Processing batch ${batchNum}/${totalBatches}...`);
      
      const batchResults = await processBusinessBatch(batch);
      
      totalResults.processed += batchResults.processed;
      totalResults.logoSuccess += batchResults.logoSuccess;
      totalResults.geoSuccess += batchResults.geoSuccess;
      totalResults.errors.push(...batchResults.errors);
      
      console.log(`📈 Batch ${batchNum}/${totalBatches} completed`);
      
      if (i + BATCH_SIZE < businesses.length) {
        console.log(`⏳ Waiting ${DELAY_BETWEEN_BATCHES/1000} seconds before next batch...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }
    
    // Final results
    console.log('\n🎉 PROCESSING COMPLETED!');
    console.log('========================');
    console.log(`📊 Businesses processed: ${totalResults.processed}`);
    console.log(`🎨 Logo colors extracted: ${totalResults.logoSuccess}`);
    console.log(`🗺️  Locations enriched: ${totalResults.geoSuccess}`);
    console.log(`❌ Errors: ${totalResults.errors.length}`);
    
    if (totalResults.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      totalResults.errors.slice(0, 10).forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`);
      });
      if (totalResults.errors.length > 10) {
        console.log(`   ... and ${totalResults.errors.length - 10} more`);
      }
    }
    
  } catch (error) {
    console.error('❌ Processing failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}