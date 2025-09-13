const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

console.log('Converting Excel files to CSV and organizing all business data...\n');

// Read the analysis results
const analysisResults = JSON.parse(fs.readFileSync('data/file-analysis.json', 'utf8'));
const successfulFiles = analysisResults.filter(r => r.success);

// Group files by business type and state
const organized = {};

successfulFiles.forEach(file => {
    const { businessType, primaryState, filename } = file;
    
    if (!organized[businessType]) {
        organized[businessType] = {};
    }
    
    if (!organized[businessType][primaryState]) {
        organized[businessType][primaryState] = [];
    }
    
    organized[businessType][primaryState].push(file);
});

console.log('File Organization Plan:');
console.log('='.repeat(60));

Object.entries(organized).forEach(([businessType, states]) => {
    console.log(`\n📁 ${businessType.toUpperCase()}:`);
    Object.entries(states).forEach(([state, files]) => {
        console.log(`  📍 ${state}:`);
        files.forEach(file => {
            console.log(`    • ${path.basename(file.filename)} (${file.totalRecords} records)`);
        });
    });
});

console.log('\n' + '='.repeat(60));
console.log('Converting and organizing files...\n');

// Process each business type
Object.entries(organized).forEach(([businessType, states]) => {
    console.log(`\n🔄 Processing ${businessType.toUpperCase()}...`);
    
    Object.entries(states).forEach(([state, files]) => {
        console.log(`\n  📍 ${state} ${businessType}:`);
        
        if (files.length === 1) {
            // Single file for this state/business type
            const file = files[0];
            const newName = `${businessType}-${state.toLowerCase()}.csv`;
            const targetPath = `data/outscraper-imports/${businessType}/${newName}`;
            
            try {
                let csvContent = '';
                
                if (file.isExcel) {
                    // Convert Excel to CSV
                    console.log(`    Converting ${path.basename(file.filename)} to CSV...`);
                    const workbook = XLSX.readFile(file.filename);
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    csvContent = XLSX.utils.sheet_to_csv(worksheet);
                } else {
                    // Copy CSV file
                    console.log(`    Copying ${path.basename(file.filename)}...`);
                    csvContent = fs.readFileSync(file.filename, 'utf8');
                }
                
                // Write to organized location
                fs.writeFileSync(targetPath, csvContent);
                
                const stats = fs.statSync(targetPath);
                console.log(`    ✅ Created: ${targetPath}`);
                console.log(`       Size: ${(stats.size / 1024 / 1024).toFixed(1)} MB`);
                console.log(`       Records: ${file.totalRecords}`);
                
            } catch (error) {
                console.log(`    ❌ Error processing ${file.filename}: ${error.message}`);
            }
            
        } else if (files.length > 1) {
            // Multiple files - need to merge or create separate files
            console.log(`    Found ${files.length} files for ${state} ${businessType}:`);
            
            files.forEach((file, index) => {
                const suffix = files.length > 1 ? `-${index + 1}` : '';
                const newName = `${businessType}-${state.toLowerCase()}${suffix}.csv`;
                const targetPath = `data/outscraper-imports/${businessType}/${newName}`;
                
                try {
                    let csvContent = '';
                    
                    if (file.isExcel) {
                        console.log(`      Converting ${path.basename(file.filename)} to CSV...`);
                        const workbook = XLSX.readFile(file.filename);
                        const sheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[sheetName];
                        csvContent = XLSX.utils.sheet_to_csv(worksheet);
                    } else {
                        console.log(`      Copying ${path.basename(file.filename)}...`);
                        csvContent = fs.readFileSync(file.filename, 'utf8');
                    }
                    
                    fs.writeFileSync(targetPath, csvContent);
                    
                    const stats = fs.statSync(targetPath);
                    console.log(`      ✅ Created: ${targetPath}`);
                    console.log(`         Size: ${(stats.size / 1024 / 1024).toFixed(1)} MB`);
                    console.log(`         Records: ${file.totalRecords}`);
                    
                } catch (error) {
                    console.log(`      ❌ Error processing ${file.filename}: ${error.message}`);
                }
            });
        }
    });
});

// Also move existing clean files
console.log('\n🔄 Moving existing clean files...');

try {
    if (fs.existsSync('hvac-louisiana.csv')) {
        fs.renameSync('hvac-louisiana.csv', 'data/outscraper-imports/hvac/hvac-louisiana-existing.csv');
        console.log('✅ Moved hvac-louisiana.csv to organized folder');
    }
    
    if (fs.existsSync('hvac-alabama-merged.csv')) {
        fs.renameSync('hvac-alabama-merged.csv', 'data/outscraper-imports/hvac/hvac-alabama-existing.csv');
        console.log('✅ Moved hvac-alabama-merged.csv to organized folder');
    }
} catch (error) {
    console.log(`⚠️  Error moving existing files: ${error.message}`);
}

console.log('\n' + '='.repeat(60));
console.log('ORGANIZATION COMPLETE!');
console.log('='.repeat(60));

// Generate final summary
console.log('\n📂 Final Organization Structure:');

const businessFolders = fs.readdirSync('data/outscraper-imports');
businessFolders.forEach(folder => {
    const folderPath = `data/outscraper-imports/${folder}`;
    if (fs.statSync(folderPath).isDirectory()) {
        console.log(`\n📁 ${folder.toUpperCase()}:`);
        try {
            const files = fs.readdirSync(folderPath);
            files.forEach(file => {
                if (file.endsWith('.csv')) {
                    const filePath = path.join(folderPath, file);
                    const stats = fs.statSync(filePath);
                    console.log(`  • ${file} (${(stats.size / 1024 / 1024).toFixed(1)} MB)`);
                }
            });
        } catch (error) {
            console.log(`  (empty or error reading folder)`);
        }
    }
});

console.log('\n🎯 Ready for import! All files are organized and converted to CSV format.');
console.log('📍 Location: data/outscraper-imports/');
console.log('\nYou can now import these files using the dashboard at /dashboard/contacts');

// Create a summary file
const summary = {
    totalBusinessTypes: Object.keys(organized).length,
    totalFiles: successfulFiles.length,
    businessTypes: Object.keys(organized),
    statesRepresented: [...new Set(successfulFiles.map(f => f.primaryState))].sort(),
    totalRecords: successfulFiles.reduce((sum, f) => sum + f.totalRecords, 0),
    generatedAt: new Date().toISOString()
};

fs.writeFileSync('data/import-summary.json', JSON.stringify(summary, null, 2));
console.log('📊 Import summary saved to data/import-summary.json');