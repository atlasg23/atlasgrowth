const fs = require('fs');
const Papa = require('papaparse');
const path = require('path');

const importFiles = [
    { path: 'data/outscraper-imports/fire-protection/fire-protection-la.csv', businessType: 'fire-protection' },
    { path: 'data/outscraper-imports/hvac/hvac-alabama-existing.csv', businessType: 'hvac' },
    { path: 'data/outscraper-imports/hvac/hvac-ar.csv', businessType: 'hvac' },
    { path: 'data/outscraper-imports/hvac/hvac-louisiana-merged.csv', businessType: 'hvac' },
    { path: 'data/outscraper-imports/pest-control/pest-control-la.csv', businessType: 'pest-control' },
    { path: 'data/outscraper-imports/plumbing/plumbing-al.csv', businessType: 'plumbing' },
    { path: 'data/outscraper-imports/plumbing/plumbing-la.csv', businessType: 'plumbing' },
    { path: 'data/outscraper-imports/pressure-washing/pressure-washing-ar.csv', businessType: 'pressure-washing' },
    { path: 'data/outscraper-imports/pressure-washing/pressure-washing-la.csv', businessType: 'pressure-washing' },
    { path: 'data/outscraper-imports/roofing/roofing-la.csv', businessType: 'roofing' },
    { path: 'data/outscraper-imports/tree-service/tree-service-ar.csv', businessType: 'tree-service' },
    { path: 'data/outscraper-imports/unknown/unknown-la.csv', businessType: 'hvac' }
];

async function importFile(fileInfo, index, total) {
    const { path: filePath, businessType } = fileInfo;
    const fileName = path.basename(filePath);
    
    try {
        console.log(`[${index + 1}/${total}] ${fileName} (${businessType})`);
        
        const csvContent = fs.readFileSync(filePath, 'utf8');
        const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true });
        const data = parsed.data;
        
        console.log(`   📊 ${data.length} records`);
        
        const response = await fetch('http://localhost:3000/api/leads/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                data: data,
                businessType: businessType,
                sourceFile: fileName
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log(`   ✅ ${result.summary.inserted} imported, ${result.summary.duplicates || 0} duplicates`);
        } else {
            console.log(`   ❌ Failed: ${result.error || 'Unknown error'}`);
        }
        
        return result;
        
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function importAll() {
    console.log('🚀 Quick Import Starting...\n');
    
    let totalImported = 0;
    let totalErrors = 0;
    
    for (let i = 0; i < importFiles.length; i++) {
        const result = await importFile(importFiles[i], i, importFiles.length);
        
        if (result.success && result.summary) {
            totalImported += result.summary.inserted || 0;
        } else {
            totalErrors++;
        }
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n🎉 Import Complete!`);
    console.log(`✅ ${totalImported} total records imported`);
    console.log(`❌ ${totalErrors} files failed`);
    
    // Check total in database
    try {
        const response = await fetch('http://localhost:3000/api/leads/count');
        if (response.ok) {
            const count = await response.json();
            console.log(`📊 Total leads in database: ${count.total || 'Unknown'}`);
        }
    } catch (error) {
        console.log('📊 Could not get database count');
    }
}

importAll().catch(console.error);