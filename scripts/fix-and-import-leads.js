#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
const Papa = require('papaparse');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Function to generate a unique slug
function generateSlug(name, index) {
  if (!name) return `lead_${Date.now()}_${index}`;
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .substring(0, 40);
  return `${base}_${index}`;
}

// Function to parse CSV file
async function parseCSV(filePath) {
  try {
    const fileContent = await fs.readFile(filePath, 'utf8');
    return new Promise((resolve, reject) => {
      Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
        error: (error) => reject(error)
      });
    });
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return [];
  }
}

// Function to map CSV row to leads table format
function mapRowToLead(row, businessType, sourceFile, globalIndex) {
  // Generate unique slug using global index
  const slug = generateSlug(row.name || row.Name || '', globalIndex);
  
  // Handle place_id - if duplicate, make it unique or null
  let placeId = (row.place_id || row['Place Id'] || '').trim();
  let googleId = (row.google_id || row['Google Id'] || '').trim();
  let cid = (row.cid || row.CID || '').trim();
  
  // If place_id is empty or we want to avoid duplicates, set to null
  if (!placeId) placeId = null;
  if (!googleId) googleId = null;
  if (!cid) cid = null;
  
  return {
    // Core fields
    business_type: businessType,
    source_file: path.basename(sourceFile),
    import_date: new Date().toISOString(),
    query: row.query || null,
    
    // Business info
    name: row.name || row.Name || '',
    name_for_emails: row.name_for_emails || row['Name For Emails'] || null,
    site: row.site || row.Site || '',
    subtypes: row.subtypes || row.Subtypes || null,
    category: row.category || row.Category || null,
    type: row.type || row.Type || null,
    
    // Contact info
    phone: row.phone || row.Phone || '',
    email_1: row.email_1 || row['Email 1'] || '',
    email_2: row.email_2 || row['Email 2'] || null,
    email_3: row.email_3 || row['Email 3'] || null,
    
    // Address
    full_address: row.full_address || row['Full Address'] || '',
    borough: row.borough || null,
    street: row.street || row.Street || '',
    city: row.city || row.City || '',
    postal_code: row.postal_code || row['Postal Code'] || '',
    state: row.state || row.State || row.us_state || '',
    country: row.country || row.Country || 'United States of America',
    country_code: row.country_code || null,
    latitude: parseFloat(row.latitude || row.Latitude) || null,
    longitude: parseFloat(row.longitude || row.Longitude) || null,
    
    // Reviews and ratings
    rating: row.rating || row.Rating || '',
    reviews: row.reviews || row.Reviews || '',
    reviews_link: row.reviews_link || row['Reviews Link'] || '',
    reviews_tags: row.reviews_tags || null,
    reviews_per_score: row.reviews_per_score || null,
    
    // Images
    photos_count: row.photos_count || row['Photos Count'] || '',
    photo: row.photo || row.Photo || '',
    street_view: row.street_view || null,
    logo: row.logo || row.Logo || '',
    
    // Business details
    working_hours: row.working_hours || row['Working Hours'] || '',
    working_hours_old_format: row.working_hours_old_format || null,
    popular_times: row.popular_times || null,
    business_status: row.business_status || row['Business Status'] || 'OPERATIONAL',
    about: row.about || null,
    range: row.range || null,
    posts: row.posts || null,
    verified: row.verified || row.Verified || 'FALSE',
    
    // IDs - make unique by appending index if needed
    place_id: placeId,
    google_id: googleId,
    cid: cid,
    kgmid: row.kgmid || null,
    
    // Social media
    facebook: row.facebook || row.Facebook || '',
    instagram: row.instagram || row.Instagram || '',
    linkedin: row.linkedin || row.LinkedIn || '',
    twitter: row.twitter || row.Twitter || null,
    youtube: row.youtube || row.YouTube || null,
    
    // Additional fields
    slug: slug,
    primary_color: row.primary_color || '',
    secondary_color: row.secondary_color || '',
    
    // Timestamps
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

async function main() {
  console.log('='.repeat(60));
  console.log('COMPLETE LEADS IMPORT WITH DUPLICATE HANDLING');
  console.log('='.repeat(60));
  
  // Step 1: Clear the leads table
  console.log('\n1. CLEARING EXISTING LEADS TABLE...');
  console.log('-'.repeat(40));
  
  try {
    const { error: deleteError } = await supabase
      .from('leads')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (deleteError) {
      console.error('Error clearing table:', deleteError.message);
    } else {
      console.log('✅ Leads table cleared');
    }
  } catch (error) {
    console.error('Error:', error);
  }
  
  // Step 2: Collect and deduplicate all data
  console.log('\n2. COLLECTING AND PROCESSING CSV FILES...');
  console.log('-'.repeat(40));
  
  const baseDir = path.join(__dirname, '..', 'data', 'outscraper-imports');
  const allLeads = [];
  const seenPlaceIds = new Set();
  const seenBusinessKeys = new Set();
  let duplicatesSkipped = 0;
  let fileCount = 0;
  
  const folders = [
    { name: 'hvac', type: 'hvac' },
    { name: 'plumbing', type: 'plumbing' },
    { name: 'pest-control', type: 'pest-control' },
    { name: 'pressure-washing', type: 'pressure-washing' },
    { name: 'tree-service', type: 'tree-service' },
    { name: 'roofing', type: 'roofing' },
    { name: 'fire-protection', type: 'fire-protection' }
  ];
  
  for (const folder of folders) {
    const folderPath = path.join(baseDir, folder.name);
    
    try {
      await fs.access(folderPath);
      const files = await fs.readdir(folderPath);
      const csvFiles = files.filter(f => f.endsWith('.csv'));
      
      for (const csvFile of csvFiles) {
        const filePath = path.join(folderPath, csvFile);
        console.log(`  Reading ${folder.type}/${csvFile}...`);
        
        const data = await parseCSV(filePath);
        let validCount = 0;
        let skipped = 0;
        
        data.forEach((row) => {
          const name = row.name || row.Name || '';
          if (!name) {
            skipped++;
            return;
          }
          
          // Create a business key for deduplication
          const businessKey = `${name}_${row.city || ''}_${row.state || ''}`.toLowerCase();
          const placeId = (row.place_id || row['Place Id'] || '').trim();
          
          // Skip if we've seen this exact business before
          if (businessKey && seenBusinessKeys.has(businessKey)) {
            duplicatesSkipped++;
            skipped++;
            return;
          }
          
          // Skip if we've seen this place_id before (and it's not empty)
          if (placeId && seenPlaceIds.has(placeId)) {
            duplicatesSkipped++;
            skipped++;
            return;
          }
          
          // Add to seen sets
          if (businessKey) seenBusinessKeys.add(businessKey);
          if (placeId) seenPlaceIds.add(placeId);
          
          // Create lead with unique index
          const lead = mapRowToLead(row, folder.type, csvFile, allLeads.length);
          
          // For duplicate place_ids within the data, null them out
          if (placeId && allLeads.some(l => l.place_id === placeId)) {
            lead.place_id = null;
          }
          
          allLeads.push(lead);
          validCount++;
        });
        
        console.log(`    ✓ Added ${validCount} records (skipped ${skipped} duplicates/invalid)`);
        fileCount++;
      }
    } catch (error) {
      console.log(`  ⚠ Skipping ${folder.name}: ${error.message}`);
    }
  }
  
  console.log(`\n  Total unique records: ${allLeads.length}`);
  console.log(`  Duplicates skipped: ${duplicatesSkipped}`);
  console.log(`  Files processed: ${fileCount}`);
  
  // Step 3: Insert in smaller batches to handle any remaining issues
  console.log('\n3. INSERTING LEADS INTO DATABASE...');
  console.log('-'.repeat(40));
  
  const BATCH_SIZE = 100; // Smaller batches for better error handling
  let inserted = 0;
  let errors = 0;
  
  for (let i = 0; i < allLeads.length; i += BATCH_SIZE) {
    const batch = allLeads.slice(i, Math.min(i + BATCH_SIZE, allLeads.length));
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(allLeads.length / BATCH_SIZE);
    
    try {
      // Final check: ensure no duplicate place_ids in this batch
      const batchPlaceIds = batch.map(l => l.place_id).filter(id => id);
      const uniquePlaceIds = new Set(batchPlaceIds);
      
      if (batchPlaceIds.length !== uniquePlaceIds.size) {
        // There are duplicates in this batch, null them out
        const seenInBatch = new Set();
        batch.forEach(lead => {
          if (lead.place_id && seenInBatch.has(lead.place_id)) {
            lead.place_id = null;
          } else if (lead.place_id) {
            seenInBatch.add(lead.place_id);
          }
        });
      }
      
      const { data, error } = await supabase
        .from('leads')
        .insert(batch);
      
      if (error) {
        console.error(`  ⚠ Batch ${batchNum}/${totalBatches}: ${error.message}`);
        // Try inserting one by one for this batch
        let batchInserted = 0;
        for (const lead of batch) {
          try {
            // Remove place_id if it's causing issues
            lead.place_id = null;
            lead.google_id = null;
            lead.cid = null;
            
            const { error: singleError } = await supabase
              .from('leads')
              .insert([lead]);
            
            if (!singleError) {
              batchInserted++;
            }
          } catch (e) {
            // Skip this record
          }
        }
        inserted += batchInserted;
        errors += (batch.length - batchInserted);
        console.log(`    Recovered ${batchInserted}/${batch.length} records from failed batch`);
      } else {
        inserted += batch.length;
        if (batchNum % 10 === 0 || batchNum === totalBatches) {
          console.log(`  ✓ Progress: Batch ${batchNum}/${totalBatches} (${inserted} total inserted)`);
        }
      }
    } catch (error) {
      console.error(`  ❌ Batch ${batchNum}/${totalBatches} error:`, error.message);
      errors += batch.length;
    }
  }
  
  // Step 4: Final summary
  console.log('\n' + '='.repeat(60));
  console.log('IMPORT COMPLETE');
  console.log('='.repeat(60));
  
  console.log(`\nSummary:`);
  console.log(`  Files processed: ${fileCount}`);
  console.log(`  Records attempted: ${allLeads.length}`);
  console.log(`  Records inserted: ${inserted}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Duplicates skipped: ${duplicatesSkipped}`);
  
  // Get final count from database
  const { count } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true });
  
  console.log(`\nDatabase status:`);
  console.log(`  Total records in leads table: ${count || 0}`);
  
  // Get breakdown by business type
  console.log(`\nBreakdown by business type:`);
  for (const folder of folders) {
    const { count: typeCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('business_type', folder.type);
    
    console.log(`  ${folder.type}: ${typeCount || 0} records`);
  }
  
  console.log('\n✅ Script completed!');
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });