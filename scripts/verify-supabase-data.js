#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkData() {
  console.log('🔍 Checking ACTUAL Supabase data...');
  console.log(`📡 Connected to: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
  
  // Total count
  const { count: totalCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true });
  
  console.log(`📊 Total businesses: ${totalCount}`);
  
  // Missing coordinates count  
  const { count: missingCoords } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .or('latitude.is.null,longitude.is.null');
    
  console.log(`🗺️  Missing coordinates: ${missingCoords}`);
  
  // Missing city/state count
  const { count: missingLocation } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .or('city.is.null,state.is.null,city.eq.,state.eq.');
    
  console.log(`🏙️  Missing city/state: ${missingLocation}`);
  
  // Sample data
  const { data: sample } = await supabase
    .from('leads')
    .select('name, city, state, latitude, longitude')
    .limit(5);
    
  console.log('\n📋 Sample businesses:');
  sample.forEach((biz, i) => {
    console.log(`${i+1}. ${biz.name}`);
    console.log(`   📍 ${biz.city}, ${biz.state}`);
    console.log(`   🌐 ${biz.latitude}, ${biz.longitude}`);
  });
}

checkData().catch(console.error);