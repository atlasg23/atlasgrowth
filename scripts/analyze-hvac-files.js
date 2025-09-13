const XLSX = require('xlsx');
const fs = require('fs');

// File paths
const files = [
    'Outscraper-20250910005822s5b_hvac_contractor (1).xlsx',
    'Outscraper-20250910010106s02_hvac_contractor.xlsx', 
    'Outscraper-20250910010639s18_hvac_contractor (2).xlsx'
];

console.log('Analyzing HVAC contractor files...\n');

files.forEach((filename, index) => {
    try {
        console.log(`File ${index + 1}: ${filename}`);
        
        // Read the Excel file
        const workbook = XLSX.readFile(filename);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON to analyze data
        const data = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: '',
            raw: false 
        });
        
        if (data.length > 1) {
            // Look for state information in the first few rows
            const headers = data[0];
            const firstDataRow = data[1] || [];
            const secondDataRow = data[2] || [];
            const thirdDataRow = data[3] || [];
            
            // Find state column - check all possible state field names
            let stateCol = -1;
            const stateHeaders = ['state', 'us_state', 'State', 'US State'];
            for (let i = 0; i < headers.length; i++) {
                const header = String(headers[i] || '').toLowerCase();
                if (header === 'state' || header === 'us_state' || header.includes('state')) {
                    stateCol = i;
                    console.log(`  - Found state column at index ${i}: "${headers[i]}"`);
                    break;
                }
            }
            
            let detectedState = 'unknown';
            if (stateCol >= 0) {
                // Check first 50 rows for state to get better sample
                const states = [];
                const stateValues = [];
                for (let row = 1; row <= Math.min(50, data.length - 1); row++) {
                    const stateValue = data[row] ? data[row][stateCol] : null;
                    stateValues.push(stateValue);
                    if (stateValue) {
                        const stateStr = String(stateValue).toUpperCase().trim();
                        if (stateStr.length === 2 && /^[A-Z]{2}$/.test(stateStr)) {
                            states.push(stateStr);
                        } else if (['ALABAMA', 'ARKANSAS', 'LOUISIANA'].includes(stateStr)) {
                            if (stateStr === 'ALABAMA') states.push('AL');
                            else if (stateStr === 'ARKANSAS') states.push('AR');
                            else if (stateStr === 'LOUISIANA') states.push('LA');
                        } else if (stateStr.length > 2) {
                            // Check for partial matches
                            if (stateStr.includes('ALABAMA')) states.push('AL');
                            else if (stateStr.includes('ARKANSAS')) states.push('AR');  
                            else if (stateStr.includes('LOUISIANA')) states.push('LA');
                        }
                    }
                }
                
                console.log(`  - Sample state values: ${stateValues.slice(0, 5).join(', ')}`);
                
                if (states.length > 0) {
                    // Find most common state
                    const stateCounts = {};
                    states.forEach(state => {
                        stateCounts[state] = (stateCounts[state] || 0) + 1;
                    });
                    detectedState = Object.keys(stateCounts).reduce((a, b) => 
                        stateCounts[a] > stateCounts[b] ? a : b
                    );
                    console.log(`  - States found: ${Object.keys(stateCounts).join(', ')}`);
                }
            } else {
                // Try to find state in address fields
                const addressFields = ['full_address', 'city', 'address'];
                let addressCol = -1;
                for (let i = 0; i < headers.length; i++) {
                    const header = String(headers[i] || '').toLowerCase();
                    if (addressFields.some(field => header.includes(field))) {
                        addressCol = i;
                        break;
                    }
                }
                
                if (addressCol >= 0) {
                    // Look for state patterns in addresses
                    for (let row = 1; row <= Math.min(10, data.length - 1); row++) {
                        const address = String(data[row] ? data[row][addressCol] : '');
                        const stateMatch = address.match(/\b(AL|AR|LA|Alabama|Arkansas|Louisiana)\b/i);
                        if (stateMatch) {
                            const state = stateMatch[1].toUpperCase();
                            if (state === 'ALABAMA') detectedState = 'AL';
                            else if (state === 'ARKANSAS') detectedState = 'AR';
                            else if (state === 'LOUISIANA') detectedState = 'LA';
                            else detectedState = state;
                            break;
                        }
                    }
                }
            }
            
            console.log(`  - Total rows: ${data.length - 1} (excluding header)`);
            console.log(`  - State detected: ${detectedState}`);
            console.log(`  - Headers: ${headers.slice(0, 5).join(', ')}...`);
            
            // Sample addresses from multiple rows to double-check
            const addressCol = headers.findIndex(h => 
                h && (h.toLowerCase().includes('address') || h.toLowerCase().includes('city'))
            );
            if (addressCol >= 0) {
                const sampleAddresses = [firstDataRow[addressCol], secondDataRow[addressCol], thirdDataRow[addressCol]]
                    .filter(addr => addr)
                    .slice(0, 2);
                console.log(`  - Sample locations: ${sampleAddresses.join(', ')}`);
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