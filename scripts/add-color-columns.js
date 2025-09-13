const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function addColorColumns() {
  try {
    console.log('Adding color columns to leads table...')
    
    // Try to add the columns using raw SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        ALTER TABLE leads ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7);
        ALTER TABLE leads ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7);
      `
    })
    
    if (error) {
      console.log('RPC method failed, trying direct insertion...')
      
      // Alternative: try a simple update to test if columns exist
      const { error: testError } = await supabase
        .from('leads')
        .update({ primary_color: '#000000' })
        .eq('id', 'non-existent-id') // This will fail but tell us if column exists
      
      if (testError && testError.message.includes('column "primary_color" does not exist')) {
        console.error('❌ Columns do not exist and cannot be created automatically.')
        console.log('\n📋 Please run this SQL manually in your Supabase SQL editor:')
        console.log('ALTER TABLE leads ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7);')
        console.log('ALTER TABLE leads ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7);')
        console.log('\nThen run this script again.')
        process.exit(1)
      } else {
        console.log('✅ Columns appear to already exist')
      }
    } else {
      console.log('✅ Columns added successfully')
    }
    
  } catch (error) {
    console.error('Error adding columns:', error)
    console.log('\n📋 Please run this SQL manually in your Supabase SQL editor:')
    console.log('ALTER TABLE leads ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7);')
    console.log('ALTER TABLE leads ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7);')
    process.exit(1)
  }
}

addColorColumns()