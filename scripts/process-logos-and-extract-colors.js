#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const sharp = require('sharp');
const Vibrant = require('node-vibrant');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Function to download image
async function downloadImage(url) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    return Buffer.from(response.data);
  } catch (error) {
    console.error(`Failed to download image from ${url}:`, error.message);
    return null;
  }
}

// Function to clean up logo image
async function cleanupLogo(imageBuffer) {
  try {
    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata();
    
    // Create a cleaned version
    let processedImage = sharp(imageBuffer);
    
    // Remove background if it's a common Google logo background
    // This targets the specific Google logo format you mentioned
    if (metadata.width && metadata.height) {
      // Resize if too large
      if (metadata.width > 200 || metadata.height > 200) {
        processedImage = processedImage.resize(200, 200, { 
          fit: 'inside',
          withoutEnlargement: true 
        });
      }
      
      // Enhance the image
      processedImage = processedImage
        .sharpen()
        .png({ quality: 90, compressionLevel: 6 });
    }
    
    return await processedImage.toBuffer();
  } catch (error) {
    console.error('Error cleaning up image:', error.message);
    return null;
  }
}

// Function to extract dominant colors
async function extractColors(imageBuffer) {
  try {
    const palette = await Vibrant.from(imageBuffer).getPalette();
    
    const colors = {};
    
    // Extract primary color (most vibrant or dominant)
    if (palette.Vibrant) {
      colors.primary = palette.Vibrant.hex;
    } else if (palette.DarkVibrant) {
      colors.primary = palette.DarkVibrant.hex;
    } else if (palette.LightVibrant) {
      colors.primary = palette.LightVibrant.hex;
    }
    
    // Extract secondary color (muted or complementary)
    if (palette.Muted) {
      colors.secondary = palette.Muted.hex;
    } else if (palette.DarkMuted) {
      colors.secondary = palette.DarkMuted.hex;
    } else if (palette.LightMuted) {
      colors.secondary = palette.LightMuted.hex;
    }
    
    // Fallback to any available color
    if (!colors.primary && palette.DominantColor) {
      colors.primary = palette.DominantColor.hex;
    }
    
    return colors;
  } catch (error) {
    console.error('Error extracting colors:', error.message);
    return {};
  }
}

// Function to update lead with colors
async function updateLeadColors(leadId, colors) {
  try {
    const updateData = {
      updated_at: new Date().toISOString()
    };
    
    if (colors.primary) updateData.primary_color = colors.primary;
    if (colors.secondary) updateData.secondary_color = colors.secondary;
    
    if (Object.keys(updateData).length > 1) { // More than just updated_at
      const { error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', leadId);
      
      return !error;
    }
    
    return false;
  } catch (error) {
    console.error(`Error updating lead ${leadId}:`, error.message);
    return false;
  }
}

// Function to process a single lead's logo
async function processLeadLogo(lead) {
  const { id, name, logo, business_type } = lead;
  
  if (!logo || logo === '') {
    return { success: false, reason: 'No logo URL' };
  }
  
  console.log(`  📥 Downloading logo for: ${name}`);
  
  // Download the image
  const imageBuffer = await downloadImage(logo);
  if (!imageBuffer) {
    return { success: false, reason: 'Download failed' };
  }
  
  // Clean up the image
  const cleanedBuffer = await cleanupLogo(imageBuffer);
  if (!cleanedBuffer) {
    return { success: false, reason: 'Cleanup failed' };
  }
  
  // Extract colors
  const colors = await extractColors(cleanedBuffer);
  if (!colors.primary && !colors.secondary) {
    return { success: false, reason: 'No colors extracted' };
  }
  
  // Update the database
  const updated = await updateLeadColors(id, colors);
  if (!updated) {
    return { success: false, reason: 'Database update failed' };
  }
  
  return { 
    success: true, 
    colors,
    details: `Primary: ${colors.primary || 'N/A'}, Secondary: ${colors.secondary || 'N/A'}`
  };
}

async function main() {
  console.log('='.repeat(60));
  console.log('LOGO PROCESSING AND COLOR EXTRACTION');
  console.log('='.repeat(60));
  
  // Find leads with logos that don't have colors yet, excluding landlines
  console.log('\n1. FINDING LEADS WITH LOGOS TO PROCESS...');
  console.log('-'.repeat(50));
  
  const { data: leads, error } = await supabase
    .from('leads')
    .select('id, name, logo, business_type, primary_color, secondary_color, phone_phones_enricher_carrier_type')
    .not('logo', 'is', null)
    .neq('logo', '')
    .not('phone_phones_enricher_carrier_type', 'in', '(landline,fixed line)')
    .or('primary_color.is.null,primary_color.eq.,secondary_color.is.null,secondary_color.eq.')
    .order('business_type')
    .limit(500); // Process in batches
  
  if (error) {
    console.error('❌ Error fetching leads:', error.message);
    process.exit(1);
  }
  
  if (!leads || leads.length === 0) {
    console.log('✅ No leads found with logos needing color extraction');
    process.exit(0);
  }
  
  console.log(`🎨 Found ${leads.length} leads with logos to process`);
  
  // Group by business type
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
  console.log('\n2. PROCESSING LOGOS...');
  console.log('-'.repeat(50));
  
  let processed = 0;
  let successful = 0;
  let failed = 0;
  const failureReasons = {};
  
  for (const [businessType, typeLeads] of Object.entries(leadsByType)) {
    console.log(`\n🏢 Processing ${businessType} leads (${typeLeads.length})...`);
    
    for (let i = 0; i < typeLeads.length; i++) {
      const lead = typeLeads[i];
      processed++;
      
      const result = await processLeadLogo(lead);
      
      if (result.success) {
        successful++;
        console.log(`    ✅ ${lead.name} - ${result.details}`);
      } else {
        failed++;
        failureReasons[result.reason] = (failureReasons[result.reason] || 0) + 1;
        console.log(`    ❌ ${lead.name} - ${result.reason}`);
      }
      
      // Progress update every 10 records
      if (processed % 10 === 0) {
        console.log(`\n  📊 Progress: ${processed}/${leads.length} processed, ${successful} successful, ${failed} failed`);
      }
      
      // Add a small delay between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('LOGO PROCESSING COMPLETE');
  console.log('='.repeat(60));
  
  console.log(`\nSummary:`);
  console.log(`  Leads processed: ${processed}`);
  console.log(`  Successfully processed: ${successful}`);
  console.log(`  Failed: ${failed}`);
  
  if (Object.keys(failureReasons).length > 0) {
    console.log(`\nFailure breakdown:`);
    Object.entries(failureReasons).forEach(([reason, count]) => {
      console.log(`  ${reason}: ${count}`);
    });
  }
  
  // Check final status
  const { count: remainingCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .not('logo', 'is', null)
    .neq('logo', '')
    .not('phone_phones_enricher_carrier_type', 'in', '(landline,fixed line)')
    .or('primary_color.is.null,primary_color.eq.,secondary_color.is.null,secondary_color.eq.');
  
  console.log(`\nLeads still needing color extraction: ${remainingCount || 0}`);
  
  // Sample some results
  if (successful > 0) {
    console.log('\n🎨 Sample color extractions:');
    const { data: samples } = await supabase
      .from('leads')
      .select('name, business_type, primary_color, secondary_color')
      .not('primary_color', 'is', null)
      .neq('primary_color', '')
      .not('phone_phones_enricher_carrier_type', 'in', '(landline,fixed line)')
      .order('updated_at', { ascending: false })
      .limit(5);
    
    samples?.forEach(sample => {
      console.log(`  ${sample.name} (${sample.business_type}): Primary ${sample.primary_color}, Secondary ${sample.secondary_color || 'N/A'}`);
    });
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