#!/usr/bin/env node

const { Pool } = require('pg')
require('dotenv').config({ path: '.env.local' })

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
})

async function createTemplateSendsTable() {
  console.log('🚀 Creating template_sends table...')
  
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
    
    // Verify the table
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'template_sends'
      ORDER BY ordinal_position;
    `)
    
    console.log('\n📊 template_sends table structure:')
    result.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type}`)
    })
    
  } catch (error) {
    console.error('❌ Error creating template_sends table:', error.message)
  } finally {
    await pool.end()
  }
}

createTemplateSendsTable().catch(console.error)