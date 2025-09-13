#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Supabase connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.DATABASE_URL?.match(/password=([^&\s]+)/)?.[1]

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Helper function to create slug from business name
function createSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
}

async function importPlumbingBusinesses() {
  try {
    console.log('🔄 Importing plumbing businesses from CSV...')
    
    // Read and parse CSV
    const csvPath = path.join(__dirname, '../data/outscraper-imports/plumbing/plumbing-la.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      delimiter: ','
    })
    
    console.log(`📊 Found ${records.length} businesses in CSV`)
    
    // Process businesses in batches
    const batchSize = 50
    let imported = 0
    
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize)
      
      const processedBatch = batch.map(row => {
        const slug = createSlug(row.name || 'unknown-business')
        
        return {
          business_type: 'plumbing',
          name: row.name || 'Unknown Business',
          slug: slug,
          phone: row.phone || null,
          email_1: row.email_1 || null,
          email_1_emails_validator_status: row['email_1.emails_validator.status'] || null,
          site: row.site || null,
          city: row.city || null,
          state: row.state || null,
          rating: row.rating || null,
          reviews: row.reviews || null,
          photo: row.photo || null,
          photos_count: row.photos_count || null,
          verified: row.verified === 'TRUE' ? 'TRUE' : 'FALSE',
          place_id: row.place_id || null,
          facebook: row.facebook || null,
          instagram: row.instagram || null,
          linkedin: row.linkedin || null,
          full_address: row.full_address || null,
          postal_code: row.postal_code || null,
          latitude: row.latitude || null,
          longitude: row.longitude || null,
          working_hours: row.working_hours ? JSON.stringify(JSON.parse(row.working_hours.replace(/'/g, '"'))) : null,
          phone_phones_enricher_carrier_type: row['phone.phones_enricher.carrier_type'] || null,
          logo: row.logo || null,
          image_overrides: null // Initialize empty for custom images
        }
      })
      
      // Insert batch
      const { data, error } = await supabase
        .from('leads')
        .insert(processedBatch)
        .select('id')
      
      if (error) {
        console.error(`❌ Error inserting batch ${Math.floor(i/batchSize) + 1}:`, error.message)
        continue
      }
      
      imported += data.length
      console.log(`✅ Imported batch ${Math.floor(i/batchSize) + 1}: ${imported}/${records.length} businesses`)
    }
    
    console.log(`🎉 Import complete! Imported ${imported} plumbing businesses`)
    
    // Verify the import
    const { data: count } = await supabase
      .from('leads')
      .select('id')
      .eq('business_type', 'plumbing')
    
    console.log(`✅ Verification: ${count?.length || 0} plumbing businesses now in database`)
    
  } catch (error) {
    console.error('❌ Import failed:', error.message)
    process.exit(1)
  }
}

// Run the import
importPlumbingBusinesses()