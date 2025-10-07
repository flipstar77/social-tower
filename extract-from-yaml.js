/**
 * Extract bracket data from YAML snapshot string
 * Usage: Extract bracket ID and all player rows from a snapshot
 */

function extractBracketFromYAML(yamlText) {
    // Extract bracket ID - look for "Selected XXX. Select Bracket"
    const bracketMatch = yamlText.match(/combobox "Selected ([A-Z0-9]+)\. Select Bracket"/);
    if (!bracketMatch) {
        console.error('❌ Could not find bracket ID in YAML');
        return null;
    }
    const bracketId = bracketMatch[1];

    // Extract all player rows
    const players = [];
    const rowPattern = /row "(\d+) ([A-F0-9]+) ([^\s]+) ([^\s]+) (\d+) 2025-10-\d+ \d+:\d+:\d+" \[ref=/g;
    let match;

    while ((match = rowPattern.exec(yamlText)) !== null) {
        const [_, rank, playerId, name, realName, wave] = match;
        players.push({
            rank: parseInt(rank),
            playerId: playerId,
            name: name,
            realName: realName,
            wave: parseInt(wave)
        });
    }

    if (players.length !== 30) {
        console.error(`❌ Expected 30 players, found ${players.length}`);
        return null;
    }

    console.log(`✅ Found bracket ${bracketId} with ${players.length} players`);

    return {
        bracketId,
        players
    };
}

// Read from stdin if run directly
if (require.main === module) {
    const fs = require('fs');
    const args = process.argv.slice(2);

    if (args.length > 0) {
        const yamlText = fs.readFileSync(args[0], 'utf8');
        const result = extractBracketFromYAML(yamlText);
        if (result) {
            console.log(JSON.stringify(result, null, 2));
        } else {
            process.exit(1);
        }
    } else {
        // Read from stdin
        let input = '';
        process.stdin.on('data', chunk => input += chunk);
        process.stdin.on('end', () => {
            const result = extractBracketFromYAML(input);
            if (result) {
                console.log(JSON.stringify(result, null, 2));
            } else {
                process.exit(1);
            }
        });
    }
}

module.exports = { extractBracketFromYAML };
