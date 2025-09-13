const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function debugConnection() {
  console.log('=== SUPABASE CONNECTION DEBUG ===');
  console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...');
  console.log('ANON_KEY length:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length);
  console.log('SERVICE_ROLE_KEY length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length);
  console.log('DATABASE_URL:', process.env.SUPABASE_DB_URL?.substring(0, 50) + '...');
  
  try {
    // Test with anon key (same as client)
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    console.log('\n=== ANON CLIENT TEST ===');
    const { data: anonData, error: anonError, count: anonCount } = await supabaseClient
      .from('leads')
      .select('*', { count: 'exact' })
      .limit(5);
      
    console.log('Anon count:', anonCount);
    console.log('Anon data length:', anonData?.length);
    console.log('Anon error:', anonError?.message);
    
    if (anonData && anonData.length > 0) {
      console.log('Sample lead business_type:', anonData[0].business_type);
    }
    
    // Test with service role key (admin)
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );
      
      console.log('\n=== ADMIN CLIENT TEST ===');
      const { data: adminData, error: adminError, count: adminCount } = await supabaseAdmin
        .from('leads')
        .select('*', { count: 'exact' })
        .limit(5);
        
      console.log('Admin count:', adminCount);
      console.log('Admin data length:', adminData?.length);
      console.log('Admin error:', adminError?.message);
      
      if (adminData && adminData.length > 0) {
        console.log('Sample admin lead business_type:', adminData[0].business_type);
      }
    }
    
  } catch (error) {
    console.error('Connection test failed:', error.message);
  }
}

debugConnection();