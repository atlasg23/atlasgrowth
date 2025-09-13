#!/usr/bin/env node

const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
})

async function createCallLogsTable() {
  console.log('🚀 Creating call_logs table...')
  
  try {
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'create-call-logs-table.sql')
    const sql = fs.readFileSync(sqlFilePath, 'utf8')
    
    // Execute the SQL
    await pool.query(sql)
    
    console.log('✅ Successfully created call_logs table and indexes')
    
    // Verify the table was created by querying its structure
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'call_logs'
      ORDER BY ordinal_position;
    `)
    
    console.log('\n📊 Table structure:')
    console.log('Column Name | Data Type | Nullable | Default')
    console.log('-'.repeat(50))
    result.rows.forEach(row => {
      console.log(`${row.column_name.padEnd(12)} | ${row.data_type.padEnd(10)} | ${row.is_nullable.padEnd(8)} | ${row.column_default || 'NULL'}`)
    })
    
  } catch (error) {
    console.error('❌ Error creating table:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// Also create template_sends table for logging template sends
async function createTemplateSendsTable() {
  console.log('\n🚀 Creating template_sends table...')
  
  try {
    const sql = `
      CREATE TABLE IF NOT EXISTS public.template_sends (
          id SERIAL PRIMARY KEY,
          lead_id VARCHAR(255),
          template_url TEXT NOT NULL,
          recipient_phone VARCHAR(50) NOT NULL,
          recipient_name VARCHAR(255),
          recipient_email VARCHAR(255),
          template_type VARCHAR(100),
          sms_message_id VARCHAR(255),
          ghl_webhook_success BOOLEAN DEFAULT FALSE,
          sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          viewed_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_template_sends_lead_id ON public.template_sends(lead_id);
      CREATE INDEX IF NOT EXISTS idx_template_sends_sent_at ON public.template_sends(sent_at DESC);
    `
    
    await pool.query(sql)
    console.log('✅ Successfully created template_sends table')
    
  } catch (error) {
    console.error('❌ Error creating template_sends table:', error.message)
  }
}

async function main() {
  console.log('🔧 Setting up call tracking database tables...')
  console.log('='.repeat(50))
  
  await createCallLogsTable()
  await createTemplateSendsTable()
  
  console.log('\n🎉 Database setup complete!')
  console.log('Ready to use call tracking system')
}

main().catch(console.error)