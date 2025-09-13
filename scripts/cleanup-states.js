#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanupStates() {
  console.log('🧹 Starting State Cleanup Process');
  console.log('=====================================');
  
  try {
    // First, get count of what will be deleted
    const { count: totalCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Total records in database: ${totalCount}`);
    
    // Count records that will be KEPT (LA/AL/AR)
    const { count: keepCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .or('state.ilike.%Louisiana%,state.eq.LA,us_state.ilike.%Louisiana%,us_state.eq.LA,state.ilike.%Alabama%,state.eq.AL,us_state.ilike.%Alabama%,us_state.eq.AL,state.ilike.%Arkansas%,state.eq.AR,us_state.ilike.%Arkansas%,us_state.eq.AR');
    
    const deleteCount = totalCount - keepCount;
    
    console.log(`✅ Records to KEEP (LA/AL/AR): ${keepCount}`);
    console.log(`❌ Records to DELETE (other states): ${deleteCount}`);
    console.log('');
    
    if (deleteCount === 0) {
      console.log('🎉 No cleanup needed - all records are already in target states!');
      return;
    }
    
    // Show breakdown by state of what will be deleted
    console.log('📋 Preview of states being deleted:');
    const { data: statePreview } = await supabase
      .from('leads')
      .select('state, us_state')
      .not('state', 'ilike', '%Louisiana%')
      .not('state', 'eq', 'LA')
      .not('us_state', 'ilike', '%Louisiana%')
      .not('us_state', 'eq', 'LA')
      .not('state', 'ilike', '%Alabama%')
      .not('state', 'eq', 'AL')
      .not('us_state', 'ilike', '%Alabama%')
      .not('us_state', 'eq', 'AL')
      .not('state', 'ilike', '%Arkansas%')
      .not('state', 'eq', 'AR')
      .not('us_state', 'ilike', '%Arkansas%')
      .not('us_state', 'eq', 'AR')
      .limit(10);
    
    statePreview?.forEach((record, i) => {
      console.log(`   ${i+1}. state: "${record.state}" / us_state: "${record.us_state}"`);
    });
    if (deleteCount > 10) console.log(`   ... and ${deleteCount - 10} more`);
    
    console.log('');
    console.log('⚠️  WARNING: This will permanently delete records!');
    console.log('⚠️  Make sure you have backups if needed!');
    console.log('');
    
    // Confirm deletion
    const confirm = process.argv.includes('--execute');
    if (!confirm) {
      console.log('🔍 DRY RUN MODE - No data will be deleted');
      console.log('💡 To actually delete records, run: node scripts/cleanup-states.js --execute');
      return;
    }
    
    console.log('🚀 EXECUTING DELETION...');
    
    // Delete in batches to avoid timeout
    const batchSize = 1000;
    let deletedTotal = 0;
    
    while (true) {
      const { data, error } = await supabase
        .from('leads')
        .delete()
        .not('state', 'ilike', '%Louisiana%')
        .not('state', 'eq', 'LA')
        .not('us_state', 'ilike', '%Louisiana%')
        .not('us_state', 'eq', 'LA')
        .not('state', 'ilike', '%Alabama%')
        .not('state', 'eq', 'AL')
        .not('us_state', 'ilike', '%Alabama%')
        .not('us_state', 'eq', 'AL')
        .not('state', 'ilike', '%Arkansas%')
        .not('state', 'eq', 'AR')
        .not('us_state', 'ilike', '%Arkansas%')
        .not('us_state', 'eq', 'AR')
        .limit(batchSize)
        .select('id');
      
      if (error) {
        console.error('❌ Error during deletion:', error);
        break;
      }
      
      if (!data || data.length === 0) {
        console.log('✅ No more records to delete');
        break;
      }
      
      deletedTotal += data.length;
      console.log(`   Deleted batch of ${data.length} records (${deletedTotal} total)`);
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Final verification
    const { count: finalCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true });
    
    console.log('');
    console.log('🎉 CLEANUP COMPLETED!');
    console.log(`📊 Final record count: ${finalCount}`);
    console.log(`🗑️  Total deleted: ${deletedTotal}`);
    console.log(`✅ Kept (LA/AL/AR): ${finalCount}`);
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  cleanupStates();
}