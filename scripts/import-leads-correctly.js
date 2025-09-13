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

// Function to safely get value from row with multiple possible keys
function getValue(row, ...keys) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== '') {
      return row[key];
    }
  }
  return null;
}

// Function to map CSV row to leads table format - FIXED VERSION
function mapRowToLead(row, businessType, sourceFile, globalIndex) {
  // Generate unique slug using global index
  const slug = generateSlug(row.name || row.Name || '', globalIndex);
  
  // Handle place_id
  let placeId = getValue(row, 'place_id', 'Place Id');
  let googleId = getValue(row, 'google_id', 'Google Id');
  let cid = getValue(row, 'cid', 'CID');
  
  // Trim and clean
  placeId = placeId ? placeId.trim() : null;
  googleId = googleId ? googleId.trim() : null;
  cid = cid ? cid.trim() : null;
  
  return {
    // Core fields
    business_type: businessType,
    source_file: path.basename(sourceFile),
    import_date: new Date().toISOString(),
    query: getValue(row, 'query'),
    
    // Business info
    name: getValue(row, 'name', 'Name') || '',
    name_for_emails: getValue(row, 'name_for_emails', 'Name For Emails'),
    site: getValue(row, 'site', 'Site') || '',
    subtypes: getValue(row, 'subtypes', 'Subtypes'),
    category: getValue(row, 'category', 'Category'),
    type: getValue(row, 'type', 'Type'),
    
    // Main phone and enricher data - FIXED WITH DOT NOTATION
    phone: getValue(row, 'phone', 'Phone') || '',
    phone_phones_enricher_carrier_type: getValue(row, 'phone.phones_enricher.carrier_type'),
    phone_phones_enricher_carrier_name: getValue(row, 'phone.phones_enricher.carrier_name'),
    phone_phones_enricher_avoid_saving_cache: getValue(row, 'phone.phones_enricher._avoid_saving_cache'),
    
    // Whitepages phone data - FIXED WITH DOT NOTATION
    phone_whitepages_phones_address: getValue(row, 'phone.whitepages_phones.address'),
    phone_whitepages_phones_lookup_type: getValue(row, 'phone.whitepages_phones.lookup_type'),
    phone_whitepages_phones_name: getValue(row, 'phone.whitepages_phones.name'),
    phone_whitepages_phones_person_id: getValue(row, 'phone.whitepages_phones.person_id'),
    phone_whitepages_phones_fastbackgroundcheck: getValue(row, 'phone.whitepages_phones.fastbackgroundcheck'),
    phone_whitepages_phones_source_url: getValue(row, 'phone.whitepages_phones.source_url'),
    phone_whitepages_phones_avoid_saving_cache: getValue(row, 'phone.whitepages_phones._avoid_saving_cache'),
    phone_whitepages_phones_phone_type: getValue(row, 'phone.whitepages_phones.phone_type'),
    
    // Address
    full_address: getValue(row, 'full_address', 'Full Address') || '',
    borough: getValue(row, 'borough', 'Borough'),
    street: getValue(row, 'street', 'Street') || '',
    city: getValue(row, 'city', 'City') || '',
    postal_code: getValue(row, 'postal_code', 'Postal Code') || '',
    state: getValue(row, 'state', 'State', 'us_state') || '',
    us_state: getValue(row, 'us_state', 'US State'),
    country: getValue(row, 'country', 'Country') || 'United States of America',
    country_code: getValue(row, 'country_code', 'Country Code'),
    latitude: parseFloat(getValue(row, 'latitude', 'Latitude')) || null,
    longitude: parseFloat(getValue(row, 'longitude', 'Longitude')) || null,
    h3: getValue(row, 'h3'),
    time_zone: getValue(row, 'time_zone', 'Time Zone'),
    plus_code: getValue(row, 'plus_code', 'Plus Code'),
    area_service: getValue(row, 'area_service', 'Area Service'),
    
    // Reviews and ratings
    rating: getValue(row, 'rating', 'Rating') || '',
    reviews: getValue(row, 'reviews', 'Reviews') || '',
    reviews_link: getValue(row, 'reviews_link', 'Reviews Link') || '',
    reviews_tags: getValue(row, 'reviews_tags'),
    reviews_per_score: getValue(row, 'reviews_per_score'),
    reviews_per_score_1: getValue(row, 'reviews_per_score_1'),
    reviews_per_score_2: getValue(row, 'reviews_per_score_2'),
    reviews_per_score_3: getValue(row, 'reviews_per_score_3'),
    reviews_per_score_4: getValue(row, 'reviews_per_score_4'),
    reviews_per_score_5: getValue(row, 'reviews_per_score_5'),
    
    // Images
    photos_count: getValue(row, 'photos_count', 'Photos Count') || '',
    photo: getValue(row, 'photo', 'Photo') || '',
    street_view: getValue(row, 'street_view', 'Street View'),
    logo: getValue(row, 'logo', 'Logo') || '',
    
    // Business details
    located_in: getValue(row, 'located_in', 'Located In'),
    working_hours: getValue(row, 'working_hours', 'Working Hours') || '',
    working_hours_csv_compatible: getValue(row, 'working_hours_csv_compatible'),
    working_hours_old_format: getValue(row, 'working_hours_old_format'),
    other_hours: getValue(row, 'other_hours'),
    popular_times: getValue(row, 'popular_times'),
    business_status: getValue(row, 'business_status', 'Business Status') || 'OPERATIONAL',
    about: getValue(row, 'about', 'About'),
    range: getValue(row, 'range', 'Range'),
    prices: getValue(row, 'prices', 'Prices'),
    posts: getValue(row, 'posts', 'Posts'),
    description: getValue(row, 'description', 'Description'),
    typical_time_spent: getValue(row, 'typical_time_spent'),
    verified: getValue(row, 'verified', 'Verified') || 'FALSE',
    
    // Owner info
    owner_id: getValue(row, 'owner_id', 'Owner Id'),
    owner_title: getValue(row, 'owner_title', 'Owner Title'),
    owner_link: getValue(row, 'owner_link', 'Owner Link'),
    
    // Links
    reservation_links: getValue(row, 'reservation_links'),
    booking_appointment_link: getValue(row, 'booking_appointment_link'),
    menu_link: getValue(row, 'menu_link'),
    order_links: getValue(row, 'order_links'),
    location_link: getValue(row, 'location_link'),
    location_reviews_link: getValue(row, 'location_reviews_link'),
    
    // IDs
    place_id: placeId,
    google_id: googleId,
    cid: cid,
    kgmid: getValue(row, 'kgmid', 'KGMID'),
    reviews_id: getValue(row, 'reviews_id'),
    located_google_id: getValue(row, 'located_google_id'),
    
    // Email 1 with DOT NOTATION
    email_1: getValue(row, 'email_1', 'Email 1', 'email 1') || '',
    email_1_emails_validator_status: getValue(row, 'email_1.emails_validator.status'),
    email_1_emails_validator_status_details: getValue(row, 'email_1.emails_validator.status_details'),
    email_1_full_name: getValue(row, 'email_1.full_name'),
    email_1_first_name: getValue(row, 'email_1.first_name'),
    email_1_last_name: getValue(row, 'email_1.last_name'),
    email_1_title: getValue(row, 'email_1.title'),
    email_1_phone: getValue(row, 'email_1.phone'),
    
    // Email 2 with DOT NOTATION
    email_2: getValue(row, 'email_2', 'Email 2', 'email 2'),
    email_2_emails_validator_status: getValue(row, 'email_2.emails_validator.status'),
    email_2_emails_validator_status_details: getValue(row, 'email_2.emails_validator.status_details'),
    email_2_full_name: getValue(row, 'email_2.full_name'),
    email_2_first_name: getValue(row, 'email_2.first_name'),
    email_2_last_name: getValue(row, 'email_2.last_name'),
    email_2_title: getValue(row, 'email_2.title'),
    email_2_phone: getValue(row, 'email_2.phone'),
    
    // Email 3 with DOT NOTATION
    email_3: getValue(row, 'email_3', 'Email 3', 'email 3'),
    email_3_emails_validator_status: getValue(row, 'email_3.emails_validator.status'),
    email_3_emails_validator_status_details: getValue(row, 'email_3.emails_validator.status_details'),
    email_3_full_name: getValue(row, 'email_3.full_name'),
    email_3_first_name: getValue(row, 'email_3.first_name'),
    email_3_last_name: getValue(row, 'email_3.last_name'),
    email_3_title: getValue(row, 'email_3.title'),
    email_3_phone: getValue(row, 'email_3.phone'),
    
    // Phone 1 with DOT NOTATION
    phone_1: getValue(row, 'phone 1', 'Phone 1', 'phone_1'),
    phone_1_phones_enricher_carrier_name: getValue(row, 'phone 1.phones_enricher.carrier_name'),
    phone_1_phones_enricher_carrier_type: getValue(row, 'phone 1.phones_enricher.carrier_type'),
    phone_1_whitepages_phones_address: getValue(row, 'phone 1.whitepages_phones.address'),
    phone_1_whitepages_phones_lookup_type: getValue(row, 'phone 1.whitepages_phones.lookup_type'),
    phone_1_whitepages_phones_name: getValue(row, 'phone 1.whitepages_phones.name'),
    phone_1_whitepages_phones_person_id: getValue(row, 'phone 1.whitepages_phones.person_id'),
    phone_1_whitepages_phones_fastbackgroundcheck: getValue(row, 'phone 1.whitepages_phones.fastbackgroundcheck'),
    phone_1_whitepages_phones_source_url: getValue(row, 'phone 1.whitepages_phones.source_url'),
    phone_1_whitepages_phones_phone_type: getValue(row, 'phone 1.whitepages_phones.phone_type'),
    phone_1_whitepages_phones_avoid_saving_cache: getValue(row, 'phone 1.whitepages_phones._avoid_saving_cache'),
    
    // Phone 2 with DOT NOTATION
    phone_2: getValue(row, 'phone 2', 'Phone 2', 'phone_2'),
    phone_2_phones_enricher_carrier_name: getValue(row, 'phone 2.phones_enricher.carrier_name'),
    phone_2_phones_enricher_carrier_type: getValue(row, 'phone 2.phones_enricher.carrier_type'),
    phone_2_whitepages_phones_address: getValue(row, 'phone 2.whitepages_phones.address'),
    phone_2_whitepages_phones_lookup_type: getValue(row, 'phone 2.whitepages_phones.lookup_type'),
    phone_2_whitepages_phones_name: getValue(row, 'phone 2.whitepages_phones.name'),
    phone_2_whitepages_phones_person_id: getValue(row, 'phone 2.whitepages_phones.person_id'),
    phone_2_whitepages_phones_phone_type: getValue(row, 'phone 2.whitepages_phones.phone_type'),
    phone_2_whitepages_phones_source_url: getValue(row, 'phone 2.whitepages_phones.source_url'),
    phone_2_whitepages_phones_avoid_saving_cache: getValue(row, 'phone 2.whitepages_phones._avoid_saving_cache'),
    phone_2_whitepages_phones_fastbackgroundcheck: getValue(row, 'phone 2.whitepages_phones.fastbackgroundcheck'),
    
    // Phone 3 with DOT NOTATION
    phone_3: getValue(row, 'phone 3', 'Phone 3', 'phone_3'),
    phone_3_phones_enricher_carrier_name: getValue(row, 'phone 3.phones_enricher.carrier_name'),
    phone_3_phones_enricher_carrier_type: getValue(row, 'phone 3.phones_enricher.carrier_type'),
    phone_3_whitepages_phones_address: getValue(row, 'phone 3.whitepages_phones.address'),
    phone_3_whitepages_phones_lookup_type: getValue(row, 'phone 3.whitepages_phones.lookup_type'),
    phone_3_whitepages_phones_name: getValue(row, 'phone 3.whitepages_phones.name'),
    phone_3_whitepages_phones_person_id: getValue(row, 'phone 3.whitepages_phones.person_id'),
    phone_3_whitepages_phones_fastbackgroundcheck: getValue(row, 'phone 3.whitepages_phones.fastbackgroundcheck'),
    phone_3_whitepages_phones_source_url: getValue(row, 'phone 3.whitepages_phones.source_url'),
    phone_3_whitepages_phones_phone_type: getValue(row, 'phone 3.whitepages_phones.phone_type'),
    phone_3_whitepages_phones_avoid_saving_cache: getValue(row, 'phone 3.whitepages_phones._avoid_saving_cache'),
    
    // Social media
    facebook: getValue(row, 'facebook', 'Facebook') || '',
    instagram: getValue(row, 'instagram', 'Instagram') || '',
    linkedin: getValue(row, 'linkedin', 'LinkedIn', 'linkedIn') || '',
    twitter: getValue(row, 'twitter', 'Twitter'),
    youtube: getValue(row, 'youtube', 'YouTube', 'Youtube'),
    tiktok: getValue(row, 'tiktok', 'TikTok'),
    medium: getValue(row, 'medium'),
    reddit: getValue(row, 'reddit'),
    skype: getValue(row, 'skype'),
    snapchat: getValue(row, 'snapchat'),
    telegram: getValue(row, 'telegram'),
    whatsapp: getValue(row, 'whatsapp'),
    vimeo: getValue(row, 'vimeo'),
    github: getValue(row, 'github'),
    crunchbase: getValue(row, 'crunchbase'),
    
    // Website info with DOT NOTATION
    website_title: getValue(row, 'website.title'),
    website_generator: getValue(row, 'website.generator'),
    website_description: getValue(row, 'website.description'),
    website_keywords: getValue(row, 'website.keywords'),
    website_has_fb_pixel: getValue(row, 'website.has_fb_pixel'),
    website_has_google_tag: getValue(row, 'website.has_google_tag'),
    
    // Company insights with DOT NOTATION
    company_insights_address: getValue(row, 'company_insights.address'),
    company_insights_city: getValue(row, 'company_insights.city'),
    company_insights_country: getValue(row, 'company_insights.country'),
    company_insights_description: getValue(row, 'company_insights.description'),
    company_insights_employees: getValue(row, 'company_insights.employees'),
    company_insights_founded_year: getValue(row, 'company_insights.founded_year'),
    company_insights_industry: getValue(row, 'company_insights.industry'),
    company_insights_is_public: getValue(row, 'company_insights.is_public'),
    company_insights_linkedin_bio: getValue(row, 'company_insights.linkedin_bio'),
    company_insights_linkedin_company_page: getValue(row, 'company_insights.linkedin_company_page'),
    company_insights_name: getValue(row, 'company_insights.name'),
    company_insights_phone: getValue(row, 'company_insights.phone'),
    company_insights_revenue: getValue(row, 'company_insights.revenue'),
    company_insights_state: getValue(row, 'company_insights.state'),
    company_insights_timezone: getValue(row, 'company_insights.timezone'),
    company_insights_zip: getValue(row, 'company_insights.zip'),
    company_insights_facebook_company_page: getValue(row, 'company_insights.facebook_company_page'),
    company_insights_twitter_handle: getValue(row, 'company_insights.twitter_handle'),
    company_insights_total_money_raised: getValue(row, 'company_insights.total_money_raised'),
    
    // Additional fields
    slug: slug,
    primary_color: getValue(row, 'primary_color') || '',
    secondary_color: getValue(row, 'secondary_color') || '',
    
    // Timestamps
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

async function main() {
  console.log('='.repeat(60));
  console.log('COMPLETE LEADS IMPORT WITH CORRECT COLUMN MAPPING');
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
  
  // Step 2: Collect all data
  console.log('\n2. COLLECTING AND PROCESSING CSV FILES...');
  console.log('-'.repeat(40));
  
  const baseDir = path.join(__dirname, '..', 'data', 'outscraper-imports');
  const allLeads = [];
  const seenPlaceIds = new Set();
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
          
          const placeId = (row.place_id || row['Place Id'] || '').trim();
          
          // Skip if we've seen this place_id before (and it's not empty)
          if (placeId && seenPlaceIds.has(placeId)) {
            duplicatesSkipped++;
            skipped++;
            return;
          }
          
          if (placeId) seenPlaceIds.add(placeId);
          
          const lead = mapRowToLead(row, folder.type, csvFile, allLeads.length);
          
          // Double check place_id uniqueness
          if (placeId && allLeads.some(l => l.place_id === placeId)) {
            lead.place_id = null;
          }
          
          allLeads.push(lead);
          validCount++;
        });
        
        console.log(`    ✓ Added ${validCount} records (skipped ${skipped})`);
        fileCount++;
      }
    } catch (error) {
      console.log(`  ⚠ Skipping ${folder.name}: ${error.message}`);
    }
  }
  
  console.log(`\n  Total unique records: ${allLeads.length}`);
  console.log(`  Duplicates skipped: ${duplicatesSkipped}`);
  console.log(`  Files processed: ${fileCount}`);
  
  // Step 3: Insert in batches
  console.log('\n3. INSERTING LEADS INTO DATABASE...');
  console.log('-'.repeat(40));
  
  const BATCH_SIZE = 100;
  let inserted = 0;
  let errors = 0;
  
  for (let i = 0; i < allLeads.length; i += BATCH_SIZE) {
    const batch = allLeads.slice(i, Math.min(i + BATCH_SIZE, allLeads.length));
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(allLeads.length / BATCH_SIZE);
    
    try {
      // Ensure no duplicate place_ids in batch
      const seenInBatch = new Set();
      batch.forEach(lead => {
        if (lead.place_id && seenInBatch.has(lead.place_id)) {
          lead.place_id = null;
        } else if (lead.place_id) {
          seenInBatch.add(lead.place_id);
        }
      });
      
      const { data, error } = await supabase
        .from('leads')
        .insert(batch);
      
      if (error) {
        console.error(`  ⚠ Batch ${batchNum}/${totalBatches}: ${error.message}`);
        // Try one by one
        let batchInserted = 0;
        for (const lead of batch) {
          try {
            lead.place_id = null; // Remove to avoid conflicts
            lead.google_id = null;
            lead.cid = null;
            
            const { error: singleError } = await supabase
              .from('leads')
              .insert([lead]);
            
            if (!singleError) {
              batchInserted++;
            }
          } catch (e) {
            // Skip
          }
        }
        inserted += batchInserted;
        errors += (batch.length - batchInserted);
        if (batchInserted > 0) {
          console.log(`    Recovered ${batchInserted}/${batch.length} records`);
        }
      } else {
        inserted += batch.length;
        if (batchNum % 10 === 0 || batchNum === totalBatches) {
          console.log(`  ✓ Progress: Batch ${batchNum}/${totalBatches} (${inserted} inserted)`);
        }
      }
    } catch (error) {
      console.error(`  ❌ Batch ${batchNum}: ${error.message}`);
      errors += batch.length;
    }
  }
  
  // Step 4: Verify the import
  console.log('\n4. VERIFYING IMPORT...');
  console.log('-'.repeat(40));
  
  // Check a sample record to verify data was imported correctly
  const { data: sample } = await supabase
    .from('leads')
    .select('name, phone, phone_phones_enricher_carrier_type, phone_1, email_1, city, state')
    .eq('business_type', 'hvac')
    .limit(3);
  
  console.log('\nSample records to verify data:');
  sample?.forEach((record, i) => {
    console.log(`\nRecord ${i + 1}:`);
    console.log(`  Name: ${record.name}`);
    console.log(`  Phone: ${record.phone}`);
    console.log(`  Carrier Type: ${record.phone_phones_enricher_carrier_type || 'N/A'}`);
    console.log(`  Phone 1: ${record.phone_1 || 'N/A'}`);
    console.log(`  Email: ${record.email_1 || 'N/A'}`);
    console.log(`  Location: ${record.city}, ${record.state}`);
  });
  
  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('IMPORT COMPLETE');
  console.log('='.repeat(60));
  
  const { count } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true });
  
  console.log(`\nTotal records in database: ${count || 0}`);
  console.log(`Records inserted: ${inserted}`);
  console.log(`Errors: ${errors}`);
  
  // Breakdown by type
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