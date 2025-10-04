// Game Data Parser Utility Module
class GameDataParser {
    // Parse raw game statistics text
    static parseGameStats(content) {
        const lines = content.split('\n').filter(line => line.trim());
        const data = {};
        const fieldMappings = FieldMappings.getFieldMappings();

        for (const line of lines) {
            // Parse tab-separated format first
            let parts = line.split('\t');
            if (parts.length < 2) {
                // Fall back to space-separated (2+ spaces)
                parts = line.split(/\s{2,}/);
            }

            if (parts.length >= 2) {
                const fieldName = parts[0].trim();
                const fieldValue = parts[1].trim();

                console.log(`Parsing field: "${fieldName}" = "${fieldValue}"`);

                // Use FieldMappings to get the correct key, fallback to cleanFieldName
                const key = fieldMappings[fieldName] || this.cleanFieldName(fieldName);
                const value = this.parseFieldValue(fieldValue);

                data[key] = value;
            }
        }

        return data;
    }

    // Clean field names to be valid object keys
    static cleanFieldName(fieldName) {
        return fieldName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
    }

    // Parse individual field values
    static parseFieldValue(value) {
        // Handle empty values
        if (!value || value === '-' || value === 'N/A') {
            return 0;
        }

        // Handle time format (e.g., "3d 0h 20m 57s" or "14h 38m 50s") - keep as string for display
        // Must check this BEFORE number parsing because times can have 'd', 'h', 'm', 's'
        if (value.match(/\d+[dhms]\s/i) || value.match(/\d+[dhms]$/i)) {
            return value; // Keep original formatting
        }

        // Handle percentage (e.g., "95%")
        if (value.endsWith('%')) {
            return parseFloat(value.replace('%', ''));
        }

        // Handle multiplier (e.g., "x8,00")
        if (value.startsWith('x')) {
            return value; // Keep as string for display
        }

        // Handle tier format (e.g., "14+")
        if (value.includes('+')) {
            return parseInt(value.replace('+', ''));
        }

        // Handle currency (remove $ symbol)
        if (value.startsWith('$')) {
            return value; // Keep original formatting with $
        }

        // Handle numbers with units (K, M, B, T, q, Q, s, S) but NOT time units
        if (value.match(/[\d,\.]+[KMBTQS]/i) && !value.match(/[dhm]/i)) {
            return value; // Keep original formatting
        }

        // Handle regular numbers (including European format)
        if (value.match(/^[\d,\.\s]+$/)) {
            return FormattingUtils.parseEuropeanNumber(value);
        }

        // Return as string for non-numeric values
        return value;
    }

    // Parse numbers with unit suffixes (K, M, B, T, q, Q, s, S)
    static parseNumberWithUnits(value) {
        const numPart = value.replace(/[KMBTQS]/i, '');
        const unit = value.match(/[KMBTQS]/i)?.[0]?.toLowerCase();
        const baseNumber = FormattingUtils.parseEuropeanNumber(numPart);

        if (isNaN(baseNumber)) return 0;

        const multipliers = {
            'k': 1e3,
            'm': 1e6,
            'b': 1e9,
            't': 1e12,
            'q': 1e15,   // quadrillion
            's': 1e18    // sextillion
        };

        return baseNumber * (multipliers[unit] || 1);
    }

    // Extract tournament-specific data from game stats
    static extractTournamentData(gameStats) {
        const currentDate = new Date().toISOString().split('T')[0];

        return {
            date: currentDate,
            name: 'Tournament Run',
            rank: 0, // To be filled manually
            score: gameStats.damage_dealt || 0,
            tier: gameStats.tier || 0,
            wave: gameStats.wave || 0,
            rewards: '',
            gameTime: gameStats.game_time || 0,
            realTime: gameStats.real_time || 0,
            coinsEarned: gameStats.coins_earned || 0,
            cashEarned: gameStats.cash_earned || 0,
            killedBy: gameStats.killed_by || 'Unknown'
        };
    }

    // Parse CSV tournament data
    static parseTournamentCSV(content) {
        const lines = content.split('\n').filter(line => line.trim());
        const tournaments = [];

        for (const line of lines) {
            try {
                // CSV format: Date,Name,Rank,Score,Tier,Wave,Rewards
                if (line.includes(',')) {
                    const parts = line.split(',').map(p => p.trim());
                    if (parts.length >= 6) {
                        tournaments.push({
                            date: parts[0],
                            name: parts[1],
                            rank: parseInt(parts[2]),
                            score: parseInt(parts[3]),
                            tier: parseInt(parts[4]),
                            wave: parseInt(parts[5]),
                            rewards: parts[6] || ''
                        });
                        continue;
                    }
                }

                // Tab-separated format
                const tabParts = line.split('\t').map(p => p.trim());
                if (tabParts.length >= 6) {
                    tournaments.push({
                        date: tabParts[0],
                        name: tabParts[1],
                        rank: parseInt(tabParts[2]),
                        score: parseInt(tabParts[3]),
                        tier: parseInt(tabParts[4]),
                        wave: parseInt(tabParts[5]),
                        rewards: tabParts[6] || ''
                    });
                    continue;
                }

                // Space-separated format with number extraction
                if (/\d/.test(line)) {
                    const spaceParts = line.split(/\s+/).filter(p => p.trim());
                    if (spaceParts.length >= 4) {
                        const numbers = spaceParts.filter(p => !isNaN(parseInt(p))).map(p => parseInt(p));
                        if (numbers.length >= 4) {
                            tournaments.push({
                                date: new Date().toISOString().split('T')[0],
                                name: 'Imported Tournament',
                                rank: numbers[0],
                                score: numbers[1],
                                tier: numbers[2],
                                wave: numbers[3],
                                rewards: ''
                            });
                        }
                    }
                }
            } catch (error) {
                console.warn('Failed to parse tournament line:', line, error);
            }
        }

        return tournaments;
    }

    // Validate parsed data
    static validateGameStats(data) {
        const required = ['game_time', 'tier', 'wave'];
        const missing = required.filter(field => !(field in data));

        if (missing.length > 0) {
            console.warn('Missing required fields:', missing);
            return false;
        }

        return true;
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.GameDataParser = GameDataParser;
}