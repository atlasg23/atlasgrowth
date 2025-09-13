const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkBusinessTypes() {
  // Get unique business types
  const { data, error } = await supabase
    .from('leads')
    .select('business_type')
    .not('business_type', 'is', null)
    .limit(1000);

  if (error) {
    console.error('Error:', error);
    return;
  }

  const types = [...new Set(data.map(d => d.business_type))].sort();
  console.log('Unique business types found:');
  types.forEach(type => console.log('-', type));
  console.log('\nTotal unique types:', types.length);
}

checkBusinessTypes();