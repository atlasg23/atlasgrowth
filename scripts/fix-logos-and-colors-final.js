#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const sharp = require('sharp');
const Vibrant = require('node-vibrant');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Function to improve Google logo URL
function improveLogoURL(originalUrl) {
  if (!originalUrl || !originalUrl.includes('googleusercontent.com')) {
    return originalUrl;
  }
  
  // Replace small size with larger size and clean parameters
  // Example: s44-p-k-no-ns-nd -> s200 (200x200 pixels, clean)
  let improvedUrl = originalUrl
    .replace(/s\d+-[p-k-no-ns-nd-]+/g, 's200')  // Change size and remove extra params
    .replace(/s\d+/g, 's200');  // Just change size if no extra params
  
  return improvedUrl;
}

// Function to download image
async function downloadImage(url) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    return Buffer.from(response.data);
  } catch (error) {
    return null;
  }
}

// Function to extract colors
async function extractColors(imageBuffer) {
  try {
    const palette = await Vibrant.from(imageBuffer).getPalette();
    
    const colors = {};
    
    // Get the most vibrant colors
    if (palette.Vibrant) {
      colors.primary = palette.Vibrant.hex;
    } else if (palette.DarkVibrant) {
      colors.primary = palette.DarkVibrant.hex;
    }
    
    if (palette.Muted) {
      colors.secondary = palette.Muted.hex;
    } else if (palette.DarkMuted) {
      colors.secondary = palette.DarkMuted.hex;
    }
    
    return colors;
  } catch (error) {
    return {};
  }
}

// Function to update lead with colors
async function updateLeadColors(leadId, colors) {
  try {
    const updateData = { updated_at: new Date().toISOString() };
    
    if (colors.primary) updateData.primary_color = colors.primary;
    if (colors.secondary) updateData.secondary_color = colors.secondary;
    
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
  console.log('🎨 PROCESSING LOGOS AND EXTRACTING COLORS');
  console.log('='.repeat(50));
  
  // Get leads with logos but no colors (non-landlines)
  const { data: leads, error } = await supabase
    .from('leads')
    .select('id, name, logo, business_type')
    .not('logo', 'is', null)
    .neq('logo', '')
    .not('phone_phones_enricher_carrier_type', 'in', '(landline,fixed line)')
    .or('primary_color.is.null,primary_color.eq.')
    .limit(100);
  
  if (error || !leads?.length) {
    console.log('❌ No leads found or error:', error?.message);
    return;
  }
  
  console.log(`Found ${leads.length} leads to process`);
  
  let processed = 0;
  let successful = 0;
  
  for (const lead of leads) {
    processed++;
    console.log(`${processed}/${leads.length}: ${lead.name}`);
    
    // Improve the logo URL
    const improvedUrl = improveLogoURL(lead.logo);
    console.log(`  Original: ${lead.logo}`);
    console.log(`  Improved: ${improvedUrl}`);
    
    // Download the improved image
    const imageBuffer = await downloadImage(improvedUrl);
    if (!imageBuffer) {
      console.log(`  ❌ Failed to download`);
      continue;
    }
    
    // Extract colors
    const colors = await extractColors(imageBuffer);
    if (!colors.primary) {
      console.log(`  ⚠ No colors extracted`);
      continue;
    }
    
    // Update database
    const updated = await updateLeadColors(lead.id, colors);
    if (updated) {
      successful++;
      console.log(`  ✅ Colors: Primary=${colors.primary}, Secondary=${colors.secondary || 'N/A'}`);
    } else {
      console.log(`  ❌ Database update failed`);
    }
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  console.log(`\n✅ Complete: ${successful}/${processed} successful`);
}

main().catch(console.error);