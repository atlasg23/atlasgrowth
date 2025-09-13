#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixSlugs() {
  console.log('🔧 FIXING SLUGS - REMOVING UNDERSCORE AND IDS');
  console.log('='.repeat(50));
  
  const BATCH_SIZE = 1000;
  let totalFixed = 0;
  let totalFailed = 0;
  let totalProcessed = 0;
  let batchNum = 1;
  
  // First get total count
  const { count: totalCount, error: countError } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .not('slug', 'is', null)
    .like('slug', '%_%');
  
  if (countError) {
    console.error('❌ Error counting records:', countError.message);
    return;
  }
  
  if (!totalCount) {
    console.log('✅ No slugs found that need fixing');
    return;
  }
  
  console.log(`📊 Found ${totalCount} slugs that need fixing`);
  console.log(`🔄 Processing in batches of ${BATCH_SIZE}...`);
  
  while (true) {
    console.log(`\n📦 Processing batch ${batchNum}...`);
    
    // Get next batch of leads
    const { data: leads, error } = await supabase
      .from('leads')
      .select('id, name, slug')
      .not('slug', 'is', null)
      .like('slug', '%_%')
      .limit(BATCH_SIZE);
    
    if (error) {
      console.error(`❌ Error fetching batch ${batchNum}:`, error.message);
      break;
    }
    
    if (!leads?.length) {
      console.log('✅ No more slugs to fix');
      break;
    }
    
    let batchFixed = 0;
    let batchFailed = 0;
    
    for (const lead of leads) {
      const originalSlug = lead.slug;
      
      // Remove underscore and everything after it
      const cleanSlug = originalSlug.replace(/_.*$/, '');
      
      if (cleanSlug !== originalSlug) {
        try {
          const { error: updateError } = await supabase
            .from('leads')
            .update({ 
              slug: cleanSlug,
              updated_at: new Date().toISOString()
            })
            .eq('id', lead.id);
          
          if (updateError) {
            console.error(`❌ Failed to update ${lead.name}:`, updateError.message);
            batchFailed++;
          } else {
            batchFixed++;
            if (batchFixed % 50 === 0) {
              console.log(`   ✅ Fixed ${batchFixed}/${leads.length} in batch ${batchNum}`);
            }
          }
        } catch (err) {
          console.error(`❌ Error updating ${lead.name}:`, err.message);
          batchFailed++;
        }
      }
    }
    
    totalFixed += batchFixed;
    totalFailed += batchFailed;
    totalProcessed += leads.length;
    
    console.log(`📈 Batch ${batchNum} complete: ${batchFixed} fixed, ${batchFailed} failed`);
    console.log(`📊 Overall progress: ${totalProcessed}/${totalCount} (${Math.round(totalProcessed/totalCount*100)}%)`);
    
    batchNum++;
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n🎉 COMPLETE: ${totalFixed} slugs fixed, ${totalFailed} failed`);
  console.log(`📊 Total processed: ${totalProcessed} records`);
}

fixSlugs().catch(console.error);