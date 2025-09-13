const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const { Vibrant } = require('node-vibrant/node');

/**
 * Clean logo URL by removing Google's size and format parameters
 * @param {string} logoUrl - Original logo URL
 * @returns {string} - Cleaned logo URL
 */
function cleanLogoUrl(logoUrl) {
  if (!logoUrl || !logoUrl.includes('googleusercontent.com')) {
    return logoUrl;
  }

  // Remove everything after the last slash that contains size/format params
  // e.g., /s44-p-k-no-ns-nd/photo.jpg -> /photo.jpg
  return logoUrl.replace(/\/s\d+-[^\/]*\//, '/');
}

/**
 * Extract primary and secondary colors from logo image
 * @param {string} logoUrl - Logo image URL
 * @returns {Promise<Object>} - Color palette object
 */
async function extractColors(logoUrl) {
  try {
    if (!logoUrl) {
      return { primary: null, secondary: null, error: 'No logo URL provided' };
    }

    const palette = await Vibrant.from(logoUrl).getPalette();

    const colors = {
      primary: palette.Vibrant?.hex || palette.DarkVibrant?.hex || palette.Muted?.hex || null,
      secondary: palette.LightVibrant?.hex || palette.DarkMuted?.hex || palette.LightMuted?.hex || null,
      vibrant: palette.Vibrant?.hex,
      darkVibrant: palette.DarkVibrant?.hex,
      lightVibrant: palette.LightVibrant?.hex,
      muted: palette.Muted?.hex,
      darkMuted: palette.DarkMuted?.hex,
      lightMuted: palette.LightMuted?.hex
    };

    return colors;
  } catch (error) {
    console.error(`Error extracting colors from ${logoUrl}:`, error.message);
    return {
      primary: null,
      secondary: null,
      error: error.message
    };
  }
}

/**
 * Process CSV file to clean logos and extract colors
 * @param {string} inputFile - Input CSV file path
 * @param {string} outputFile - Output CSV file path
 * @param {number} limit - Limit number of rows to process (for testing)
 */
async function processLogos(inputFile, outputFile, limit = null) {
  console.log(`Processing logos from ${inputFile}...`);

  try {
    // Read CSV file
    const csvContent = fs.readFileSync(inputFile, 'utf8');
    const parsed = Papa.parse(csvContent, { header: true });

    let businesses = parsed.data;
    if (limit) {
      businesses = businesses.slice(0, limit);
      console.log(`Limited processing to ${limit} rows for testing`);
    }

    console.log(`Found ${businesses.length} businesses to process`);

    // Process each business
    const processed = [];
    for (let i = 0; i < businesses.length; i++) {
      const business = businesses[i];
      console.log(`Processing ${i + 1}/${businesses.length}: ${business.name || 'Unknown'}`);

      // Clean logo URL
      const originalLogo = business.logo;
      const cleanedLogo = cleanLogoUrl(originalLogo);

      // Extract colors
      const colors = await extractColors(cleanedLogo);

      // Add new fields to business data
      const processedBusiness = {
        ...business,
        logo_original: originalLogo,
        logo_cleaned: cleanedLogo,
        primary_color: colors.primary,
        secondary_color: colors.secondary,
        color_vibrant: colors.vibrant,
        color_dark_vibrant: colors.darkVibrant,
        color_light_vibrant: colors.lightVibrant,
        color_muted: colors.muted,
        color_dark_muted: colors.darkMuted,
        color_light_muted: colors.lightMuted,
        color_extraction_error: colors.error || null
      };

      processed.push(processedBusiness);

      // Add small delay to avoid overwhelming the image service
      if (cleanedLogo && i < businesses.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Write output CSV
    const csv = Papa.unparse(processed);
    fs.writeFileSync(outputFile, csv);

    console.log(`\nProcessing complete!`);
    console.log(`Output saved to: ${outputFile}`);
    console.log(`Processed ${processed.length} businesses`);

    // Summary stats
    const withLogos = processed.filter(b => b.logo_cleaned).length;
    const withColors = processed.filter(b => b.primary_color).length;
    const withErrors = processed.filter(b => b.color_extraction_error).length;

    console.log(`\nSummary:`);
    console.log(`- Businesses with logos: ${withLogos}`);
    console.log(`- Successful color extractions: ${withColors}`);
    console.log(`- Color extraction errors: ${withErrors}`);

  } catch (error) {
    console.error('Error processing logos:', error);
    throw error;
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: node process-logos.js <input-csv> <output-csv> [limit]');
    console.log('');
    console.log('Examples:');
    console.log('  node process-logos.js data/businesses.csv data/businesses-with-colors.csv');
    console.log('  node process-logos.js data/hvac.csv data/hvac-processed.csv 10');
    process.exit(1);
  }

  const [inputFile, outputFile, limitStr] = args;
  const limit = limitStr ? parseInt(limitStr) : null;

  if (!fs.existsSync(inputFile)) {
    console.error(`Input file not found: ${inputFile}`);
    process.exit(1);
  }

  processLogos(inputFile, outputFile, limit)
    .then(() => {
      console.log('Script completed successfully!');
    })
    .catch(error => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { cleanLogoUrl, extractColors, processLogos };