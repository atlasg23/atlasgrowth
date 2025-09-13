#!/usr/bin/env node

const { Pool } = require('pg')
require('dotenv').config({ path: '.env.local' })

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
})

// Create clean slug from business name 
function createSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except spaces and dashes
    .replace(/\s+/g, '-') // Replace spaces with dashes
    .replace(/-+/g, '-') // Replace multiple dashes with single
    .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
    .replace(/^$/, 'business') // Handle empty results
}

async function cleanSlugIDs() {
  console.log('🧹 Cleaning slug IDs (removing _12345 suffixes)...\n')
  
  try {
    // Get all leads with slug IDs
    const { rows: leads } = await pool.query(`
      SELECT id, name, slug 
      FROM public.leads 
      WHERE slug IS NOT NULL 
        AND (slug LIKE '%_%' OR slug NOT SIMILAR TO '[a-z0-9-]+')
      ORDER BY name
      LIMIT 20
    `)
    
    console.log(`Found ${leads.length} leads with messy slugs (showing first 20)\n`)
    
    let updated = 0
    
    for (const lead of leads) {
      const cleanSlug = createSlug(lead.name)
      
      if (cleanSlug !== lead.slug) {
        console.log(`📝 "${lead.name}":`)
        console.log(`   Current: "${lead.slug}" → Clean: "${cleanSlug}"`)
        
        try {
          await pool.query(`
            UPDATE public.leads 
            SET slug = $1 
            WHERE id = $2
          `, [cleanSlug, lead.id])
          updated++
        } catch (error) {
          console.error(`   ❌ Error updating: ${error.message}`)
        }
      }
    }
    
    console.log(`\n📊 Updated ${updated} slugs`)
    
    // Check for potential duplicates after cleaning
    console.log(`\n🔍 Checking for duplicate slugs...`)
    const { rows: duplicates } = await pool.query(`
      SELECT slug, COUNT(*) as count, STRING_AGG(name, ', ') as businesses
      FROM public.leads 
      WHERE slug IS NOT NULL
      GROUP BY slug 
      HAVING COUNT(*) > 1
      ORDER BY count DESC
      LIMIT 10
    `)
    
    if (duplicates.length > 0) {
      console.log(`⚠️  Found ${duplicates.length} duplicate slugs:`)
      duplicates.forEach(dup => {
        console.log(`   "${dup.slug}" (${dup.count}x): ${dup.businesses}`)
      })
    } else {
      console.log('✅ No duplicates found')
    }
    
  } catch (error) {
    console.error('❌ Error cleaning slugs:', error.message)
  } finally {
    await pool.end()
  }
}

cleanSlugIDs().catch(console.error)