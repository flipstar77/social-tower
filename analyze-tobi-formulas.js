/**
 * Analyze Tobi spreadsheet formulas to understand eDamage, eHP, and eEcon calculations
 */

const fs = require('fs');
const path = require('path');

// Read the CSV files
const eDamageCSV = fs.readFileSync(path.join(__dirname, 'assets/TheTowerofTobi - eDamage.csv'), 'utf-8');
const eHPCSV = fs.readFileSync(path.join(__dirname, 'assets/TheTowerofTobi - eHP.csv'), 'utf-8');
const eEconCSV = fs.readFileSync(path.join(__dirname, 'assets/TheTowerofTobi - eEcon.csv'), 'utf-8');

function parseCSV(csv) {
    return csv.split('\n').map(line => {
        // Split by comma, but handle quoted values
        const values = [];
        let current = '';
        let inQuotes = false;

        for (let char of line) {
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim());
        return values;
    });
}

console.log('='.repeat(80));
console.log('ANALYZING TOBI SPREADSHEET FORMULAS');
console.log('='.repeat(80));

// Parse eDamage sheet
console.log('\n' + '='.repeat(80));
console.log('eDamage SHEET STRUCTURE:');
console.log('='.repeat(80));

const eDamageRows = parseCSV(eDamageCSV);

// Find the stat labels row (row with "Damage", "Attack Speed", etc.)
const statLabelsRowIndex = eDamageRows.findIndex(row =>
    row[2] === 'Damage' && row[0] === '' && row[1] === ''
);

if (statLabelsRowIndex >= 0) {
    console.log(`\nFound stat labels at row ${statLabelsRowIndex}:`);

    // Print next 10 rows to see the structure
    for (let i = statLabelsRowIndex; i < Math.min(statLabelsRowIndex + 15, eDamageRows.length); i++) {
        const row = eDamageRows[i];
        if (row[2]) {
            console.log(`Row ${i}: ${row[2]} = ${row[3] || 'N/A'}`);
        }
    }
}

// Look for column headers that might contain formula information
console.log('\n\nLooking for calculation columns...');
const headerRow = eDamageRows[3]; // Usually headers are around row 3-4
console.log('\nHeader row columns (first 50):');
headerRow.slice(0, 50).forEach((header, i) => {
    if (header && header.trim()) {
        console.log(`  Col ${i}: ${header}`);
    }
});

// Find rows that contain "eDamage" or calculation info
console.log('\n\nSearching for eDamage calculation rows:');
eDamageRows.forEach((row, i) => {
    const rowText = row.join(',');
    if (rowText.includes('eDamage') && rowText.includes('Calculation')) {
        console.log(`\nRow ${i} contains eDamage Calculation:`);
        row.slice(0, 30).forEach((cell, j) => {
            if (cell && cell.trim()) {
                console.log(`  Col ${j}: ${cell}`);
            }
        });
    }
});

// Look for the calculation formula section
console.log('\n\n' + '='.repeat(80));
console.log('SEARCHING FOR FORMULA PATTERNS:');
console.log('='.repeat(80));

// Find cells that look like they contain the final eDamage value
eDamageRows.forEach((row, i) => {
    row.forEach((cell, j) => {
        if (cell && (cell.includes('E+') || cell.includes('e+')) && parseFloat(cell) > 1e9) {
            console.log(`\nPotential calculated value at Row ${i}, Col ${j}: ${cell}`);
            // Show surrounding cells
            console.log(`  Left context: ${row[Math.max(0, j-3)]}, ${row[Math.max(0, j-2)]}, ${row[Math.max(0, j-1)]}`);
            console.log(`  Right context: ${row[Math.min(row.length-1, j+1)]}, ${row[Math.min(row.length-1, j+2)]}`);
        }
    });
});

// Save detailed analysis
const analysis = {
    eDamage: {
        totalRows: eDamageRows.length,
        statLabelsRow: statLabelsRowIndex,
        headerRow: headerRow.filter(h => h && h.trim()),
    }
};

fs.writeFileSync(
    path.join(__dirname, 'tobi-formula-analysis.json'),
    JSON.stringify(analysis, null, 2)
);

console.log('\n\n' + '='.repeat(80));
console.log('Analysis saved to tobi-formula-analysis.json');
console.log('='.repeat(80));
