#!/usr/bin/env node

const { Pool } = require('pg')
require('dotenv').config({ path: '.env.local' })

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
})

async function createTemplateViewsTable() {
  console.log('🚀 Creating template_views table for website tracking...')
  
  try {
    const sql = `
      -- Template views tracking table
      CREATE TABLE IF NOT EXISTS public.template_views (
          id SERIAL PRIMARY KEY,
          business_slug VARCHAR(255) NOT NULL,
          template_type VARCHAR(100) NOT NULL,
          visitor_ip VARCHAR(45),
          user_agent TEXT,
          referrer TEXT,
          viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_template_views_business_slug ON public.template_views(business_slug);
      CREATE INDEX IF NOT EXISTS idx_template_views_viewed_at ON public.template_views(viewed_at DESC);
      CREATE INDEX IF NOT EXISTS idx_template_views_template_type ON public.template_views(template_type);

      -- Add template tracking columns to call_logs if they don't exist
      ALTER TABLE public.call_logs 
      ADD COLUMN IF NOT EXISTS template_viewed BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS template_viewed_date TIMESTAMP WITH TIME ZONE;

      -- Create index on new columns
      CREATE INDEX IF NOT EXISTS idx_call_logs_template_viewed ON public.call_logs(template_viewed);
    `
    
    await pool.query(sql)
    console.log('✅ Successfully created template_views table and updated call_logs')
    
    // Verify tables
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'template_views'
      ORDER BY ordinal_position;
    `)
    
    console.log('\n📊 template_views table structure:')
    result.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type}`)
    })
    
  } catch (error) {
    console.error('❌ Error creating template_views table:', error.message)
  } finally {
    await pool.end()
  }
}

createTemplateViewsTable().catch(console.error)