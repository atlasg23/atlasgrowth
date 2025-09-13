const fs = require('fs');
const Papa = require('papaparse');

async function testImport() {
    try {
        console.log('🧪 Testing single file import...\n');
        
        // Test with the smallest file first
        const testFile = 'data/outscraper-imports/fire-protection/fire-protection-la.csv';
        const businessType = 'fire-protection';
        
        console.log(`📁 Testing: ${testFile}`);
        
        // Read CSV
        const csvContent = fs.readFileSync(testFile, 'utf8');
        const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true });
        const data = parsed.data.slice(0, 5); // Test with just 5 records first
        
        console.log(`📊 Testing with ${data.length} sample records`);
        
        // Show sample data structure
        if (data.length > 0) {
            console.log('\n🔍 Sample record fields:');
            Object.keys(data[0]).slice(0, 10).forEach(key => {
                console.log(`   ${key}: ${data[0][key]}`);
            });
            console.log(`   ... and ${Object.keys(data[0]).length - 10} more fields`);
        }
        
        // Send to API
        console.log('\n🚀 Sending to import API...');
        const response = await fetch('http://localhost:3001/api/leads/import', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                data: data,
                businessType: businessType,
                sourceFile: 'fire-protection-la.csv'
            })
        });
        
        const result = await response.json();
        
        console.log('\n📊 Result:');
        console.log(JSON.stringify(result, null, 2));
        
        if (result.success) {
            console.log('\n✅ Test successful! Ready for bulk import.');
        } else {
            console.log('\n❌ Test failed. Need to fix issues first.');
        }
        
    } catch (error) {
        console.error('❌ Test error:', error.message);
    }
}

testImport();