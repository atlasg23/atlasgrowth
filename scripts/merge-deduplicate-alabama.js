const fs = require('fs');
const Papa = require('papaparse');

console.log('Merging and deduplicating Alabama HVAC files...\n');

// Read both Alabama files
const file1 = 'hvac-alabama-1.csv';
const file2 = 'hvac-alabama-2.csv';

try {
    console.log(`Reading ${file1}...`);
    const csv1 = fs.readFileSync(file1, 'utf8');
    const parsed1 = Papa.parse(csv1, { header: true, skipEmptyLines: true });
    const data1 = parsed1.data;
    console.log(`  - Loaded ${data1.length} records`);

    console.log(`Reading ${file2}...`);
    const csv2 = fs.readFileSync(file2, 'utf8');
    const parsed2 = Papa.parse(csv2, { header: true, skipEmptyLines: true });
    const data2 = parsed2.data;
    console.log(`  - Loaded ${data2.length} records`);

    // Get headers from the first file
    const headers = Object.keys(data1[0] || {});
    console.log(`\nUsing ${headers.length} columns from schema`);

    // Combine all records
    const allRecords = [...data1, ...data2];
    console.log(`\nCombined total: ${allRecords.length} records`);

    // Deduplicate by place_id
    const uniqueRecords = new Map();
    let duplicatesRemoved = 0;

    allRecords.forEach((record, index) => {
        const placeId = record.place_id;
        
        if (placeId && placeId.trim() !== '') {
            const cleanPlaceId = placeId.trim();
            
            if (uniqueRecords.has(cleanPlaceId)) {
                duplicatesRemoved++;
                // Keep the record with more complete data (more non-empty fields)
                const existing = uniqueRecords.get(cleanPlaceId);
                const existingFields = Object.values(existing).filter(v => v && v.trim() !== '').length;
                const currentFields = Object.values(record).filter(v => v && v.trim() !== '').length;
                
                if (currentFields > existingFields) {
                    uniqueRecords.set(cleanPlaceId, record);
                    console.log(`  Replaced record for ${record.name || 'Unknown'} (more complete data)`);
                }
            } else {
                uniqueRecords.set(cleanPlaceId, record);
            }
        } else {
            // Records without place_id - add with a unique key
            const uniqueKey = `no_place_id_${index}`;
            uniqueRecords.set(uniqueKey, record);
        }
    });

    const finalRecords = Array.from(uniqueRecords.values());
    console.log(`\nDeduplication complete:`);
    console.log(`  - Original total: ${allRecords.length}`);
    console.log(`  - Duplicates removed: ${duplicatesRemoved}`);
    console.log(`  - Final unique records: ${finalRecords.length}`);

    // Convert back to CSV
    const outputCsv = Papa.unparse(finalRecords);
    const outputFile = 'hvac-alabama-merged.csv';
    
    fs.writeFileSync(outputFile, outputCsv);
    console.log(`\n✅ Created merged file: ${outputFile}`);
    console.log(`   Size: ${fs.statSync(outputFile).size} bytes`);

    // Remove the original two files
    console.log(`\n🗑️  Cleaning up original files...`);
    fs.unlinkSync(file1);
    console.log(`   Deleted: ${file1}`);
    
    fs.unlinkSync(file2);
    console.log(`   Deleted: ${file2}`);

    console.log('\n' + '='.repeat(60));
    console.log('FINAL FILE SUMMARY:');
    console.log('='.repeat(60));
    console.log('✅ hvac-louisiana.csv: Louisiana HVAC contractors');
    console.log('✅ hvac-alabama-merged.csv: Deduplicated Alabama HVAC contractors');
    console.log('\nReady for import to Supabase!');

} catch (error) {
    console.error('Error merging files:', error.message);
}