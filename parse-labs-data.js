const fs = require('fs');
const path = require('path');

// Parse the Lab Researches CSV and create comprehensive knowledge
async function parseLabsCSV() {
    const csvPath = path.join(__dirname, 'assets', 'Lab_Researches.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');

    // Row 1: Lab names
    // Row 2: Column headers (Lvl, Duration, Cost, Gems)
    // Row 3+: Data rows

    const headerRow = lines[0];
    const labs = [];

    // Parse lab names from first row (every 4th column starting from index 0)
    const labNames = [];
    const cols = headerRow.split(',');
    for (let i = 0; i < cols.length; i += 4) {
        const labName = cols[i].trim();
        if (labName && labName !== '') {
            labNames.push(labName);
        }
    }

    console.log(`Found ${labNames.length} labs:`, labNames.slice(0, 10));

    // Parse each lab's data
    const labData = {};

    for (let labIndex = 0; labIndex < labNames.length; labIndex++) {
        const labName = labNames[labIndex];
        if (!labName) continue;

        labData[labName] = {
            name: labName,
            levels: []
        };

        // Parse data rows (starting from row 3)
        for (let rowIndex = 2; rowIndex < lines.length && rowIndex < 20; rowIndex++) {
            const row = lines[rowIndex];
            const cells = row.split(',');

            // Each lab has 4 columns: blank, Lvl, Duration, Cost, Gems
            const baseIndex = labIndex * 4;

            const level = cells[baseIndex + 1]?.trim();
            const duration = cells[baseIndex + 2]?.trim();
            const cost = cells[baseIndex + 3]?.trim();
            const gems = cells[baseIndex + 4]?.trim();

            if (level && duration) {
                labData[labName].levels.push({
                    level: parseInt(level) || level,
                    duration,
                    cost,
                    gems
                });
            }
        }
    }

    return labData;
}

// Format duration to human readable
function formatDuration(duration) {
    if (!duration) return 'Unknown';
    // Duration format: "12:30:02" or "1d  2h  3m"
    return duration;
}

// Create comprehensive lab knowledge documents
async function createLabKnowledge() {
    const labData = await parseLabsCSV();

    let markdown = `# The Tower Game - Complete Lab Research Guide\n\n`;
    markdown += `This guide contains comprehensive information about all research labs in The Tower Game, including upgrade durations, costs, and efficiency.\n\n`;
    markdown += `## Table of Contents\n\n`;

    // Create table of contents
    Object.keys(labData).forEach((labName, idx) => {
        if (labData[labName].levels.length > 0) {
            markdown += `${idx + 1}. [${labName}](#${labName.toLowerCase().replace(/ /g, '-').replace(/[()]/g, '')})\n`;
        }
    });

    markdown += `\n---\n\n`;

    // Add detailed information for each lab
    Object.entries(labData).forEach(([labName, data]) => {
        if (data.levels.length === 0) return;

        markdown += `## ${labName}\n\n`;

        // Add first 6 levels in a table
        markdown += `| Level | Duration | Cost | Gems |\n`;
        markdown += `|-------|----------|------|------|\n`;

        data.levels.slice(0, 6).forEach(level => {
            markdown += `| ${level.level} | ${level.duration} | ${level.cost || 'N/A'} | ${level.gems || 'N/A'} |\n`;
        });

        markdown += `\n`;

        // Add special notes for important labs
        if (labName.includes('Discount')) {
            markdown += `**Note:** Discount labs reduce the cost of other upgrades. The benefit increases with level but requires significant time investment at higher levels.\n\n`;
        } else if (labName.includes('Damage')) {
            markdown += `**Note:** Damage labs directly affect your tower's offensive capabilities. Prioritize based on your current build and tier.\n\n`;
        } else if (labName.includes('Super Tower')) {
            markdown += `**Note:** Super Tower is the highest efficiency lab in the game. Always prioritize this when available.\n\n`;
        } else if (labName.includes('Crit')) {
            markdown += `**Note:** Critical hit labs work synergistically. Combining Crit Factor and Crit Chance provides multiplicative benefits.\n\n`;
        }

        markdown += `---\n\n`;
    });

    // Add FAQ section
    markdown += `## Frequently Asked Questions\n\n`;
    markdown += `### How long does Lab Coin Discount take to upgrade?\n\n`;

    const coinDiscount = labData['Labs Coin Discount'];
    if (coinDiscount && coinDiscount.levels.length > 0) {
        markdown += `Lab Coin Discount upgrade durations:\n`;
        coinDiscount.levels.forEach(level => {
            markdown += `- Level ${level.level}: ${level.duration}\n`;
        });
    }

    markdown += `\n### Which labs should I prioritize?\n\n`;
    markdown += `1. **Super Tower** - Highest efficiency by far (13.38% improvement per day)\n`;
    markdown += `2. **Crit Factor** - High efficiency (1.24% per day) with multiplicative synergy\n`;
    markdown += `3. **Attack Speed** - Good efficiency and consistent DPS boost\n`;
    markdown += `4. **Damage** - Solid choice for linear damage scaling\n\n`;

    markdown += `### When should I upgrade discount labs?\n\n`;
    markdown += `Discount labs become valuable when:\n`;
    markdown += `- You're in late game (Tier 15+)\n`;
    markdown += `- Lab costs exceed trillions of coins\n`;
    markdown += `- You have time for long upgrades (days to weeks)\n`;
    markdown += `- Other priority labs are already maxed\n\n`;

    // Save the markdown file
    const outputPath = path.join(__dirname, 'complete-labs-guide.md');
    fs.writeFileSync(outputPath, markdown, 'utf-8');
    console.log(`✅ Created complete labs guide: ${outputPath}`);

    return outputPath;
}

// Run the script
createLabKnowledge().then(path => {
    console.log('✅ Lab knowledge file created successfully!');
    console.log(`📄 File location: ${path}`);
}).catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
