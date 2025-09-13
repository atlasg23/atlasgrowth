const XLSX = require('xlsx');
const fs = require('fs');

const files = [
    'Outscraper-20250910005822s5b_hvac_contractor (1).xlsx',
    'Outscraper-20250910010106s02_hvac_contractor.xlsx', 
    'Outscraper-20250910010639s18_hvac_contractor (2).xlsx'
];

console.log('Comparing files to detect duplicates...\n');

const fileData = {};

// Read and analyze each file
files.forEach((filename, index) => {
    try {
        console.log(`Reading File ${index + 1}: ${filename}`);
        
        const workbook = XLSX.readFile(filename);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const data = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: '',
            raw: false 
        });
        
        // Get file stats
        const fileStats = fs.statSync(filename);
        
        // Get first few business names for comparison
        const businessNames = [];
        const headers = data[0] || [];
        const nameCol = headers.findIndex(h => h && h.toLowerCase().includes('name') && !h.toLowerCase().includes('email'));
        
        if (nameCol >= 0) {
            for (let i = 1; i <= Math.min(10, data.length - 1); i++) {
                const name = data[i] ? data[i][nameCol] : null;
                if (name) businessNames.push(String(name).trim());
            }
        }
        
        fileData[filename] = {
            size: fileStats.size,
            rowCount: data.length - 1,
            sampleNames: businessNames,
            modifiedTime: fileStats.mtime
        };
        
        console.log(`  - Size: ${fileStats.size} bytes`);
        console.log(`  - Rows: ${data.length - 1}`);
        console.log(`  - Modified: ${fileStats.mtime}`);
        console.log(`  - Sample names: ${businessNames.slice(0, 3).join(', ')}`);
        
    } catch (error) {
        console.log(`  - Error reading: ${error.message}`);
    }
    
    console.log('');
});

// Compare files for potential duplicates
console.log('Comparison Analysis:');
const fileNames = Object.keys(fileData);

for (let i = 0; i < fileNames.length; i++) {
    for (let j = i + 1; j < fileNames.length; j++) {
        const file1 = fileNames[i];
        const file2 = fileNames[j];
        const data1 = fileData[file1];
        const data2 = fileData[file2];
        
        console.log(`\nComparing "${file1}" vs "${file2}"`);
        
        // Compare file sizes
        const sizeDiff = Math.abs(data1.size - data2.size);
        const sizeSimilarity = sizeDiff < 1000 ? 'Very Similar' : sizeDiff < 10000 ? 'Similar' : 'Different';
        console.log(`  Size difference: ${sizeDiff} bytes (${sizeSimilarity})`);
        
        // Compare row counts
        const rowDiff = Math.abs(data1.rowCount - data2.rowCount);
        const rowSimilarity = rowDiff < 10 ? 'Very Similar' : rowDiff < 100 ? 'Similar' : 'Different';
        console.log(`  Row count difference: ${rowDiff} rows (${rowSimilarity})`);
        
        // Compare sample business names
        const commonNames = data1.sampleNames.filter(name => data2.sampleNames.includes(name));
        const namesSimilarity = commonNames.length;
        console.log(`  Common business names in sample: ${namesSimilarity}/${Math.max(data1.sampleNames.length, data2.sampleNames.length)}`);
        
        // Overall similarity assessment
        if (sizeDiff < 1000 && rowDiff < 10 && namesSimilarity > 5) {
            console.log(`  🚨 LIKELY DUPLICATE FILES`);
        } else if (namesSimilarity > 3) {
            console.log(`  ⚠️  Possibly related/overlapping data`);
        } else {
            console.log(`  ✅ Appears to be different datasets`);
        }
    }
}