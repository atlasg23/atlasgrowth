const XLSX = require('xlsx');

const files = [
    'Outscraper-20250910005822s5b_hvac_contractor (1).xlsx',
    'Outscraper-20250910010106s02_hvac_contractor.xlsx', 
    'Outscraper-20250910010639s18_hvac_contractor (2).xlsx'
];

console.log('Deep scanning all files for state distribution...\n');

files.forEach((filename, index) => {
    try {
        console.log(`File ${index + 1}: ${filename}`);
        
        const workbook = XLSX.readFile(filename);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const data = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: '',
            raw: false 
        });
        
        if (data.length > 1) {
            const headers = data[0];
            
            // Find state column
            let stateCol = -1;
            for (let i = 0; i < headers.length; i++) {
                const header = String(headers[i] || '').toLowerCase();
                if (header === 'state' || header === 'us_state' || header.includes('state')) {
                    stateCol = i;
                    break;
                }
            }
            
            if (stateCol >= 0) {
                // Count all states in the entire file
                const stateCounts = {};
                let totalProcessed = 0;
                
                for (let row = 1; row < data.length; row++) {
                    const stateValue = data[row] ? data[row][stateCol] : null;
                    if (stateValue) {
                        const stateStr = String(stateValue).toUpperCase().trim();
                        let normalizedState = '';
                        
                        if (stateStr.length === 2 && /^[A-Z]{2}$/.test(stateStr)) {
                            normalizedState = stateStr;
                        } else if (stateStr === 'ALABAMA') {
                            normalizedState = 'AL';
                        } else if (stateStr === 'ARKANSAS') {
                            normalizedState = 'AR';
                        } else if (stateStr === 'LOUISIANA') {
                            normalizedState = 'LA';
                        } else if (stateStr.includes('ALABAMA')) {
                            normalizedState = 'AL';
                        } else if (stateStr.includes('ARKANSAS')) {
                            normalizedState = 'AR';
                        } else if (stateStr.includes('LOUISIANA')) {
                            normalizedState = 'LA';
                        }
                        
                        if (normalizedState) {
                            stateCounts[normalizedState] = (stateCounts[normalizedState] || 0) + 1;
                            totalProcessed++;
                        }
                    }
                }
                
                console.log(`  - Total records with state: ${totalProcessed}`);
                console.log('  - State distribution:');
                Object.entries(stateCounts)
                    .sort((a, b) => b[1] - a[1])
                    .forEach(([state, count]) => {
                        const percentage = ((count / totalProcessed) * 100).toFixed(1);
                        console.log(`    ${state}: ${count} (${percentage}%)`);
                    });
                
                // Determine primary state
                const primaryState = Object.keys(stateCounts).reduce((a, b) => 
                    stateCounts[a] > stateCounts[b] ? a : b
                );
                console.log(`  - PRIMARY STATE: ${primaryState}`);
                
            } else {
                console.log('  - No state column found');
            }
        } else {
            console.log('  - No data rows found');
        }
        
        console.log('');
        
    } catch (error) {
        console.log(`  - Error reading file: ${error.message}`);
        console.log('');
    }
});