// Discord Bot Launcher for Tower Bot
require('dotenv').config({ path: __dirname + '/.env' }); // Load from server/.env
const TowerDiscordBot = require('./discord-bot');

async function launchBot() {
    console.log('🚀 Starting Tower Discord Bot...');

    // Check required environment variables
    const requiredEnvVars = [
        'DISCORD_BOT_TOKEN',
        'SUPABASE_URL',
        'SUPABASE_SERVICE_KEY'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
        console.error('❌ Missing required environment variables:');
        missingVars.forEach(varName => {
            console.error(`   - ${varName}`);
        });
        console.error('\nPlease check your .env file and try again.');
        process.exit(1);
    }

    try {
        const bot = new TowerDiscordBot();
        await bot.start(process.env.DISCORD_BOT_TOKEN);

        console.log('✅ Tower Discord Bot is now running!');
        console.log('\n📋 Available Commands:');
        console.log('   /submit - Submit tower run data');
        console.log('   /link - Link Discord account to dashboard');
        console.log('   /stats - View your recent runs');
        console.log('   /leaderboard - View server leaderboard');
        console.log('   /help - Show help information');

        console.log('\n🔗 Invite Bot to Server:');
        console.log(`   https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&permissions=2048&scope=bot%20applications.commands`);

    } catch (error) {
        console.error('❌ Failed to start Discord bot:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Discord bot...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down Discord bot...');
    process.exit(0);
});

// Launch the bot
launchBot();