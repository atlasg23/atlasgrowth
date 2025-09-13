const fs = require('fs');
const Papa = require('papaparse');
const path = require('path');

console.log('🚀 Starting bulk import of all organized leads to Supabase...\n');

// Find all CSV files in the organized structure
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
    { path: 'data/outscraper-imports/unknown/unknown-la.csv', businessType: 'hvac' } // Unknown is likely HVAC
];

async function importFile(fileInfo) {
    const { path: filePath, businessType } = fileInfo;
    const fileName = path.basename(filePath);
    
    try {
        console.log(`📁 Processing: ${fileName} (${businessType})`);
        
        if (!fs.existsSync(filePath)) {
            console.log(`   ⚠️  File not found: ${filePath}`);
            return { success: false, error: 'File not found' };
        }
        
        // Read and parse CSV
        const csvContent = fs.readFileSync(filePath, 'utf8');
        const parsed = Papa.parse(csvContent, { 
            header: true, 
            skipEmptyLines: true 
        });
        
        if (parsed.errors.length > 0) {
            console.log(`   ⚠️  ${parsed.errors.length} parsing errors`);
        }
        
        const data = parsed.data;
        console.log(`   📊 Records to import: ${data.length}`);
        
        // Send to API
        const response = await fetch('http://localhost:3001/api/leads/import', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                data: data,
                businessType: businessType,
                sourceFile: fileName
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log(`   ✅ Success! Imported ${result.summary.inserted} records`);
            if (result.summary.duplicates > 0) {
                console.log(`   📊 Skipped ${result.summary.duplicates} duplicates`);
            }
            if (result.summary.errors > 0) {
                console.log(`   ⚠️  ${result.summary.errors} errors`);
            }
        } else {
            console.log(`   ❌ Failed: ${result.error}`);
            if (result.details?.insertErrors?.length > 0) {
                console.log(`   🔍 Errors: ${result.details.insertErrors.map(e => e.error).join(', ')}`);
            }
        }
        
        return result;
        
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function importAll() {
    console.log('🎯 Import Plan:');
    importFiles.forEach((file, index) => {
        const fileName = path.basename(file.path);
        console.log(`   ${index + 1}. ${fileName} → ${file.businessType}`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('🚀 Starting imports...\n');
    
    const results = [];
    let totalProcessed = 0;
    let totalImported = 0;
    let totalDuplicates = 0;
    let totalErrors = 0;
    
    for (const fileInfo of importFiles) {
        const result = await importFile(fileInfo);
        results.push({
            file: path.basename(fileInfo.path),
            businessType: fileInfo.businessType,
            ...result
        });
        
        if (result.summary) {
            totalProcessed += result.summary.processed || 0;
            totalImported += result.summary.inserted || 0;
            totalDuplicates += result.summary.duplicates || 0;
            totalErrors += result.summary.errors || 0;
        }
        
        console.log(''); // Add spacing between imports
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('='.repeat(60));
    console.log('🎉 BULK IMPORT COMPLETE!');
    console.log('='.repeat(60));
    
    console.log(`\n📊 Final Summary:`);
    console.log(`   Files processed: ${results.length}`);
    console.log(`   Total records processed: ${totalProcessed}`);
    console.log(`   Successfully imported: ${totalImported}`);
    console.log(`   Duplicates skipped: ${totalDuplicates}`);
    console.log(`   Errors encountered: ${totalErrors}`);
    
    // Success breakdown by business type
    console.log(`\n🏢 By Business Type:`);
    const businessTypes = {};
    results.forEach(r => {
        if (r.success && r.summary) {
            if (!businessTypes[r.businessType]) {
                businessTypes[r.businessType] = { files: 0, records: 0 };
            }
            businessTypes[r.businessType].files++;
            businessTypes[r.businessType].records += r.summary.inserted || 0;
        }
    });
    
    Object.entries(businessTypes)
        .sort(([,a], [,b]) => b.records - a.records)
        .forEach(([type, stats]) => {
            console.log(`   ${type}: ${stats.records} records (${stats.files} files)`);
        });
    
    // Failed imports
    const failed = results.filter(r => !r.success);
    if (failed.length > 0) {
        console.log(`\n❌ Failed Imports:`);
        failed.forEach(f => {
            console.log(`   ${f.file}: ${f.error}`);
        });
    }
    
    console.log(`\n🎯 Your leads table is now populated with ${totalImported} business records!`);
    console.log(`🔗 Access via: /dashboard/contacts`);
    
    // Save results
    fs.writeFileSync('data/import-results.json', JSON.stringify(results, null, 2));
    console.log('📊 Detailed results saved to data/import-results.json');
}

// Start the import process
importAll().catch(console.error);