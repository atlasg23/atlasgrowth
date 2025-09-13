const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function debugFiltering() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  console.log('=== FILTERING ANALYSIS ===');
  
  // Get all carrier types
  console.log('\n1. CARRIER TYPE BREAKDOWN:');
  const { data: carrierData } = await supabase
    .from('leads')
    .select('phone_phones_enricher_carrier_type')
    .limit(20000);
    
  const carrierCounts = {};
  carrierData?.forEach(item => {
    const carrier = item.phone_phones_enricher_carrier_type || 'null/undefined';
    carrierCounts[carrier] = (carrierCounts[carrier] || 0) + 1;
  });
  
  console.log('Total records checked:', carrierData?.length);
  Object.entries(carrierCounts)
    .sort(([,a], [,b]) => b - a)
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
  
  // Test the exact filtering logic from the dashboard
  console.log('\n2. DASHBOARD FILTER TEST:');
  const { data: filteredData, count: filteredCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact' })
    .not('phone_phones_enricher_carrier_type', 'eq', 'landline')
    .not('phone_phones_enricher_carrier_type', 'eq', 'fixed_line')
    .not('phone_phones_enricher_carrier_type', 'eq', 'fixed line')
    .limit(20000);
  
  console.log('After excluding landline/fixed_line/fixed line:', filteredCount);
  console.log('Fetched for processing:', filteredData?.length);
  
  // Check business types in filtered data
  console.log('\n3. BUSINESS TYPES IN FILTERED DATA:');
  const businessTypeCounts = {};
  filteredData?.forEach(item => {
    const type = item.business_type || 'Unknown';
    businessTypeCounts[type] = (businessTypeCounts[type] || 0) + 1;
  });
  
  console.log('Total business types found:', Object.keys(businessTypeCounts).length);
  Object.entries(businessTypeCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 15)
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
}

debugFiltering();