const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createColumns() {
  console.log('Creating color columns...')
  
  try {
    // Use a simple INSERT to create a test record with the new columns
    // This will fail if columns don't exist, but we can catch that
    const { data, error } = await supabase
      .from('leads')
      .insert({
        id: 'test-color-columns-' + Date.now(),
        business_type: 'test',
        name: 'Test Business',
        phone: '555-0000',
        city: 'Test City', 
        state: 'Test State',
        primary_color: '#1E40AF',
        secondary_color: '#F59E0B'
      })
      .select()
    
    if (error) {
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('❌ Columns do not exist. We need to add them manually.')
        console.log('\n🔧 Go to your Supabase project dashboard:')
        console.log('1. Go to SQL Editor')  
        console.log('2. Run this query:')
        console.log('   ALTER TABLE leads ADD COLUMN primary_color VARCHAR(7);')
        console.log('   ALTER TABLE leads ADD COLUMN secondary_color VARCHAR(7);')
        console.log('3. Then run this script again')
        return false
      } else {
        console.log('Other error:', error.message)
        return false
      }
    } else {
      console.log('✅ Columns exist! Test record created:', data[0]?.id)
      
      // Delete the test record
      await supabase
        .from('leads')
        .delete()
        .eq('id', data[0].id)
      
      console.log('✅ Test record cleaned up')
      return true
    }
    
  } catch (error) {
    console.error('Error:', error.message)
    return false
  }
}

async function main() {
  const columnsExist = await createColumns()
  
  if (columnsExist) {
    console.log('🎉 Ready to run the logo processing script!')
    console.log('Run: node scripts/process-logos-and-colors-simple.js')
  }
}

main()