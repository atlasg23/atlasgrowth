const fs = require('fs');
const Papa = require('papaparse');

console.log('Checking for duplicate place_ids in Louisiana HVAC files...\n');

const la1 = 'data/outscraper-imports/hvac/hvac-louisiana-existing.csv';
const la2 = 'data/outscraper-imports/hvac/hvac-la.csv';

try {
    console.log('Reading Louisiana HVAC files...');
    
    // Read both files
    const csv1 = fs.readFileSync(la1, 'utf8');
    const parsed1 = Papa.parse(csv1, { header: true, skipEmptyLines: true });
    const data1 = parsed1.data;
    console.log(`  ${la1}: ${data1.length} records`);

    const csv2 = fs.readFileSync(la2, 'utf8');
    const parsed2 = Papa.parse(csv2, { header: true, skipEmptyLines: true });
    const data2 = parsed2.data;
    console.log(`  ${la2}: ${data2.length} records`);

    // Check for duplicates by place_id
    const placeIdMap = new Map();
    const duplicates = new Set();
    let duplicateCount = 0;

    // Process first file
    data1.forEach((row, index) => {
        const placeId = row.place_id;
        if (placeId && placeId.trim() !== '') {
            const cleanPlaceId = placeId.trim();
            placeIdMap.set(cleanPlaceId, { 
                file: 'existing', 
                row: index,
                businessName: row.name || 'Unknown',
                data: row
            });
        }
    });

    // Process second file and check for duplicates
    data2.forEach((row, index) => {
        const placeId = row.place_id;
        if (placeId && placeId.trim() !== '') {
            const cleanPlaceId = placeId.trim();
            if (placeIdMap.has(cleanPlaceId)) {
                duplicates.add(cleanPlaceId);
                duplicateCount++;
            } else {
                placeIdMap.set(cleanPlaceId, { 
                    file: 'new', 
                    row: index,
                    businessName: row.name || 'Unknown',
                    data: row
                });
            }
        }
    });

    console.log(`\nDuplicate Analysis:`);
    console.log(`  Total unique place_ids: ${placeIdMap.size}`);
    console.log(`  Duplicates found: ${duplicateCount}`);

    if (duplicates.size > 0) {
        console.log(`\n🔄 Merging files and removing duplicates...`);
        
        // Create merged dataset keeping the more complete record for duplicates
        const mergedData = [];
        const processedPlaceIds = new Set();
        
        // Add all records from first file
        data1.forEach(row => {
            const placeId = row.place_id;
            if (placeId && placeId.trim() !== '') {
                mergedData.push(row);
                processedPlaceIds.add(placeId.trim());
            } else {
                mergedData.push(row);
            }
        });

        // Add non-duplicate records from second file
        let addedFromSecond = 0;
        data2.forEach(row => {
            const placeId = row.place_id;
            if (placeId && placeId.trim() !== '') {
                const cleanPlaceId = placeId.trim();
                if (!processedPlaceIds.has(cleanPlaceId)) {
                    mergedData.push(row);
                    addedFromSecond++;
                }
            } else {
                mergedData.push(row);
                addedFromSecond++;
            }
        });

        console.log(`  Records from existing file: ${data1.length}`);
        console.log(`  New records from second file: ${addedFromSecond}`);
        console.log(`  Total merged records: ${mergedData.length}`);

        // Write merged file
        const mergedCsv = Papa.unparse(mergedData);
        const outputFile = 'data/outscraper-imports/hvac/hvac-louisiana-merged.csv';
        fs.writeFileSync(outputFile, mergedCsv);
        
        console.log(`\n✅ Created merged file: ${outputFile}`);
        
        // Remove old files
        fs.unlinkSync(la1);
        fs.unlinkSync(la2);
        console.log('🗑️  Removed original Louisiana files');
        
    } else {
        console.log(`\n✅ No duplicates found! Files can be safely merged.`);
        
        // Simple concatenation
        const allData = [...data1, ...data2];
        const mergedCsv = Papa.unparse(allData);
        const outputFile = 'data/outscraper-imports/hvac/hvac-louisiana-merged.csv';
        fs.writeFileSync(outputFile, mergedCsv);
        
        console.log(`✅ Created merged file: ${outputFile} (${allData.length} records)`);
        
        // Remove old files
        fs.unlinkSync(la1);
        fs.unlinkSync(la2);
        console.log('🗑️  Removed original Louisiana files');
    }

} catch (error) {
    console.error('Error:', error.message);
}