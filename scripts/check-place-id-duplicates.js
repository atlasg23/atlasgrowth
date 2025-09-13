const fs = require('fs');
const Papa = require('papaparse');

const files = [
    'hvac-louisiana.csv',
    'hvac-alabama-1.csv', 
    'hvac-alabama-2.csv'
];

console.log('Checking for duplicate place_id values across all files...\n');

const allPlaceIds = new Map(); // place_id -> {file, businessName}
const duplicates = new Map(); // place_id -> [{file, businessName}]
let totalProcessed = 0;

files.forEach((filename) => {
    try {
        console.log(`Processing: ${filename}`);
        
        const csvContent = fs.readFileSync(filename, 'utf8');
        const parsed = Papa.parse(csvContent, { 
            header: true,
            skipEmptyLines: true 
        });
        
        if (parsed.errors.length > 0) {
            console.log(`  Warning: ${parsed.errors.length} parsing errors`);
        }
        
        const data = parsed.data;
        let fileCount = 0;
        let placeIdCount = 0;
        
        data.forEach((row, index) => {
            fileCount++;
            const placeId = row.place_id;
            const businessName = row.name || `Row ${index + 1}`;
            
            if (placeId && placeId.trim() !== '') {
                placeIdCount++;
                const cleanPlaceId = placeId.trim();
                
                if (allPlaceIds.has(cleanPlaceId)) {
                    // Duplicate found
                    if (!duplicates.has(cleanPlaceId)) {
                        duplicates.set(cleanPlaceId, [
                            allPlaceIds.get(cleanPlaceId), // Original occurrence
                            { file: filename, businessName: businessName }
                        ]);
                    } else {
                        duplicates.get(cleanPlaceId).push({ 
                            file: filename, 
                            businessName: businessName 
                        });
                    }
                } else {
                    allPlaceIds.set(cleanPlaceId, { 
                        file: filename, 
                        businessName: businessName 
                    });
                }
            }
        });
        
        console.log(`  - Total rows: ${fileCount}`);
        console.log(`  - Rows with place_id: ${placeIdCount}`);
        console.log(`  - Place ID coverage: ${((placeIdCount / fileCount) * 100).toFixed(1)}%`);
        
        totalProcessed += fileCount;
        
    } catch (error) {
        console.log(`  Error processing ${filename}: ${error.message}`);
    }
    
    console.log('');
});

console.log('='.repeat(60));
console.log('DUPLICATE ANALYSIS RESULTS');
console.log('='.repeat(60));

console.log(`Total records processed: ${totalProcessed}`);
console.log(`Unique place_ids found: ${allPlaceIds.size}`);
console.log(`Duplicate place_ids found: ${duplicates.size}`);

if (duplicates.size > 0) {
    console.log('\n🚨 DUPLICATES FOUND:');
    console.log('');
    
    Array.from(duplicates.entries())
        .slice(0, 20) // Show first 20 duplicates
        .forEach(([placeId, occurrences]) => {
            console.log(`Place ID: ${placeId}`);
            occurrences.forEach((occurrence, index) => {
                console.log(`  ${index + 1}. File: ${occurrence.file} | Business: ${occurrence.businessName}`);
            });
            console.log('');
        });
        
    if (duplicates.size > 20) {
        console.log(`... and ${duplicates.size - 20} more duplicate place_ids`);
    }
    
    // Summary by file pairs
    console.log('\nDuplicate Summary by File Pairs:');
    const filePairCounts = {};
    
    duplicates.forEach((occurrences, placeId) => {
        const fileSet = [...new Set(occurrences.map(o => o.file))].sort();
        const pairKey = fileSet.join(' <-> ');
        filePairCounts[pairKey] = (filePairCounts[pairKey] || 0) + 1;
    });
    
    Object.entries(filePairCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([pair, count]) => {
            console.log(`  ${pair}: ${count} duplicate place_ids`);
        });
        
} else {
    console.log('\n✅ NO DUPLICATES FOUND!');
    console.log('All place_ids are unique across all three files.');
    console.log('This confirms that the datasets represent different businesses.');
}

console.log('\n' + '='.repeat(60));