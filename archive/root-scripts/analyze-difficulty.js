require('dotenv').config({ path: __dirname + '/server/.env' });
const SupabaseManager = require('./server/supabase-config');
const sb = new SupabaseManager();

const TARGET_PLAYER = '188EAC641A3EBC7A';
const TOURNAMENT_DATE = '2025-10-04';

async function analyze() {
    // Get all brackets
    const { data: allData } = await sb.supabase
        .from('tournament_brackets')
        .select('*')
        .gte('tournament_date', TOURNAMENT_DATE)
        .eq('league', 'legend');

    // Group by bracket
    const brackets = {};
    allData.forEach(row => {
        if (!brackets[row.bracket_id]) {
            brackets[row.bracket_id] = [];
        }
        brackets[row.bracket_id].push(row);
    });

    const bracketIds = Object.keys(brackets);
    console.log(`📊 Total brackets: ${bracketIds.length}`);
    console.log(`📊 Total players: ${allData.length}\n`);

    // Find your player
    const yourPlayer = allData.find(p => p.player_id === TARGET_PLAYER);
    if (!yourPlayer) {
        console.log('❌ Player not found');
        return;
    }

    console.log(`🎯 YOUR PLAYER: ${yourPlayer.real_name} (${yourPlayer.player_name})`);
    console.log(`   Actual Rank: #${yourPlayer.rank}/30`);
    console.log(`   Waves: ${yourPlayer.wave}`);
    console.log(`   Bracket: ${yourPlayer.bracket_id}\n`);

    // Calculate hypothetical rank in each bracket
    let better = 0, worse = 0, same = 0;
    const ranks = [];

    bracketIds.forEach(bracketId => {
        const players = brackets[bracketId];
        const playersWithMoreWaves = players.filter(p => p.wave > yourPlayer.wave).length;
        const hypotheticalRank = playersWithMoreWaves + 1;
        ranks.push(hypotheticalRank);

        if (hypotheticalRank < yourPlayer.rank) better++;
        else if (hypotheticalRank > yourPlayer.rank) worse++;
        else same++;
    });

    const avgRank = ranks.reduce((a, b) => a + b, 0) / ranks.length;
    const bestRank = Math.min(...ranks);
    const worstRank = Math.max(...ranks);
    const difficulty = (worse / bracketIds.length) * 100;

    console.log(`📈 IF YOU WERE IN EVERY BRACKET (with ${yourPlayer.wave} waves):`);
    console.log(`   Average Rank: #${avgRank.toFixed(1)}/30`);
    console.log(`   Best Possible: #${bestRank}/30`);
    console.log(`   Worst Possible: #${worstRank}/30\n`);

    console.log(`🎲 BRACKET LUCK:`);
    console.log(`   Brackets where you'd do BETTER: ${better} (${(better/bracketIds.length*100).toFixed(1)}%)`);
    console.log(`   Brackets where you'd do WORSE: ${worse} (${(worse/bracketIds.length*100).toFixed(1)}%)`);
    console.log(`   Same rank: ${same}\n`);

    console.log(`🎯 Difficulty Score: ${difficulty.toFixed(1)}/100`);

    if (difficulty < 40) {
        console.log(`\n💪 UNLUCKY! You got a HARD bracket.`);
        console.log(`   You would rank BETTER in ${worse}/${bracketIds.length} brackets.`);
        console.log(`   Your bracket was harder than ${worse}/${bracketIds.length} brackets.`);
    } else if (difficulty > 60) {
        console.log(`\n🍀 LUCKY! You got an EASY bracket.`);
        console.log(`   You would rank WORSE in ${worse}/${bracketIds.length} brackets.`);
        console.log(`   Your bracket was easier than ${worse}/${bracketIds.length} brackets.`);
    } else {
        console.log(`\n😐 AVERAGE - Your bracket difficulty was typical.`);
    }

    // Show breakdown
    console.log(`\n📋 BREAKDOWN BY BRACKET:`);
    bracketIds.forEach((bid, i) => {
        const players = brackets[bid];
        const above = players.filter(p => p.wave > yourPlayer.wave).length;
        const hypRank = above + 1;
        const diff = hypRank - yourPlayer.rank;
        const symbol = diff < 0 ? '📈' : diff > 0 ? '📉' : '➡️';
        console.log(`   ${bid}: Would be #${hypRank}/30 ${symbol} (${diff >= 0 ? '+' : ''}${diff})`);
    });

    process.exit(0);
}

analyze();
