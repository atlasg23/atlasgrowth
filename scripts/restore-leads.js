const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
});

// Function to create slug from business name
function createSlug(name) {
  if (!name) return '';
  return name.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '') // Remove all spaces
    .trim();
}

// Function to determine business type from file path
function getBusinessType(filePath) {
  if (filePath.includes('hvac')) return 'hvac';
  if (filePath.includes('plumbing')) return 'plumbing';
  if (filePath.includes('tree-service')) return 'tree-service';
  return 'unknown';
}

// CSV files to import - ONLY the three requested types
const csvFiles = [
  'data/outscraper-imports/hvac/hvac-alabama-existing.csv',
  'data/outscraper-imports/hvac/hvac-ar.csv',
  'data/outscraper-imports/hvac/hvac-louisiana-merged.csv',
  'data/outscraper-imports/plumbing/plumbing-al.csv',
  'data/outscraper-imports/plumbing/plumbing-la.csv',
  'data/outscraper-imports/tree-service/tree-service-ar.csv'
];

async function fixCidColumn() {
  console.log('🔧 Fixing cid column type to handle large numbers...');
  const client = await pool.connect();
  try {
    // Change cid from bigint to text to handle large numbers
    await client.query('ALTER TABLE leads ALTER COLUMN cid TYPE text USING cid::text;');
    console.log('✅ Fixed cid column type');
  } catch (error) {
    console.log('⚠️  CID column fix:', error.message);
  } finally {
    client.release();
  }
}

async function importCSV(filePath) {
  console.log(`\n📁 Importing ${filePath}...`);
  
  const businessType = getBusinessType(filePath);
  const results = [];
  
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${filePath}`);
      resolve(0);
      return;
    }

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        // Create slug from name
        const slug = createSlug(data.name || data.Name || data.title || '');
        
        // Skip if no name
        if (!slug) return;
        
        // Map CSV columns to database columns (only the essential ones)
        const record = {
          business_type: businessType,
          source_file: path.basename(filePath),
          name: data.name || data.Name || data.title || '',
          slug: slug,
          site: data.site || data.website || '',
          phone: data.phone || data.Phone || '',
          full_address: data.full_address || data.address || '',
          street: data.street || '',
          city: data.city || '',
          state: data.state || data.us_state || '',
          postal_code: data.postal_code || data.zip || '',
          country: data.country || '',
          latitude: parseFloat(data.latitude) || null,
          longitude: parseFloat(data.longitude) || null,
          rating: data.rating || '',
          reviews: data.reviews || '',
          reviews_link: data.reviews_link || '',
          photos_count: data.photos_count || '',
          photo: data.photo || '',
          logo: data.logo || '',
          working_hours: data.working_hours || '',
          business_status: data.business_status || '',
          verified: data.verified || '',
          place_id: data.place_id || '',
          google_id: data.google_id || '',
          cid: data.cid || '', // Keep as text now
          email_1: data.email_1 || data.email || '',
          facebook: data.facebook || '',
          instagram: data.instagram || '',
          linkedin: data.linkedin || '',
          primary_color: '', // Leave blank as requested
          secondary_color: '' // Leave blank as requested
        };
        
        results.push(record);
      })
      .on('end', async () => {
        if (results.length === 0) {
          console.log(`⚠️  No data found in ${filePath}`);
          resolve(0);
          return;
        }

        const client = await pool.connect();
        try {
          let inserted = 0;
          
          for (const record of results) {
            try {
              // Make unique slug
              let finalSlug = record.slug;
              let counter = 1;
              
              while (true) {
                const existingSlug = await client.query(
                  'SELECT id FROM leads WHERE slug = $1',
                  [finalSlug]
                );
                
                if (existingSlug.rows.length === 0) break;
                
                finalSlug = `${record.slug}${counter}`;
                counter++;
              }
              
              record.slug = finalSlug;
              
              // Insert record with proper column mapping
              const columns = Object.keys(record).join(', ');
              const values = Object.values(record);
              const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
              
              await client.query(
                `INSERT INTO leads (${columns}) VALUES (${placeholders})`,
                values
              );
              
              inserted++;
              
              if (inserted % 100 === 0) {
                console.log(`  📈 Imported ${inserted}/${results.length} records...`);
              }
              
            } catch (err) {
              console.log(`⚠️  Skipped row: ${err.message.substring(0, 100)}`);
            }
          }
          
          console.log(`✅ Imported ${inserted}/${results.length} records from ${path.basename(filePath)}`);
          resolve(inserted);
          
        } catch (err) {
          console.error(`❌ Error importing ${filePath}:`, err.message);
          resolve(0);
        } finally {
          client.release();
        }
      })
      .on('error', (err) => {
        console.error(`❌ Error reading ${filePath}:`, err.message);
        resolve(0);
      });
  });
}

async function main() {
  console.log('🚀 Restoring leads data for HVAC, Plumbing, and Tree Service...\n');
  
  // First fix the column type issue
  await fixCidColumn();
  
  let totalImported = 0;
  
  for (const filePath of csvFiles) {
    const count = await importCSV(filePath);
    totalImported += count;
  }
  
  console.log(`\n🎉 Restore complete! Total records imported: ${totalImported}`);
  
  // Show final count by business type
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT business_type, COUNT(*) as count 
      FROM leads 
      GROUP BY business_type 
      ORDER BY business_type
    `);
    
    console.log('\n📊 Final counts by business type:');
    for (const row of result.rows) {
      console.log(`  ${row.business_type}: ${row.count} businesses`);
    }
    
    const totalResult = await client.query('SELECT COUNT(*) as total FROM leads');
    console.log(`\n💼 Total leads in database: ${totalResult.rows[0].total}`);
    
  } catch (error) {
    console.log('Error getting final counts:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);