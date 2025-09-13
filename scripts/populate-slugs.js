#!/usr/bin/env node

const { Pool } = require('pg')
require('dotenv').config({ path: '.env.local' })

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
})

// Create clean slug from business name (no IDs, no underscores)
function createSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except spaces and dashes
    .replace(/\s+/g, '-') // Replace spaces with dashes
    .replace(/-+/g, '-') // Replace multiple dashes with single
    .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
}

async function populateSlugs() {
  console.log('🔧 Populating empty slug column with clean business names...\n')
  
  try {
    // Get all leads without slugs
    const { rows: leads } = await pool.query(`
      SELECT id, name 
      FROM public.leads 
      WHERE slug IS NULL OR slug = ''
      ORDER BY name
    `)
    
    console.log(`Found ${leads.length} leads without slugs\n`)
    
    let updated = 0
    let duplicates = []
    const usedSlugs = new Set()
    
    for (const lead of leads) {
      const baseSlug = createSlug(lead.name)
      let finalSlug = baseSlug
      
      // Handle duplicates by adding number suffix
      let counter = 2
      while (usedSlugs.has(finalSlug)) {
        finalSlug = `${baseSlug}-${counter}`
        counter++
        if (counter === 2) {
          duplicates.push({ name: lead.name, slug: baseSlug })
        }
      }
      
      usedSlugs.add(finalSlug)
      
      console.log(`📝 "${lead.name}" → "${finalSlug}"`)
      
      try {
        await pool.query(`
          UPDATE public.leads 
          SET slug = $1 
          WHERE id = $2
        `, [finalSlug, lead.id])
        updated++
      } catch (error) {
        console.error(`   ❌ Error updating: ${error.message}`)
      }
    }
    
    console.log(`\n📊 Summary:`)
    console.log(`   Leads processed: ${leads.length}`)
    console.log(`   Successfully updated: ${updated}`)
    
    if (duplicates.length > 0) {
      console.log(`\n⚠️  Duplicate business names (added numbers):`)
      duplicates.forEach(dup => {
        console.log(`   "${dup.name}" → "${dup.slug}" (had duplicates)`)
      })
    }
    
    // Show some examples
    console.log(`\n🔍 Sample results:`)
    const { rows: samples } = await pool.query(`
      SELECT name, slug 
      FROM public.leads 
      WHERE slug IS NOT NULL
      ORDER BY name
      LIMIT 5
    `)
    
    samples.forEach(lead => {
      console.log(`   "${lead.name}" → "${lead.slug}"`)
    })
    
  } catch (error) {
    console.error('❌ Error populating slugs:', error.message)
  } finally {
    await pool.end()
  }
}

populateSlugs().catch(console.error)