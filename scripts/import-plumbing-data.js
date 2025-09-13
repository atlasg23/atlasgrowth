#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Files to import
const PLUMBING_FILES = [
  {
    path: 'data/outscraper-imports/plumbing/plumbing-la.csv',
    name: 'plumbing-la.csv'
  },
  {
    path: 'data/outscraper-imports/plumbing/plumbing-al.csv', 
    name: 'plumbing-al.csv'
  }
];

// Initialize Supabase client with service role key for database writes
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Read and parse a CSV file
 */
async function parseCSVFile(filePath) {
  console.log(`📖 Reading ${filePath}...`);
  
  const csvContent = fs.readFileSync(filePath, 'utf8');
  
  return new Promise((resolve, reject) => {
    Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          console.log(`⚠️  CSV parsing warnings for ${filePath}:`, results.errors.slice(0, 3));
        }
        
        console.log(`✅ Parsed ${results.data.length} rows from ${filePath}`);
        resolve(results.data);
      },
      error: (error) => {
        console.error(`❌ Error parsing ${filePath}:`, error);
        reject(error);
      }
    });
  });
}

/**
 * Process row data for database insert (same logic as API route)
 */
function processRowData(row, businessType, sourceFile) {
  const processedRow = {
    business_type: businessType,
    source_file: sourceFile
  }
  
  // Map all CSV fields to database columns (same as API route)
  const fieldMappings = {
    'query': 'query', 'name': 'name', 'name_for_emails': 'name_for_emails', 'site': 'site',
    'subtypes': 'subtypes', 'category': 'category', 'type': 'type', 'phone': 'phone',
    'phone.phones_enricher.carrier_type': 'phone_phones_enricher_carrier_type',
    'phone.phones_enricher.carrier_name': 'phone_phones_enricher_carrier_name',
    'full_address': 'full_address', 'borough': 'borough', 'street': 'street', 'city': 'city',
    'postal_code': 'postal_code', 'state': 'state', 'us_state': 'us_state', 'country': 'country',
    'country_code': 'country_code', 'latitude': 'latitude', 'longitude': 'longitude',
    'h3': 'h3', 'time_zone': 'time_zone', 'plus_code': 'plus_code', 'area_service': 'area_service',
    'rating': 'rating', 'reviews': 'reviews', 'reviews_link': 'reviews_link',
    'reviews_tags': 'reviews_tags', 'reviews_per_score': 'reviews_per_score',
    'reviews_per_score_1': 'reviews_per_score_1', 'reviews_per_score_2': 'reviews_per_score_2',
    'reviews_per_score_3': 'reviews_per_score_3', 'reviews_per_score_4': 'reviews_per_score_4',
    'reviews_per_score_5': 'reviews_per_score_5', 'photos_count': 'photos_count',
    'photo': 'photo', 'street_view': 'street_view', 'logo': 'logo', 'located_in': 'located_in',
    'working_hours': 'working_hours', 'working_hours_csv_compatible': 'working_hours_csv_compatible',
    'working_hours_old_format': 'working_hours_old_format', 'other_hours': 'other_hours',
    'popular_times': 'popular_times', 'business_status': 'business_status', 'about': 'about',
    'range': 'range', 'prices': 'prices', 'posts': 'posts', 'description': 'description',
    'typical_time_spent': 'typical_time_spent', 'verified': 'verified', 'owner_id': 'owner_id',
    'owner_title': 'owner_title', 'owner_link': 'owner_link', 'reservation_links': 'reservation_links',
    'booking_appointment_link': 'booking_appointment_link', 'menu_link': 'menu_link',
    'order_links': 'order_links', 'location_link': 'location_link',
    'location_reviews_link': 'location_reviews_link', 'place_id': 'place_id', 'google_id': 'google_id',
    'cid': 'cid', 'kgmid': 'kgmid', 'reviews_id': 'reviews_id', 'located_google_id': 'located_google_id',
    'email_1': 'email_1', 'email_1.emails_validator.status': 'email_1_emails_validator_status',
    'email_1.emails_validator.status_details': 'email_1_emails_validator_status_details',
    'email_1_full_name': 'email_1_full_name', 'email_1_first_name': 'email_1_first_name',
    'email_1_last_name': 'email_1_last_name', 'email_1_title': 'email_1_title',
    'email_1_phone': 'email_1_phone', 'email_2': 'email_2',
    'email_2.emails_validator.status': 'email_2_emails_validator_status',
    'email_2.emails_validator.status_details': 'email_2_emails_validator_status_details',
    'phone_1': 'phone_1', 'phone_1.phones_enricher.carrier_name': 'phone_1_phones_enricher_carrier_name',
    'phone_1.phones_enricher.carrier_type': 'phone_1_phones_enricher_carrier_type'
  }
  
  // Process each field with type conversion
  for (const [csvField, dbField] of Object.entries(fieldMappings)) {
    const value = row[csvField]
    
    if (value === null || value === undefined || value === '') {
      continue
    }
    
    // Handle special cases
    if (dbField === 'latitude' || dbField === 'longitude') {
      const numValue = parseFloat(value)
      if (!isNaN(numValue)) {
        processedRow[dbField] = numValue
      }
    } else if (dbField === 'cid') {
      processedRow[dbField] = String(value).trim()
    } else if (dbField === 'area_service') {
      processedRow[dbField] = ['true', '1', 'yes', 'True', 'TRUE'].includes(String(value))
    } else {
      const cleanValue = String(value).trim()
      if (cleanValue && cleanValue !== 'N/A' && cleanValue !== 'null') {
        processedRow[dbField] = cleanValue
      }
    }
  }
  
  return processedRow
}

/**
 * Import data directly to database
 */
async function importData(data, fileName) {
  console.log(`\n🚀 Importing ${data.length} records from ${fileName}...`);
  
  try {
    // Process all records
    const processedRows = []
    const errorRows = []
    
    for (let i = 0; i < data.length; i++) {
      try {
        const processedRow = processRowData(data[i], 'plumbing', fileName)
        
        if (!processedRow.name) {
          throw new Error('Business name is required')
        }
        
        processedRows.push(processedRow)
      } catch (error) {
        errorRows.push({
          row: i + 1,
          reason: error instanceof Error ? error.message : 'Invalid data',
          data: data[i]
        })
      }
    }
    
    let insertedCount = 0
    const insertErrors = []
    let duplicateCount = 0
    
    if (processedRows.length > 0) {
      // Insert in batches of 20 (smaller for complex schema)
      const batchSize = 20
      for (let i = 0; i < processedRows.length; i += batchSize) {
        const batch = processedRows.slice(i, i + batchSize)
        
        console.log(`   Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(processedRows.length/batchSize)}...`)
        
        const { data: inserted, error } = await supabase
          .from('leads')
          .insert(batch)
          .select('id, name, place_id')
        
        if (error) {
          console.log(`   ⚠️  Batch ${Math.floor(i/batchSize) + 1} error: ${error.message}`)
          // Check if it's a duplicate place_id error
          if (error.message?.includes('duplicate key') && error.message?.includes('place_id')) {
            duplicateCount += batch.length
            console.log(`   🔄 ${batch.length} duplicates skipped`)
          } else {
            insertErrors.push({
              batch: Math.floor(i / batchSize) + 1,
              error: error.message,
              rows: batch.length
            })
          }
        } else {
          insertedCount += batch.length
          console.log(`   ✅ ${batch.length} records inserted`)
        }
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }
    
    const result = {
      success: insertErrors.length === 0,
      summary: {
        totalRows: data.length,
        processed: processedRows.length,
        inserted: insertedCount,
        duplicates: duplicateCount,
        errors: errorRows.length + insertErrors.length,
        businessType: 'plumbing',
        sourceFile: fileName
      },
      details: {
        errorRows: errorRows.slice(0, 10),
        insertErrors: insertErrors
      }
    }
    
    console.log(`\n📊 Import Results for ${fileName}:`);
    console.log(`   ✅ Total rows processed: ${result.summary.totalRows}`);
    console.log(`   💾 Successfully inserted: ${result.summary.inserted}`);
    console.log(`   🔄 Duplicates skipped: ${result.summary.duplicates}`);
    console.log(`   ⚠️  Errors: ${result.summary.errors}`);
    
    if (result.details.errorRows.length > 0) {
      console.log(`\n🚨 First few errors:`);
      result.details.errorRows.slice(0, 3).forEach(err => {
        console.log(`   - Row ${err.row}: ${err.reason}`);
      });
    }
    
    if (result.details.insertErrors.length > 0) {
      console.log(`\n💥 Insert errors:`);
      result.details.insertErrors.forEach(err => {
        console.log(`   - Batch ${err.batch}: ${err.error}`);
      });
    }
    
    return result;
    
  } catch (error) {
    console.error(`❌ Import failed for ${fileName}: ${error.message}`);
    throw error;
  }
}

/**
 * Main import process
 */
async function main() {
  try {
    console.log('🔧 Starting Plumbing Data Import');
    console.log('================================');
    console.log(`Database: Direct Supabase connection`);
    
    // Check if files exist
    for (const file of PLUMBING_FILES) {
      if (!fs.existsSync(file.path)) {
        throw new Error(`File not found: ${file.path}`);
      }
    }
    
    let totalImported = 0;
    let totalDuplicates = 0;
    let totalErrors = 0;
    
    // Process each file
    for (const file of PLUMBING_FILES) {
      try {
        console.log(`\n📋 Processing ${file.name}...`);
        
        // Parse CSV
        const data = await parseCSVFile(file.path);
        
        if (data.length === 0) {
          console.log(`⚠️  No data found in ${file.name}, skipping...`);
          continue;
        }
        
        // Import to database
        const result = await importData(data, file.name);
        
        totalImported += result.summary.inserted;
        totalDuplicates += result.summary.duplicates;
        totalErrors += result.summary.errors;
        
        console.log(`✅ ${file.name} import completed`);
        
        // Small delay between files
        console.log('⏳ Waiting 2 seconds before next file...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`💥 Failed to process ${file.name}:`, error.message);
        // Continue with next file
      }
    }
    
    // Summary
    console.log('\n🎉 Plumbing Import Complete!');
    console.log('=============================');
    console.log(`📈 Total imported: ${totalImported} plumbers`);
    console.log(`🔄 Total duplicates: ${totalDuplicates}`);
    console.log(`⚠️  Total errors: ${totalErrors}`);
    console.log('\n💡 Next steps:');
    console.log('1. Check dashboard - should now show hundreds of plumbers');
    console.log('2. Run logo color extraction: node scripts/extract-logo-colors.js');
    console.log('3. Test a plumber business page with authentic brand colors');
    
  } catch (error) {
    console.error('💥 Fatal Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { parseCSVFile, importData };