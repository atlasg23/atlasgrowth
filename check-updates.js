const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkActualUpdates() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  console.log('🔍 CHECKING IF RECENT GOOGLE MAPS UPDATES ARE VISIBLE:');
  
  // Look for some of the specific leads the script claimed to update
  const leadNames = [
    'Family Fire Protection',
    'Fire Extinguisher Services LLC', 
    'RapidFire Protection',
    'Asset Protection Services'
  ];
  
  for (const name of leadNames) {
    const { data } = await supabase
      .from('leads')
      .select('id, name, city, state, full_address, latitude, longitude')
      .eq('name', name)
      .limit(1);
      
    if (data && data[0]) {
      const lead = data[0];
      console.log(`\n${name}:`);
      console.log(`  City: '${lead.city}'`);
      console.log(`  State: '${lead.state}'`);
      console.log(`  Address: '${lead.full_address || 'N/A'}'`);
      console.log(`  Coords: ${lead.latitude}, ${lead.longitude}`);
      
      // Check if this looks like it was updated by our script
      if (lead.city && lead.state && lead.city !== 'null') {
        console.log(`  ✅ This lead appears to have been updated!`);
      } else {
        console.log(`  ❌ This lead still has missing location data`);
      }
    } else {
      console.log(`\n${name}: NOT FOUND`);
    }
  }
  
  // Count leads with actual location data
  console.log('\n📊 LOCATION DATA STATISTICS:');
  const { count: totalLeads } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true });
    
  const { count: leadsWithLocation } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .not('city', 'is', null)
    .not('state', 'is', null)
    .neq('city', '')
    .neq('state', '');
    
  const { count: leadsNeedingLocation } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .or('city.is.null,state.is.null,city.eq.,state.eq.');
  
  console.log(`Total leads: ${totalLeads}`);
  console.log(`Leads with city/state: ${leadsWithLocation}`);
  console.log(`Leads needing location updates: ${leadsNeedingLocation}`);
}

checkActualUpdates().catch(console.error);