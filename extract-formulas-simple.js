/**
 * Simple formula extraction from Excel using xlsx library
 */
const xlsx = require('xlsx');
const fs = require('fs');

console.log('Loading Excel workbook...');

// Load workbook with cellFormula: true to get formulas
const workbook = xlsx.readFile(
    'server/database/migrations/TheTowerofTobi.xlsx',
    { cellFormula: true }
);

console.log(`Loaded workbook with ${workbook.SheetNames.length} sheets`);
console.log('Sheets:', workbook.SheetNames.join(', '));

// Extract from key sheets
const sheetsToExtract = ['eDamage', 'eHP', 'eEcon', 'Lab Researches'];

const allExtractions = {};

for (const sheetName of sheetsToExtract) {
    if (!workbook.SheetNames.includes(sheetName)) {
        console.log(`Warning: Sheet '${sheetName}' not found!`);
        continue;
    }

    console.log(`\nExtracting from: ${sheetName}`);
    const sheet = workbook.Sheets[sheetName];

    const formulas = {};
    const values = {};

    // Get all cells in the sheet
    for (const cellRef in sheet) {
        if (cellRef[0] === '!') continue; // Skip metadata

        const cell = sheet[cellRef];

        if (cell.f) {
            // Has formula
            formulas[cellRef] = cell.f;
        } else if (cell.v !== undefined) {
            // Has value
            values[cellRef] = cell.v;
        }
    }

    console.log(`  Found ${Object.keys(formulas).length} formulas`);
    console.log(`  Found ${Object.keys(values).length} values`);

    allExtractions[sheetName] = {
        formulas,
        values,
        formula_count: Object.keys(formulas).length,
        value_count: Object.keys(values).length
    };
}

// Save results
console.log('\nSaving results...');

for (const [sheetName, data] of Object.entries(allExtractions)) {
    const filename = `formulas-${sheetName.replace(/\s+/g, '_')}.json`;
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`Saved ${sheetName} to ${filename}`);
}

// Create summary
const summary = {
    total_sheets: Object.keys(allExtractions).length,
    sheets: Object.fromEntries(
        Object.entries(allExtractions).map(([name, data]) => [
            name,
            {
                formulas: data.formula_count,
                values: data.value_count
            }
        ])
    )
};

fs.writeFileSync('formula-extraction-summary.json', JSON.stringify(summary, null, 2));
console.log('Summary saved to formula-extraction-summary.json');

const totalFormulas = Object.values(allExtractions).reduce((sum, d) => sum + d.formula_count, 0);
const totalValues = Object.values(allExtractions).reduce((sum, d) => sum + d.value_count, 0);

console.log('\nEXTRACTION COMPLETE!');
console.log(`Total formulas extracted: ${totalFormulas}`);
console.log(`Total values extracted: ${totalValues}`);

// Print some sample formulas from eDamage sheet for verification
if (allExtractions.eDamage) {
    console.log('\nSample formulas from eDamage sheet:');
    const edmgFormulas = allExtractions.eDamage.formulas;
    let count = 0;
    for (const [cell, formula] of Object.entries(edmgFormulas)) {
        if (count < 10) {
            console.log(`  ${cell}: ${formula.substring(0, 80)}${formula.length > 80 ? '...' : ''}`);
            count++;
        }
    }
}
