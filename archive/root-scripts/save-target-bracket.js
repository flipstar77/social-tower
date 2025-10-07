/**
 * Save the target player's bracket to database
 */
require('dotenv').config({ path: __dirname + '/server/.env' });
const SupabaseManager = require('./server/supabase-config.js');
const { calculateMedian } = require('./server/scripts/scrape-all-live-brackets.js');

async function saveTargetBracket() {
    const supabase = new SupabaseManager();

    // Target player's bracket data
    const players = [
        { playerId: '215FD28FC52D8C91', name: 'ExiledFarmer', realName: 'nomadic_one', wave: 4018, rank: 1 },
        { playerId: '2CD4D68FD3994F68', name: 'DragnAcolyte', realName: 'dragnacolyte', wave: 2429, rank: 2 },
        { playerId: 'A16CA7F64E3B55D6', name: 'Silvers', realName: 'smb55', wave: 2313, rank: 3 },
        { playerId: '51C1CB681E0A58B2', name: 'CoreyTae', realName: 'coreytae', wave: 1455, rank: 4 },
        { playerId: '73C6AA450C71C41A', name: 'szx', realName: 'szx', wave: 1351, rank: 5 },
        { playerId: '247DBA0A2A41DD8C', name: 'ogeretsu', realName: 'ogeretsu', wave: 903, rank: 6 },
        { playerId: '96CA020CF6050BDD', name: 'ElectedCreature', realName: 'ElectedCreature', wave: 826, rank: 7 },
        { playerId: '845B236F1B40EF9', name: 'oorein', realName: 'oorein', wave: 812, rank: 8 },
        { playerId: 'EA7D662EA42E5543', name: 'Drath', realName: 'Drath', wave: 772, rank: 9 },
        { playerId: 'AB3F6FCBECEE6B60', name: 'Amadis', realName: 'Amadis', wave: 766, rank: 10 },
        { playerId: '695F0EA397928D0C', name: 'Croninc7', realName: 'Croninc7', wave: 738, rank: 11 },
        { playerId: '4C7AF422287F0173', name: 'HereComeDatBoi', realName: 'ostboi', wave: 728, rank: 12 },
        { playerId: 'F17E39096DAAC65F', name: 'AllHailMe', realName: 'allhailme', wave: 675, rank: 13 },
        { playerId: 'DB52117FA6F6ECBF', name: 'Linze', realName: '_linze', wave: 659, rank: 14 },
        { playerId: '12BA6B8B34CFC58B', name: 'IchabodCranium', realName: 'IchabodCranium', wave: 626, rank: 15 },
        { playerId: 'EF9839BFCB418A71', name: 'bibou', realName: 'bibou', wave: 582, rank: 16 },
        { playerId: '188EAC641A3EBC7A', name: 'TowerOfTobi', realName: 'mrflipstar', wave: 544, rank: 17 },
        { playerId: '8FC5091D6012E15', name: 'Herrboarder', realName: 'Herrboarder', wave: 535, rank: 18 },
        { playerId: 'FADF16ECE1EA8206', name: 'altema', realName: 'altema', wave: 523, rank: 19 },
        { playerId: '75A5E2F726BA859A', name: 'qntum23', realName: 'qntum23', wave: 516, rank: 20 },
        { playerId: 'A29AB3179716CE27', name: 'rbuchmeier', realName: 'mariomarine', wave: 485, rank: 21 },
        { playerId: '467318625945C3CC', name: 'mjz', realName: 'mjz', wave: 480, rank: 22 },
        { playerId: '29B33EDEF75A75BA', name: 'sou', realName: 'sou', wave: 473, rank: 23 },
        { playerId: '578FB52587EBF970', name: 'Radiance', realName: '.radiance', wave: 439, rank: 24 },
        { playerId: '1325494AB7AC6D06', name: 'AshyLary', realName: 'hinklem3', wave: 435, rank: 25 },
        { playerId: 'ADDCD5757402C493', name: 'deadeye', realName: 'deadeye', wave: 349, rank: 26 },
        { playerId: '378EBDBCE4BB3487', name: 'JokerQuy', realName: 'jokerquy', wave: 305, rank: 27 },
        { playerId: 'AC573BA51488DC76', name: 'ItIsMe', realName: 'ItIsMe', wave: 243, rank: 28 },
        { playerId: '5DBDB58AB4C0272', name: 'MoT3rror', realName: 'mot3rror', wave: 214, rank: 29 },
        { playerId: '5E16C5D467F04D13', name: 'drippp', realName: 'drippp', wave: 213, rank: 30 }
    ];

    const waves = players.map(p => p.wave);
    const medianWave = calculateMedian(waves);
    const totalWaves = waves.reduce((a, b) => a + b, 0);

    // Create bracket ID from top player (this bracket has a different start time)
    const bracketId = '188EAC641A3EBC7A_BRACKET'; // Use target player ID as identifier

    const bracket = {
        bracketId,
        league: 'legend',
        tournamentDate: '2025-10-04T01:00:00Z', // Different start time!
        players,
        medianWave,
        totalWaves
    };

    console.log(`TARGET PLAYER BRACKET:`);
    console.log(`Bracket ID: ${bracketId}`);
    console.log(`Player: TowerOfTobi (mrflipstar) - ${bracket.players[16].playerId}`);
    console.log(`Rank: 17 out of 30`);
    console.log(`Wave: 544`);
    console.log(`Median Wave: ${medianWave}`);
    console.log(`Total Waves: ${totalWaves}`);
    console.log('');

    // Store to database
    const records = bracket.players.map(player => ({
        tournament_date: bracket.tournamentDate,
        league: bracket.league,
        bracket_id: bracket.bracketId,
        player_id: player.playerId,
        player_name: player.name,
        real_name: player.realName,
        wave: player.wave,
        rank: player.rank,
        bracket_median_wave: bracket.medianWave,
        bracket_total_waves: bracket.totalWaves
    }));

    const { data, error } = await supabase.supabase
        .from('tournament_brackets')
        .upsert(records, { onConflict: 'tournament_date,league,player_id' });

    if (error) {
        console.error('Error storing bracket:', error.message);
        return false;
    } else {
        console.log(`Stored 30 players from target bracket`);
        console.log('');
        return true;
    }
}

saveTargetBracket()
    .then(success => {
        if (success) {
            console.log('SUCCESS! Target player bracket saved to database.');
        }
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('Error:', error.message);
        process.exit(1);
    });
