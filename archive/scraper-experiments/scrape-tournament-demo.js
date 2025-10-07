/**
 * Demo script to scrape tournament data from thetower.lol
 * Run this to populate the database with real tournament data
 *
 * Usage: node scripts/scrape-tournament-demo.js [league]
 * Example: node scripts/scrape-tournament-demo.js Legend
 */

const SupabaseManager = require('../supabase-config');
const TowerLolScraper = require('../services/tower-lol-scraper');

async function demoScrape() {
    console.log('🚀 Tournament Data Scraper - Demo Mode\n');

    // Get league from command line or default to Legend
    const league = process.argv[2] || 'Legend';
    console.log(`📊 Target League: ${league}\n`);

    // Initialize Supabase
    const supabase = new SupabaseManager();
    const scraper = new TowerLolScraper(supabase);

    console.log('=' .repeat(60));
    console.log('STEP 1: Check if we have existing tournament data');
    console.log('=' .repeat(60));

    const existingData = await scraper.getLatestTournamentData(league);

    if (existingData.length > 0) {
        console.log(`✅ Found existing data: ${existingData.length} brackets`);
        console.log(`   Sample bracket ID: ${existingData[0].bracketId}`);
        console.log(`   Players per bracket: ${existingData[0].players.length}`);
    } else {
        console.log('⚠️ No existing tournament data found');
        console.log('   You need to scrape data first using Playwright automation');
    }

    console.log('\n' + '='.repeat(60));
    console.log('STEP 2: Demo - Analyze your player');
    console.log('='.repeat(60));

    // Use your player ID
    const yourPlayerId = '188EAC641A3EBC7A';
    console.log(`🎯 Analyzing player: ${yourPlayerId}\n`);

    if (existingData.length === 0) {
        console.log('❌ Cannot analyze - no tournament data available');
        console.log('\n📝 TO SCRAPE TOURNAMENT DATA:');
        console.log('   1. The scraper needs Playwright browser automation');
        console.log('   2. Navigate to https://thetower.lol/liveresults');
        console.log('   3. Select your league');
        console.log('   4. Parse the player table data');
        console.log('   5. Visit each bracket to get detailed stats');
        console.log('   6. Store in database\n');
        return;
    }

    // Find your player in the data
    let yourPlayer = null;
    let yourBracket = null;

    for (const bracket of existingData) {
        const player = bracket.players.find(p => p.playerId === yourPlayerId);
        if (player) {
            yourPlayer = player;
            yourBracket = bracket;
            break;
        }
    }

    if (!yourPlayer) {
        console.log(`⚠️ Player ${yourPlayerId} not found in ${league} league`);
        console.log(`   Try a different league or check your player ID`);
        return;
    }

    console.log(`✅ Found you in bracket: ${yourBracket.bracketId}`);
    console.log(`   Your wave: ${yourPlayer.wave}`);
    console.log(`   Your rank: ${yourPlayer.rank}\n`);

    // Calculate difficulty
    const analysis = scraper.calculateBracketDifficulty(
        yourPlayerId,
        yourPlayer.wave,
        existingData
    );

    console.log('=' .repeat(60));
    console.log('BRACKET DIFFICULTY ANALYSIS');
    console.log('=' .repeat(60));
    console.log(`Difficulty Score: ${analysis.difficultyScore}/100 (${analysis.difficultyLabel})`);
    console.log(`Total Brackets Analyzed: ${analysis.totalBracketsAnalyzed}`);
    console.log(`\nYour Performance:`);
    console.log(`  Actual Rank: #${analysis.actualRank}`);
    console.log(`  Best Possible: #${analysis.bestPossibleRank}`);
    console.log(`  Worst Possible: #${analysis.worstPossibleRank}`);
    console.log(`  Average: #${analysis.averageRank}`);

    console.log(`\nRank Distribution:`);
    const rankDist = Object.entries(analysis.rankDistribution)
        .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
        .slice(0, 10); // Top 10

    rankDist.forEach(([rank, count]) => {
        const percentage = ((count / analysis.totalBracketsAnalyzed) * 100).toFixed(1);
        const bar = '█'.repeat(Math.floor(percentage / 2));
        const marker = parseInt(rank) === analysis.actualRank ? ' ← YOUR BRACKET' : '';
        console.log(`  Rank #${rank.padStart(2)}: ${bar} ${count} brackets (${percentage}%)${marker}`);
    });

    console.log(`\n🏆 Top 5 Easiest Brackets (You Would've Done Better):`);
    analysis.easiestBrackets.slice(0, 5).forEach((b, i) => {
        console.log(`  ${i + 1}. Bracket ${b.bracketId.substring(0, 8)}... - You'd rank #${b.hypotheticalRank} (Winner: ${b.winnerWave}w)`);
    });

    console.log(`\n😰 Top 5 Hardest Brackets (Tougher Competition):`);
    analysis.hardestBrackets.slice(0, 5).forEach((b, i) => {
        console.log(`  ${i + 1}. Bracket ${b.bracketId.substring(0, 8)}... - You'd rank #${b.hypotheticalRank} (Winner: ${b.winnerWave}w)`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('INTERPRETATION');
    console.log('='.repeat(60));

    const score = parseFloat(analysis.difficultyScore);
    if (score >= 80) {
        console.log('🍀 You got VERY LUCKY! Your bracket was one of the easiest.');
    } else if (score >= 60) {
        console.log('😊 You got a favorable bracket with below-average difficulty.');
    } else if (score >= 40) {
        console.log('⚖️ You got an average bracket - typical competition level.');
    } else if (score >= 20) {
        console.log('😤 You faced tough competition! Harder than most brackets.');
    } else {
        console.log('💪 You got UNLUCKY! One of the hardest brackets - elite competition!');
    }

    console.log(`\nYou performed better than ${analysis.percentileBetterThanWinners}% of all bracket winners.`);

    console.log('\n' + '='.repeat(60));
    console.log('API ENDPOINT');
    console.log('='.repeat(60));
    console.log(`GET http://localhost:6078/api/tournament-brackets/difficulty/${yourPlayerId}?league=${league}`);
    console.log(`\nWEB INTERFACE:`);
    console.log(`http://localhost:6078/bracket-difficulty.html`);
}

// Run demo
demoScrape()
    .then(() => {
        console.log('\n✅ Demo completed!');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Demo failed:', error.message);
        process.exit(1);
    });
