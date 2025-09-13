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
}

async function fixSlugs() {
  console.log('🔧 Fixing slug inconsistencies in leads table...\n')
  
  try {
    // Get all leads
    const { rows: leads } = await pool.query(`
      SELECT id, name, site 
      FROM public.leads 
      ORDER BY name
    `)
    
    console.log(`Found ${leads.length} leads to process\n`)
    
    let updated = 0
    let errors = 0
    
    for (const lead of leads) {
      const currentSlug = lead.site
      const expectedSlug = createSlug(lead.name)
      
      if (currentSlug !== expectedSlug) {
        console.log(`📝 ${lead.name}:`)
        console.log(`   Current: "${currentSlug}" → New: "${expectedSlug}"`)
        
        try {
          await pool.query(`
            UPDATE public.leads 
            SET site = $1 
            WHERE id = $2
          `, [expectedSlug, lead.id])
          updated++
        } catch (error) {
          console.error(`   ❌ Error updating: ${error.message}`)
          errors++
        }
      } else {
        console.log(`✅ ${lead.name}: "${currentSlug}" (already correct)`)
      }
    }
    
    console.log(`\n📊 Summary:`)
    console.log(`   Total leads: ${leads.length}`)
    console.log(`   Updated: ${updated}`)
    console.log(`   Errors: ${errors}`)
    console.log(`   Already correct: ${leads.length - updated - errors}`)
    
    // Show final state
    console.log(`\n🔍 Final slug patterns:`)
    const { rows: finalSlugs } = await pool.query(`
      SELECT name, site, LENGTH(site) as slug_length
      FROM public.leads 
      ORDER BY slug_length DESC, name
      LIMIT 10
    `)
    
    finalSlugs.forEach(lead => {
      console.log(`   "${lead.name}" → "${lead.site}" (${lead.slug_length} chars)`)
    })
    
  } catch (error) {
    console.error('❌ Error fixing slugs:', error.message)
  } finally {
    await pool.end()
  }
}

// Also check for duplicates
async function checkDuplicates() {
  console.log('\n🔍 Checking for duplicate slugs...')
  
  try {
    const { rows: duplicates } = await pool.query(`
      SELECT site, COUNT(*) as count, STRING_AGG(name, ', ') as businesses
      FROM public.leads 
      WHERE site IS NOT NULL
      GROUP BY site 
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `)
    
    if (duplicates.length > 0) {
      console.log(`⚠️  Found ${duplicates.length} duplicate slugs:`)
      duplicates.forEach(dup => {
        console.log(`   "${dup.site}" used by ${dup.count} businesses: ${dup.businesses}`)
      })
      
      console.log('\n💡 Need to add unique suffixes to duplicates')
    } else {
      console.log('✅ No duplicate slugs found')
    }
  } catch (error) {
    console.error('Error checking duplicates:', error.message)
  }
}

fixSlugs()
  .then(() => checkDuplicates())
  .catch(console.error)