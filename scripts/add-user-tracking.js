#!/usr/bin/env node

const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
})

async function addUserTracking() {
  console.log('🚀 Adding user tracking to call_logs table...')
  
  try {
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'add-user-tracking.sql')
    const sql = fs.readFileSync(sqlFilePath, 'utf8')
    
    // Execute the SQL
    await pool.query(sql)
    
    console.log('✅ Successfully added user_name column to call_logs table')
    
    // Verify the column was added
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'call_logs'
      AND column_name = 'user_name';
    `)
    
    if (result.rows.length > 0) {
      console.log('\n📊 New column details:')
      const row = result.rows[0]
      console.log(`Column: ${row.column_name}`)
      console.log(`Type: ${row.data_type}`)
      console.log(`Nullable: ${row.is_nullable}`) 
      console.log(`Default: ${row.column_default || 'NULL'}`)
    }
    
  } catch (error) {
    console.error('❌ Error adding user tracking:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

addUserTracking().catch(console.error)