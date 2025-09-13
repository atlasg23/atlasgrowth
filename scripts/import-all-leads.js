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
  if (filePath.includes('pest-control')) return 'pest-control';
  if (filePath.includes('plumbing')) return 'plumbing';
  if (filePath.includes('pressure-washing')) return 'pressure-washing';
  if (filePath.includes('roofing')) return 'roofing';
  if (filePath.includes('tree-service')) return 'tree-service';
  if (filePath.includes('fire-protection')) return 'fire-protection';
  return 'unknown';
}

// CSV files to import
const csvFiles = [
  'data/outscraper-imports/fire-protection/fire-protection-la.csv',
  'data/outscraper-imports/hvac/hvac-alabama-existing.csv',
  'data/outscraper-imports/hvac/hvac-ar.csv',
  'data/outscraper-imports/hvac/hvac-louisiana-merged.csv',
  'data/outscraper-imports/pest-control/pest-control-la.csv',
  'data/outscraper-imports/plumbing/plumbing-al.csv',
  'data/outscraper-imports/plumbing/plumbing-la.csv',
  'data/outscraper-imports/pressure-washing/pressure-washing-ar.csv',
  'data/outscraper-imports/pressure-washing/pressure-washing-la.csv',
  'data/outscraper-imports/roofing/roofing-la.csv',
  'data/outscraper-imports/tree-service/tree-service-ar.csv'
];

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
        
        // Map CSV columns to database columns
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
          cid: data.cid || null,
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

        try {
          const client = await pool.connect();
          let inserted = 0;
          
          for (const record of results) {
            try {
              // Skip if no name
              if (!record.name) continue;
              
              // Create unique slug if duplicate
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
              
              // Insert record
              const columns = Object.keys(record).join(', ');
              const values = Object.values(record);
              const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
              
              await client.query(
                `INSERT INTO leads (${columns}) VALUES (${placeholders})`,
                values
              );
              
              inserted++;
            } catch (err) {
              console.log(`⚠️  Skipped row: ${err.message.substring(0, 100)}`);
            }
          }
          
          client.release();
          console.log(`✅ Imported ${inserted}/${results.length} records from ${path.basename(filePath)}`);
          resolve(inserted);
          
        } catch (err) {
          console.error(`❌ Error importing ${filePath}:`, err.message);
          resolve(0);
        }
      })
      .on('error', (err) => {
        console.error(`❌ Error reading ${filePath}:`, err.message);
        resolve(0);
      });
  });
}

async function main() {
  console.log('🚀 Starting import of all leads data...\n');
  
  let totalImported = 0;
  
  for (const filePath of csvFiles) {
    const count = await importCSV(filePath);
    totalImported += count;
  }
  
  console.log(`\n🎉 Import complete! Total records imported: ${totalImported}`);
  
  // Show final count
  const client = await pool.connect();
  const result = await client.query('SELECT COUNT(*) as total FROM leads');
  const totalInDb = result.rows[0].total;
  client.release();
  
  console.log(`📊 Total leads in database: ${totalInDb}`);
  
  await pool.end();
}

main().catch(console.error);