const Papa = require('papaparse');
const fs = require('fs');
const csv = fs.readFileSync('data/hvac-test-10-logos.csv', 'utf8');
const data = Papa.parse(csv, {header: true}).data;

console.log('=== 10 BUSINESSES - LOGOS AND COLORS ===\n');

data.slice(0, 10).forEach((row, i) => {
  console.log(`${i+1}. ${row.name || 'Unknown'}`);

  if (row.logo_original) {
    console.log(`   Original: ${row.logo_original}`);
    console.log(`   Cleaned:  ${row.logo_cleaned}`);
    console.log(`   Primary:  ${row.primary_color || 'None'}`);
    console.log(`   Secondary: ${row.secondary_color || 'None'}`);
  } else {
    console.log(`   No logo available`);
  }

  if (row.color_extraction_error && row.color_extraction_error !== 'No logo URL provided') {
    console.log(`   Error: ${row.color_extraction_error}`);
  }

  console.log('');
});