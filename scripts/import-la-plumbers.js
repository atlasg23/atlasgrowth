const fs = require('fs');
const Papa = require('papaparse');
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

async function importLouisianaPlumbers() {
  console.log('🚀 Importing Louisiana plumbers...');
  
  const filePath = 'data/outscraper-imports/plumbing/plumbing-la.csv';
  const businessType = 'plumbing';
  
  try {
    // Read CSV
    const csvContent = fs.readFileSync(filePath, 'utf8');
    const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true });
    const data = parsed.data;
    
    console.log(`📊 Found ${data.length} plumber records`);
    
    let inserted = 0;
    let duplicates = 0;
    let errors = 0;
    
    for (const [index, row] of data.entries()) {
      try {
        // Filter out columns that don't exist in our schema
        const cleanRow = {};
        for (const [key, value] of Object.entries(row)) {
          // Skip company_insights columns and other problematic ones
          if (!key.includes('company_insights') && 
              !key.includes('.') && 
              value !== undefined && 
              value !== '') {
            cleanRow[key] = value;
          }
        }
        
        // Create record with business_type
        const record = {
          ...cleanRow,
          business_type: businessType,
          import_date: new Date().toISOString()
        };
        
        // Check for duplicate by place_id
        if (row.place_id) {
          const { data: existing } = await supabaseAdmin
            .from('leads')
            .select('id')
            .eq('place_id', row.place_id)
            .single();
          
          if (existing) {
            duplicates++;
            if (index % 100 === 0) {
              console.log(`⏳ Progress: ${index + 1}/${data.length} (${duplicates} duplicates, ${inserted} new)`);
            }
            continue;
          }
        }
        
        // Insert record
        const { error } = await supabaseAdmin
          .from('leads')
          .insert([record]);
        
        if (error) {
          console.error(`❌ Error inserting record ${index + 1}:`, error.message);
          errors++;
        } else {
          inserted++;
        }
        
        if (index % 100 === 0) {
          console.log(`⏳ Progress: ${index + 1}/${data.length} (${duplicates} duplicates, ${inserted} new)`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing record ${index + 1}:`, error.message);
        errors++;
      }
    }
    
    console.log('\n📊 IMPORT SUMMARY:');
    console.log(`✅ Successfully inserted: ${inserted}`);
    console.log(`⚠️  Duplicates skipped: ${duplicates}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📋 Total processed: ${data.length}`);
    
    return { inserted, duplicates, errors, total: data.length };
    
  } catch (error) {
    console.error('💥 Import failed:', error);
    return null;
  }
}

// Run the import
if (require.main === module) {
  importLouisianaPlumbers()
    .then((result) => {
      if (result) {
        console.log('🎉 Import completed!');
        process.exit(0);
      } else {
        console.log('❌ Import failed');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('💥 Script error:', error);
      process.exit(1);
    });
}

module.exports = { importLouisianaPlumbers };