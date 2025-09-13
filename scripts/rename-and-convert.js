const XLSX = require('xlsx');
const fs = require('fs');

const fileMapping = [
    {
        original: 'Outscraper-20250910005822s5b_hvac_contractor (1).xlsx',
        state: 'LA',
        newName: 'hvac-louisiana.csv'
    },
    {
        original: 'Outscraper-20250910010106s02_hvac_contractor.xlsx', 
        state: 'AL',
        newName: 'hvac-alabama-1.csv'
    },
    {
        original: 'Outscraper-20250910010639s18_hvac_contractor (2).xlsx',
        state: 'AL', 
        newName: 'hvac-alabama-2.csv'
    }
];

console.log('Converting and renaming HVAC contractor files...\n');

fileMapping.forEach((mapping, index) => {
    try {
        console.log(`Processing: ${mapping.original}`);
        console.log(`Converting to: ${mapping.newName}`);
        
        // Read Excel file
        const workbook = XLSX.readFile(mapping.original);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to CSV
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        
        // Write CSV file
        fs.writeFileSync(mapping.newName, csv);
        
        console.log(`✅ Successfully converted ${mapping.state} file`);
        console.log(`   Rows: ${csv.split('\n').length - 1}`);
        console.log(`   Size: ${fs.statSync(mapping.newName).size} bytes`);
        
    } catch (error) {
        console.log(`❌ Error processing ${mapping.original}: ${error.message}`);
    }
    
    console.log('');
});

console.log('Summary:');
console.log('- hvac-louisiana.csv: Louisiana HVAC contractors');
console.log('- hvac-alabama-1.csv: Alabama HVAC contractors (dataset 1)');  
console.log('- hvac-alabama-2.csv: Alabama HVAC contractors (dataset 2)');
console.log('\nNote: No Arkansas file found - you may need to upload the AR dataset separately.');