const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupDatabase() {
  console.log('🔗 Testing Supabase connection...')
  
  try {
    // Test connection by creating table with raw SQL
    console.log('📝 Creating test_table...')
    
    const { data: createResult, error: createError } = await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS test_table (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })
    
    if (createError) {
      console.log('❌ Could not create table via RPC, trying direct SQL...')
      
      // Alternative: Use edge function or direct database connection
      // For now, let's test what we can access
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .limit(5)
      
      if (tablesError) {
        console.log('❌ Cannot access information_schema:', tablesError.message)
      } else {
        console.log('✅ Existing tables:', tables.map(t => t.table_name))
      }
    } else {
      console.log('✅ Table created successfully')
    }
    
    // Try to insert test data
    console.log('📝 Attempting to insert test data...')
    const { data: insertData, error: insertError } = await supabase
      .from('test_table')
      .insert([
        { name: 'Claude Test 1', description: 'Test entry from Claude Code setup script' },
        { name: 'Claude Test 2', description: 'Second test entry to verify functionality' }
      ])
      .select()
    
    if (insertError) {
      console.log('❌ Insert failed:', insertError.message)
      
      // If table doesn't exist, provide SQL to run manually
      console.log(`
🛠️  Please run this SQL in your Supabase SQL Editor:

CREATE TABLE test_table (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert test data
INSERT INTO test_table (name, description) VALUES 
('Claude Test 1', 'Test entry from Claude Code setup script'),
('Claude Test 2', 'Second test entry to verify functionality');
      `)
    } else {
      console.log('✅ Test data inserted successfully:', insertData)
    }
    
    // Try to read data
    console.log('📖 Reading test data...')
    const { data: readData, error: readError } = await supabase
      .from('test_table')
      .select('*')
      .limit(10)
    
    if (readError) {
      console.log('❌ Read failed:', readError.message)
    } else {
      console.log('✅ Successfully read data:')
      console.table(readData)
    }
    
    console.log('🎉 Database setup test completed!')
    
  } catch (error) {
    console.log('❌ Unexpected error:', error.message)
  }
}

setupDatabase().catch(console.error)