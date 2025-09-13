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

// Function to generate a unique slug from business name
function generateSlug(name, index) {
  if (!name) return '';
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .substring(0, 40);
  // Add timestamp and index to ensure uniqueness
  return `${base}_${Date.now()}_${index}`;
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
function mapRowToLead(row, businessType, sourceFile, index) {
  // Generate unique slug
  const slug = generateSlug(row.name || row.Name || '', index);
  
  // Clear out empty place_ids to avoid constraint issues
  const placeId = (row.place_id || row['Place Id'] || '').trim();
  const googleId = (row.google_id || row['Google Id'] || '').trim();
  const cid = (row.cid || row.CID || '').trim();
  
  return {
    // Core fields
    business_type: businessType,
    source_file: path.basename(sourceFile),
    import_date: new Date().toISOString(),
    
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
    
    // Address
    full_address: row.full_address || row['Full Address'] || '',
    street: row.street || row.Street || '',
    city: row.city || row.City || '',
    postal_code: row.postal_code || row['Postal Code'] || '',
    state: row.state || row.State || row.us_state || '',
    country: row.country || row.Country || 'United States of America',
    latitude: parseFloat(row.latitude || row.Latitude) || null,
    longitude: parseFloat(row.longitude || row.Longitude) || null,
    
    // Reviews and ratings
    rating: row.rating || row.Rating || '',
    reviews: row.reviews || row.Reviews || '',
    reviews_link: row.reviews_link || row['Reviews Link'] || '',
    
    // Images
    photo: row.photo || row.Photo || '',
    logo: row.logo || row.Logo || '',
    
    // Business details
    working_hours: row.working_hours || row['Working Hours'] || '',
    business_status: row.business_status || row['Business Status'] || 'OPERATIONAL',
    verified: row.verified || row.Verified || 'FALSE',
    
    // IDs - only include if not empty
    place_id: placeId || null,
    google_id: googleId || null,
    cid: cid || null,
    
    // Social media
    facebook: row.facebook || row.Facebook || '',
    instagram: row.instagram || row.Instagram || '',
    linkedin: row.linkedin || row.LinkedIn || '',
    twitter: row.twitter || row.Twitter || null,
    youtube: row.youtube || row.YouTube || null,
    
    // Additional fields
    photos_count: row.photos_count || row['Photos Count'] || '',
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
  console.log('LEADS TABLE RESTORATION SCRIPT');
  console.log('='.repeat(60));
  
  // Step 1: Clear the leads table
  console.log('\n1. CLEARING EXISTING LEADS TABLE...');
  console.log('-'.repeat(40));
  
  try {
    const { data: deleteData, error: deleteError } = await supabase
      .from('leads')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
    
    if (deleteError) {
      console.error('Error clearing leads table:', deleteError);
      console.log('Continuing anyway...');
    } else {
      console.log('✅ Leads table cleared successfully');
    }
  } catch (error) {
    console.error('Error clearing leads table:', error);
    console.log('Continuing anyway...');
  }
  
  // Step 2: Collect all CSV files
  console.log('\n2. COLLECTING CSV FILES...');
  console.log('-'.repeat(40));
  
  const baseDir = path.join(__dirname, '..', 'data', 'outscraper-imports');
  const allLeads = [];
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
        
        data.forEach((row, index) => {
          if (row.name || row.Name) {
            const lead = mapRowToLead(row, folder.type, csvFile, allLeads.length + index);
            allLeads.push(lead);
            validCount++;
          }
        });
        
        console.log(`    ✓ Found ${validCount} valid records`);
        fileCount++;
      }
    } catch (error) {
      console.log(`  ⚠ Skipping ${folder.name}: ${error.message}`);
    }
  }
  
  console.log(`\n  Total records collected: ${allLeads.length} from ${fileCount} files`);
  
  // Step 3: Insert all leads in batches
  console.log('\n3. INSERTING LEADS INTO DATABASE...');
  console.log('-'.repeat(40));
  
  const BATCH_SIZE = 500;
  let inserted = 0;
  let errors = 0;
  
  for (let i = 0; i < allLeads.length; i += BATCH_SIZE) {
    const batch = allLeads.slice(i, Math.min(i + BATCH_SIZE, allLeads.length));
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(allLeads.length / BATCH_SIZE);
    
    try {
      const { data, error } = await supabase
        .from('leads')
        .insert(batch);
      
      if (error) {
        console.error(`  ❌ Batch ${batchNum}/${totalBatches} failed:`, error.message);
        errors += batch.length;
      } else {
        inserted += batch.length;
        console.log(`  ✓ Batch ${batchNum}/${totalBatches}: Inserted ${batch.length} records (Total: ${inserted}/${allLeads.length})`);
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
  console.log(`  Records inserted: ${inserted}`);
  console.log(`  Errors: ${errors}`);
  
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