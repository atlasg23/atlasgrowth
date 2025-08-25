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

async function createTestTable() {
  console.log('Creating test table...')
  
  // Create a test table
  const { data, error } = await supabase.rpc('create_test_table', {})
  
  if (error && !error.message.includes('already exists')) {
    // If RPC doesn't exist, use raw SQL
    const { data: sqlData, error: sqlError } = await supabase
      .from('information_schema.tables')
      .select('*')
      .eq('table_name', 'test_table')
      .single()
    
    if (!sqlData) {
      console.log('Table does not exist, creating via SQL...')
      // Since we can't execute DDL directly via client, let's create and insert test data instead
      console.log('Note: Direct table creation via client is limited. Please create table manually in Supabase dashboard.')
      console.log('Recommended table structure:')
      console.log(`
CREATE TABLE test_table (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
      `)
    }
  }
  
  // Test inserting data (this will work if table exists)
  try {
    const { data: insertData, error: insertError } = await supabase
      .from('test_table')
      .insert([
        { name: 'Test Entry 1', description: 'This is a test entry created by Claude Code' },
        { name: 'Test Entry 2', description: 'Another test entry to verify database connection' }
      ])
      .select()
    
    if (insertError) {
      console.log('Insert error (table might not exist):', insertError.message)
    } else {
      console.log('Successfully inserted test data:', insertData)
    }
  } catch (err) {
    console.log('Could not insert test data:', err.message)
  }
  
  // Test reading data
  try {
    const { data: selectData, error: selectError } = await supabase
      .from('test_table')
      .select('*')
      .limit(5)
    
    if (selectError) {
      console.log('Select error:', selectError.message)
    } else {
      console.log('Current test table data:', selectData)
    }
  } catch (err) {
    console.log('Could not read test data:', err.message)
  }
}

createTestTable().catch(console.error)