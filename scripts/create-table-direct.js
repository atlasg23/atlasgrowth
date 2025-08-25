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

async function createTableDirect() {
  console.log('🔗 Creating table using SQL query...')
  
  try {
    // Use the sql query method with raw SQL
    const { data, error } = await supabase
      .from('_sql')
      .select('*')
      
    if (error) {
      console.log('Direct SQL not available, using alternative method...')
    }
    
    // Try using the REST API directly with SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        sql: `
          CREATE TABLE IF NOT EXISTS test_table (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          INSERT INTO test_table (name, description) VALUES 
          ('Claude Test 1', 'Test entry from Claude Code setup script'),
          ('Claude Test 2', 'Second test entry to verify functionality');
        `
      })
    })
    
    if (response.ok) {
      console.log('✅ SQL executed successfully via REST API')
      const result = await response.json()
      console.log('Result:', result)
    } else {
      console.log('❌ REST API call failed:', response.status, response.statusText)
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message)
  }
  
  // Now test if we can read from the table
  console.log('📖 Testing table access...')
  try {
    const { data, error } = await supabase
      .from('test_table')
      .select('*')
      .limit(5)
    
    if (error) {
      console.log('❌ Still cannot access table:', error.message)
    } else {
      console.log('✅ Success! Table data:')
      console.table(data)
    }
  } catch (err) {
    console.log('❌ Table access error:', err.message)
  }
}

createTableDirect().catch(console.error)