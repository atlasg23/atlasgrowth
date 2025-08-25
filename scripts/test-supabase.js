const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

(async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  console.log('🔗 Connecting to Supabase...');
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Test connection by creating a simple table
    const { data, error } = await supabase.rpc('sql', {
      query: `
        CREATE TABLE IF NOT EXISTS test_table (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });

    if (error) {
      console.error('❌ Error:', error.message);
    } else {
      console.log('✅ Test table created successfully!');
      
      // Test inserting data
      const { data: insertData, error: insertError } = await supabase
        .from('test_table')
        .insert({ name: 'Test Entry' });
        
      if (insertError) {
        console.error('❌ Insert error:', insertError.message);
      } else {
        console.log('✅ Test data inserted successfully!');
      }
    }
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  }
})();