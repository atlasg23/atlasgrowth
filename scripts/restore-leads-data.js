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

// Business types to import
const BUSINESS_TYPES = {
  'hvac': 'hvac',
  'plumbing': 'plumbing',
  'pest-control': 'pest-control',
  'pressure-washing': 'pressure-washing',
  'tree-service': 'tree-service',
  'roofing': 'roofing',
  'fire-protection': 'fire-protection'
};

// Function to generate a slug from business name
function generateSlug(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .substring(0, 50);
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
function mapRowToLead(row, businessType, sourceFile) {
  // Generate slug from name
  const slug = generateSlug(row.name || row.Name || '');
  
  // Map all fields, handling different CSV column names
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
    
    // IDs
    place_id: row.place_id || row['Place Id'] || '',
    google_id: row.google_id || row['Google Id'] || '',
    cid: row.cid || row.CID || '',
    
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

// Function to import a CSV file
async function importCSVFile(filePath, businessType) {
  console.log(`\nImporting ${filePath}...`);
  
  const data = await parseCSV(filePath);
  if (!data || data.length === 0) {
    console.log(`  No data found in ${filePath}`);
    return { imported: 0, skipped: 0, errors: 0 };
  }
  
  console.log(`  Found ${data.length} records to import`);
  
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  
  // Process records one by one to handle duplicates
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const lead = mapRowToLead(row, businessType, filePath);
    
    // Skip if no name
    if (!lead.name || lead.name.trim() === '') {
      skipped++;
      continue;
    }
    
    try {
      // Check if record already exists by place_id or slug
      let exists = false;
      
      if (lead.place_id && lead.place_id !== '') {
        const { data: existing } = await supabase
          .from('leads')
          .select('id')
          .eq('place_id', lead.place_id)
          .single();
        
        if (existing) {
          exists = true;
        }
      }
      
      if (!exists && lead.slug && lead.slug !== '') {
        const { data: existing } = await supabase
          .from('leads')
          .select('id')
          .eq('slug', lead.slug)
          .single();
        
        if (existing) {
          exists = true;
        }
      }
      
      if (exists) {
        skipped++;
        continue;
      }
      
      // Clear place_id and regenerate slug if they might cause conflicts
      if (lead.place_id === '') lead.place_id = null;
      if (lead.google_id === '') lead.google_id = null;
      if (lead.cid === '') lead.cid = null;
      
      // Make slug unique by adding random suffix if needed
      if (lead.slug) {
        lead.slug = lead.slug + '_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
      }
      
      // Insert single record
      const { error } = await supabase
        .from('leads')
        .insert([lead]);
      
      if (error) {
        errors++;
        if (i < 5 || errors < 5) { // Only log first few errors
          console.error(`  Error on record ${i + 1} (${lead.name}):`, error.message);
        }
      } else {
        imported++;
        if (imported % 100 === 0) {
          console.log(`  Progress: ${imported} imported, ${skipped} skipped, ${errors} errors`);
        }
      }
    } catch (err) {
      errors++;
      if (errors < 5) {
        console.error(`  Unexpected error on record ${i + 1}:`, err);
      }
    }
  }
  
  return { imported, skipped, errors };
}

// Main import function
async function importAllLeads() {
  console.log('Starting leads data restoration...');
  console.log('='.repeat(50));
  
  const baseDir = path.join(__dirname, '..', 'data', 'outscraper-imports');
  const totalStats = {
    imported: 0,
    skipped: 0,
    errors: 0,
    files: 0
  };
  
  // Process each business type
  for (const [folderName, businessType] of Object.entries(BUSINESS_TYPES)) {
    console.log(`\n${'-'.repeat(50)}`);
    console.log(`Processing ${businessType} data...`);
    
    const folderPath = path.join(baseDir, folderName);
    
    try {
      // Check if folder exists
      await fs.access(folderPath);
      
      // Get all CSV files in the folder
      const files = await fs.readdir(folderPath);
      const csvFiles = files.filter(f => f.endsWith('.csv'));
      
      if (csvFiles.length === 0) {
        console.log(`  No CSV files found in ${folderName}`);
        continue;
      }
      
      // Import each CSV file
      for (const csvFile of csvFiles) {
        const filePath = path.join(folderPath, csvFile);
        const stats = await importCSVFile(filePath, businessType);
        
        totalStats.imported += stats.imported;
        totalStats.skipped += stats.skipped;
        totalStats.errors += stats.errors;
        totalStats.files++;
        
        console.log(`  ✓ ${csvFile}: Imported ${stats.imported}, Skipped ${stats.skipped}, Errors ${stats.errors}`);
      }
    } catch (error) {
      console.log(`  ⚠ Folder ${folderName} not found or not accessible`);
    }
  }
  
  // Print summary
  console.log(`\n${'='.repeat(50)}`);
  console.log('IMPORT SUMMARY');
  console.log(`${'='.repeat(50)}`);
  console.log(`Files processed: ${totalStats.files}`);
  console.log(`Records imported: ${totalStats.imported}`);
  console.log(`Records skipped: ${totalStats.skipped}`);
  console.log(`Errors: ${totalStats.errors}`);
  
  // Get final count from database
  const { count } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true });
  
  console.log(`\nTotal records in leads table: ${count}`);
  
  // Get breakdown by business type
  console.log('\nBreakdown by business type:');
  for (const businessType of Object.values(BUSINESS_TYPES)) {
    const { count: typeCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('business_type', businessType);
    
    console.log(`  ${businessType}: ${typeCount || 0} records`);
  }
}

// Run the import
importAllLeads()
  .then(() => {
    console.log('\n✅ Import completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  });