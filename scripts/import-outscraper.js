const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current); // Add the last field
  return result;
}

function transformOutscraperRow(csvRow, headers) {
  const row = {};
  headers.forEach((header, index) => {
    row[header] = csvRow[index] || '';
  });
  
  // Generate slug from name + city
  const nameSlug = slugify(row.name || '');
  const citySlug = slugify(row.city || '');
  const slug = nameSlug + (citySlug ? '-' + citySlug : '');
  
  // Parse working hours JSON if present
  let workingHours = null;
  try {
    if (row.working_hours && row.working_hours.startsWith('{')) {
      workingHours = JSON.parse(row.working_hours);
    }
  } catch (e) {
    // Keep as null if invalid JSON
  }
  
  return {
    // Core + routing
    name: row.name || null,
    niche: row.category || null,
    slug: slug || null,
    
    // Website / category  
    site: row.site || null,
    category: row.category || null,
    
    // Phone
    phone: row.phone || null,
    phone_carrier_type: row['phone.phones_enricher.carrier_type'] || null,
    
    // Address
    addr1: row.full_address || null,
    city: row.city || null,
    state: row.state || null,
    postal: row.postal_code || null,
    country: row.country || null,
    latitude: row.latitude ? parseFloat(row.latitude) : null,
    longitude: row.longitude ? parseFloat(row.longitude) : null,
    
    // Reputation / footprint
    rating: row.rating ? parseFloat(row.rating) : null,
    reviews: row.reviews ? parseInt(row.reviews) : null,
    reviews_link: row.reviews_link || null,
    photos_count: row.photos_count ? parseInt(row.photos_count) : null,
    working_hours: workingHours,
    
    // Profile
    about: row.about || null,
    logo: row.logo || null,
    description: row.description || null,
    verified: row.verified === 'True' || row.verified === 'true',
    booking_appointment_link: row.booking_appointment_link || null,
    place_id: row.place_id || null,
    
    // Email 1
    email1: row.email_1 || null,
    email1_status: row['email_1.emails_validator.status'] || null,
    email1_status_details: row['email_1.emails_validator.status_details'] || null,
    email1_first_name: row.email_1_first_name || null,
    email1_last_name: row.email_1_last_name || null,
    email1_title: row.email_1_title || null,
    
    // Email 2
    email2: row.email_2 || null,
    email2_status: row['email_2.emails_validator.status'] || null,
    email2_status_details: row['email_2.emails_validator.status_details'] || null,
    email2_first_name: row.email_2_first_name || null,
    email2_last_name: row.email_2_last_name || null,
    email2_title: row.email_2_title || null,
    
    // Email 3
    email3: row.email_3 || null,
    email3_status: row['email_3.emails_validator.status'] || null,
    email3_status_details: row['email_3.emails_validator.status_details'] || null,
    email3_first_name: row.email_3_first_name || null,
    email3_last_name: row.email_3_last_name || null,
    email3_title: row.email_3_title || null,
    
    // Socials
    facebook: row.facebook || null,
    instagram: row.instagram || null,
    linkedin: row.linkedin || null,
    tiktok: row.tiktok || null,
    
    // Website meta
    website_generator: row.website_generator || null,
    website_description: row.website_description || null,
    website_has_facebook_pixel: row.website_has_fb_pixel === 'True' || row.website_has_fb_pixel === 'true',
    website_has_google_pixel: row.website_has_google_tag === 'True' || row.website_has_google_tag === 'true',
    
    // Simple tags
    tag_no_site: !row.site || row.site.trim() === '',
    tag_has_mobile_phone: row['phone.phones_enricher.carrier_type'] === 'mobile'
  };
}

async function importOutscraperCSV(filePath) {
  const batchId = `outscraper-${Date.now()}`;
  let imported = 0;
  let skipped = 0;
  
  try {
    console.log('🔍 Reading CSV file:', filePath);
    const csvContent = fs.readFileSync(filePath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header and one data row');
    }
    
    const headers = parseCSVLine(lines[0]);
    console.log(`📋 Found ${headers.length} columns, ${lines.length - 1} data rows`);
    
    for (let i = 1; i < lines.length; i++) {
      try {
        const csvRow = parseCSVLine(lines[i]);
        const rawData = {};
        headers.forEach((header, index) => {
          rawData[header] = csvRow[index] || '';
        });
        
        // Store raw data
        await pool.query(
          'INSERT INTO os_raw (batch_id, src_row) VALUES ($1, $2)',
          [batchId, JSON.stringify(rawData)]
        );
        
        // Transform and insert into biz table
        const bizData = transformOutscraperRow(csvRow, headers);
        
        if (!bizData.name || bizData.name.trim() === '') {
          console.log(`⚠️  Skipping row ${i}: Missing business name`);
          skipped++;
          continue;
        }
        
        if (!bizData.slug || bizData.slug.trim() === '') {
          // Fallback: use place_id or row number as slug
          bizData.slug = bizData.place_id ? `business-${bizData.place_id.slice(-8)}` : `business-row-${i}`;
          console.log(`🔧 Generated fallback slug: ${bizData.slug}`);
        }
        
        // Insert into biz table (ON CONFLICT skip)
        const columns = Object.keys(bizData);
        const values = Object.values(bizData);
        const placeholders = columns.map((_, index) => `$${index + 1}`);
        
        await pool.query(
          `INSERT INTO biz (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) ON CONFLICT (slug) DO NOTHING`,
          values
        );
        
        imported++;
        if (imported % 10 === 0) {
          console.log(`📦 Imported ${imported} businesses...`);
        }
        
      } catch (rowError) {
        console.error(`❌ Error processing row ${i}:`, rowError.message);
        skipped++;
      }
    }
    
    console.log(`✅ Import completed!`);
    console.log(`   📊 Imported: ${imported} businesses`);
    console.log(`   ⚠️  Skipped: ${skipped} rows`);
    console.log(`   🔖 Batch ID: ${batchId}`);
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run import
const csvFile = process.argv[2];
if (!csvFile) {
  console.error('❌ Usage: node scripts/import-outscraper.js <path-to-csv>');
  process.exit(1);
}

if (!fs.existsSync(csvFile)) {
  console.error('❌ CSV file not found:', csvFile);
  process.exit(1);
}

importOutscraperCSV(csvFile).catch(console.error);