// Combined Launcher - Runs both web server and Discord bot
require('dotenv').config({ path: __dirname + '/.env' });
const { spawn } = require('child_process');

console.log('🚀 Starting Tower Stats Combined Launcher...\n');

// Start web server
console.log('📡 Starting web server...');
const webServer = spawn('node', ['server.js'], {
    cwd: __dirname,
    stdio: 'inherit',
    env: process.env
});

// Start Discord bot
console.log('🤖 Starting Discord bot...');
const discordBot = spawn('node', ['bot-launcher.js'], {
    cwd: __dirname,
    stdio: 'inherit',
    env: process.env
});

// Handle process exits
webServer.on('exit', (code) => {
    console.error(`❌ Web server exited with code ${code}`);
    process.exit(code);
});

discordBot.on('exit', (code) => {
    console.error(`❌ Discord bot exited with code ${code}`);
    process.exit(code);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down all services...');
    webServer.kill();
    discordBot.kill();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down all services...');
    webServer.kill();
    discordBot.kill();
    process.exit(0);
});

console.log('\n✅ Both services started successfully!');
