// Simple launcher to debug Discord bot issues
require('dotenv').config();
console.log('🚀 Starting Tower Discord Bot...');

try {
    const TowerDiscordBot = require('./discord-bot.js');
    const bot = new TowerDiscordBot();

    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) {
        console.error('❌ DISCORD_BOT_TOKEN not found in environment variables');
        process.exit(1);
    }

    bot.start(token);
} catch (error) {
    console.error('❌ Failed to start Discord bot:', error);
    process.exit(1);
}