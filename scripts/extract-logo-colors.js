#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');
const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key for database writes
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Industry fallback colors (only used when extraction fails)
const industryColors = {
  'plumbing': { primary: '#1E40AF', secondary: '#F59E0B' },
  'hvac': { primary: '#DC2626', secondary: '#0EA5E9' },
  'electrical': { primary: '#F59E0B', secondary: '#1E40AF' },
  'roofing': { primary: '#374151', secondary: '#F59E0B' },
  'pest control': { primary: '#059669', secondary: '#DC2626' },
  'landscaping': { primary: '#059669', secondary: '#F59E0B' },
  'cleaning': { primary: '#0EA5E9', secondary: '#059669' },
  'default': { primary: '#1E40AF', secondary: '#F59E0B' }
};

/**
 * Clean Google Photos URL to get high-resolution image
 */
function cleanLogoUrl(logoUrl) {
  if (!logoUrl || !logoUrl.includes('googleusercontent.com')) {
    return logoUrl;
  }
  
  // Remove the size restriction part (s44-p-k-no-ns-nd, etc.) 
  // Pattern: /s\d+-[^/]+/ matches things like /s44-p-k-no-ns-nd/
  let cleanUrl = logoUrl.replace(/\/s\d+-[^\/]+\//, '/s1000-c/');
  
  console.log(`🔧 Cleaned URL: ${logoUrl.substring(0, 50)}... → ${cleanUrl.substring(0, 50)}...`);
  return cleanUrl;
}

/**
 * Extract dominant colors from an image URL using Sharp
 */
async function extractColorsFromLogo(logoUrl) {
  try {
    console.log(`🎨 Analyzing: ${logoUrl.substring(0, 60)}...`);
    
    // Clean up Google Photos URLs to get high quality
    const cleanUrl = cleanLogoUrl(logoUrl);
    
    // Download the image
    const response = await axios.get(cleanUrl, { 
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ColorExtractor/1.0)'
      }
    });
    
    const imageBuffer = Buffer.from(response.data);
    
    // Use Sharp to get dominant colors
    const { dominant } = await sharp(imageBuffer)
      .resize(200, 200, { fit: 'inside', withoutEnlargement: true })
      .stats();
    
    // Get image statistics for color analysis
    const image = sharp(imageBuffer).resize(100, 100);
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
    
    // Extract color information
    const colors = extractColorsFromBuffer(data, info);
    
    return {
      success: true,
      primary: colors.primary,
      secondary: colors.secondary,
      quality: colors.quality,
      cleanUrl: cleanUrl,
      originalUrl: logoUrl
    };
    
  } catch (error) {
    console.log(`❌ Failed to extract colors: ${error.message}`);
    return {
      success: false,
      error: error.message,
      originalUrl: logoUrl
    };
  }
}

/**
 * Extract colors from raw image buffer
 */
function extractColorsFromBuffer(buffer, info) {
  const { width, height, channels } = info;
  const colors = {};
  
  // Sample pixels and count colors
  const colorCounts = new Map();
  const sampleRate = 4; // Sample every 4th pixel for performance
  
  for (let i = 0; i < buffer.length; i += channels * sampleRate) {
    const r = buffer[i];
    const g = buffer[i + 1];
    const b = buffer[i + 2];
    
    // Skip very light/dark colors (likely background)
    const brightness = (r + g + b) / 3;
    if (brightness < 30 || brightness > 225) continue;
    
    const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    colorCounts.set(hex, (colorCounts.get(hex) || 0) + 1);
  }
  
  // Sort colors by frequency
  const sortedColors = Array.from(colorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  if (sortedColors.length === 0) {
    return {
      primary: '#1E40AF',
      secondary: '#F59E0B', 
      quality: 0.1
    };
  }
  
  const primary = sortedColors[0][0];
  const secondary = sortedColors.length > 1 ? sortedColors[1][0] : adjustColor(primary);
  
  // Calculate quality based on color variety
  const quality = Math.min(sortedColors.length / 10 + 0.3, 1.0);
  
  return {
    primary,
    secondary,
    quality: Math.round(quality * 100) / 100
  };
}

/**
 * Adjust color to create a complementary secondary color
 */
function adjustColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  // Create a complementary color by shifting hue
  const newR = Math.min(255, Math.max(0, 255 - r));
  const newG = Math.min(255, Math.max(0, g));
  const newB = Math.min(255, Math.max(0, b));
  
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}


/**
 * Get fallback colors based on business type/industry
 */
function getFallbackColors(businessData) {
  // Try to determine industry from business name or other fields
  const name = (businessData.name || '').toLowerCase();
  const category = (businessData.category || '').toLowerCase();
  
  for (const [industry, colors] of Object.entries(industryColors)) {
    if (name.includes(industry) || category.includes(industry)) {
      return colors;
    }
  }
  
  return industryColors.default;
}

/**
 * Process a batch of businesses
 */
async function processBatch(leads, startIndex = 0, batchSize = 10) {
  console.log(`\n🔄 Processing batch ${Math.floor(startIndex/batchSize) + 1}...`);
  
  const batch = leads.slice(startIndex, startIndex + batchSize);
  const results = [];
  
  for (let i = 0; i < batch.length; i++) {
    const lead = batch[i];
    console.log(`\n[${startIndex + i + 1}/${leads.length}] ${lead.name}`);
    
    let primaryColor, secondaryColor, colorSource;
    
    if (lead.logo) {
      // Try to extract colors from logo
      const extraction = await extractColorsFromLogo(lead.logo);
      
      if (extraction.success && extraction.quality > 0.4) {
        primaryColor = extraction.primary;
        secondaryColor = extraction.secondary;
        colorSource = 'extracted';
        console.log(`✅ Extracted: ${primaryColor} / ${secondaryColor} (quality: ${extraction.quality})`);
      } else {
        // Use fallback colors
        const fallback = getFallbackColors(lead);
        primaryColor = fallback.primary;
        secondaryColor = fallback.secondary;
        colorSource = 'fallback';
        console.log(`⚠️  Using fallback: ${primaryColor} / ${secondaryColor}`);
      }
    } else {
      // No logo, use fallback
      const fallback = getFallbackColors(lead);
      primaryColor = fallback.primary;
      secondaryColor = fallback.secondary;
      colorSource = 'no_logo';
      console.log(`ℹ️  No logo, using fallback: ${primaryColor} / ${secondaryColor}`);
    }
    
    // Prepare database update with colors and cleaned URL
    const updateData = {
      primary_color: primaryColor,
      secondary_color: secondaryColor
    };
    
    // If we have a cleaned URL, save it too
    if (lead.logo && colorSource === 'extracted') {
      const cleanUrl = cleanLogoUrl(lead.logo);
      if (cleanUrl !== lead.logo) {
        updateData.logo = cleanUrl;
        console.log(`🔧 Also saving cleaned URL`);
      }
    }
    
    // Update database
    const { error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', lead.id);
    
    if (error) {
      console.log(`❌ Database update failed for ${lead.name}: ${error.message}`);
      console.log(`   Details: ${JSON.stringify(error, null, 2)}`);
    } else {
      console.log(`💾 Updated database successfully`);
    }
    
    results.push({
      id: lead.id,
      name: lead.name,
      primaryColor,
      secondaryColor,
      colorSource,
      success: !error
    });
    
    // Small delay to avoid overwhelming services
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return results;
}

/**
 * Test database connection and permissions
 */
async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection and permissions...');
    
    // Test basic read access
    const { count, error: countError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.log(`❌ Database read test failed: ${countError.message}`);
      return false;
    }
    
    console.log(`✅ Database connection OK - Found ${count} total leads`);
    
    // Test write access with a dummy update (this should work with service role key)
    const { data: testLead, error: selectError } = await supabase
      .from('leads')
      .select('id, updated_at')
      .limit(1)
      .single();
    
    if (selectError) {
      console.log(`❌ Could not select test record: ${selectError.message}`);
      return false;
    }
    
    // Try updating the record with the same data (no-op but tests permissions)
    const { error: updateError } = await supabase
      .from('leads')
      .update({ updated_at: testLead.updated_at })
      .eq('id', testLead.id);
    
    if (updateError) {
      console.log(`❌ Database write permission test failed: ${updateError.message}`);
      console.log(`   This usually means the SUPABASE_SERVICE_ROLE_KEY is missing or incorrect`);
      return false;
    }
    
    console.log(`✅ Database write permissions OK`);
    return true;
  } catch (error) {
    console.log(`❌ Database connection test failed: ${error.message}`);
    return false;
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('🚀 Starting Logo Color Extraction Process');
    console.log('==========================================');
    
    // Test database connection first
    const connectionOK = await testDatabaseConnection();
    if (!connectionOK) {
      console.log('💥 Database connection/permission test failed. Please check:');
      console.log('   1. SUPABASE_SERVICE_ROLE_KEY is set in .env.local');
      console.log('   2. The service role key is correct');
      console.log('   3. Database is accessible');
      process.exit(1);
    }
    
    console.log('\n📊 Querying leads that need color extraction...');
    
    // Get all leads that need color extraction (has logo but no colors yet)
    const { data: leadsNeedingColors, error } = await supabase
      .from('leads')
      .select('id, name, logo, primary_color, secondary_color, business_type, category')
      .not('logo', 'is', null)
      .or('primary_color.is.null,secondary_color.is.null')
      .order('name');
    
    if (error) {
      console.log(`❌ Failed to query leads needing colors: ${error.message}`);
      throw error;
    }
    
    console.log(`📊 Found ${leadsNeedingColors.length} leads that need color extraction`);
    
    // Also get total counts for reference
    const { count: totalLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true });
      
    const { count: totalWithLogos } = await supabase
      .from('leads') 
      .select('*', { count: 'exact', head: true })
      .not('logo', 'is', null);
      
    const { count: totalWithColors } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .not('primary_color', 'is', null)
      .not('secondary_color', 'is', null);
    
    console.log(`📈 Total leads: ${totalLeads}`);
    console.log(`🖼️  Leads with logos: ${totalWithLogos}`); 
    console.log(`🎨 Leads already processed: ${totalWithColors}`);
    console.log(`⏳ Leads remaining to process: ${leadsNeedingColors.length}`);
    
    if (leadsNeedingColors.length === 0) {
      console.log('✅ All leads already have colors assigned!');
      return;
    }
    
    // Process in batches
    const batchSize = 5; // Small batches to avoid rate limits
    const totalBatches = Math.ceil(leadsNeedingColors.length / batchSize);
    let allResults = [];
    
    for (let i = 0; i < leadsNeedingColors.length; i += batchSize) {
      const batchResults = await processBatch(leadsNeedingColors, i, batchSize);
      allResults = allResults.concat(batchResults);
      
      console.log(`\n📈 Batch ${Math.floor(i/batchSize) + 1}/${totalBatches} completed`);
      
      // Longer delay between batches
      if (i + batchSize < leadsNeedingColors.length) {
        console.log('⏳ Waiting 2 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Summary
    console.log('\n🎉 Color Extraction Complete!');
    console.log('==============================');
    
    const successful = allResults.filter(r => r.success).length;
    const extracted = allResults.filter(r => r.colorSource === 'extracted').length;
    const fallback = allResults.filter(r => r.colorSource === 'fallback').length;
    const noLogo = allResults.filter(r => r.colorSource === 'no_logo').length;
    
    console.log(`✅ Successfully processed: ${successful}/${allResults.length}`);
    console.log(`🎨 Colors extracted from logos: ${extracted}`);
    console.log(`⚠️  Fallback colors used: ${fallback}`);
    console.log(`ℹ️  No logo (fallback): ${noLogo}`);
    
    // Show some examples
    console.log('\n📋 Sample Results:');
    allResults.slice(0, 5).forEach(result => {
      console.log(`- ${result.name}: ${result.primaryColor} / ${result.secondaryColor} (${result.colorSource})`);
    });
    
  } catch (error) {
    console.error('💥 Fatal Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { extractColorsFromLogo, getFallbackColors, processBatch };