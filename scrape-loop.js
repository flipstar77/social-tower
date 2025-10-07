/**
 * Extract bracket data from Playwright snapshot
 */

function extractBracketFromSnapshot(snapshot) {
    // Extract bracket ID from combobox - look for the "Selected X" pattern
    const bracketMatch = snapshot.match(/combobox "Selected ([A-Z0-9]+)\./);
    if (!bracketMatch) {
        console.error('Could not find bracket ID in snapshot');
        return null;
    }
    const bracketId = bracketMatch[1];

    // Extract all player rows - they start with 'row "' and contain player data
    const players = [];

    // Match pattern: row "rank player_id name real_name wave datetime"
    const lines = snapshot.split('\n');
    for (const line of lines) {
        const rowMatch = line.match(/row "(\d+) ([A-F0-9]+) ([^\s]+) ([^\s]+) (\d+) 2025-10-\d+ \d+:\d+:\d+"/);
        if (rowMatch) {
            const [_, rank, playerId, name, realName, wave] = rowMatch;
            players.push({
                rank: parseInt(rank),
                playerId: playerId,
                name: name,
                realName: realName,
                wave: parseInt(wave)
            });
        }
    }

    if (players.length !== 30) {
        console.error(`Expected 30 players, found ${players.length}`);
        return null;
    }

    return {
        bracketId,
        players
    };
}

// Test with current snapshot
const testSnapshot = `combobox "Selected GEFVHRFBWBFBDGUA. Select Bracket" [ref=e876]
row "1 47C68D656E526383 ENO_Tw san_grandpa 3387 2025-10-05 05:30:00" [ref=e1200]`;

const result = extractBracketFromSnapshot(testSnapshot);
console.log('Test extraction:', JSON.stringify(result, null, 2));

module.exports = { extractBracketFromSnapshot };
