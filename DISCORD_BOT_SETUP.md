# Tower Discord Bot Setup Guide

This guide will help you set up the Tower Discord Bot that allows users to submit run data directly from Discord and link their accounts to the Tower Dashboard.

## 🏗️ Architecture Overview

- **Discord Bot**: Multi-server bot with slash commands for data submission
- **Supabase Database**: User management, run storage, and leaderboards
- **Dashboard Integration**: Seamless sync between Discord and web dashboard
- **Multi-Server Support**: Can be invited to any Tower community server

## 📋 Prerequisites

1. **Node.js** (v16 or higher)
2. **Discord Developer Account**
3. **Supabase Account** (free tier available)
4. **Basic knowledge of Discord bots and databases**

## 🔧 Setup Steps

### 1. Discord Bot Creation

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and name it "Tower Bot"
3. Go to "Bot" section and click "Add Bot"
4. Copy the **Bot Token** (keep it secret!)
5. Note down the **Application ID** (Client ID)
6. Under "Privileged Gateway Intents", enable:
   - MESSAGE CONTENT INTENT (if reading message content)

### 2. Supabase Setup

1. Go to [Supabase](https://supabase.com) and create a new project
2. Wait for the project to be ready
3. Go to Settings → API and copy:
   - **Project URL**
   - **Anon Key**
   - **Service Role Key** (for server-side operations)
4. Go to SQL Editor and run the contents of `supabase-schema.sql`

### 3. Environment Configuration

1. Copy `.env.example` to `.env` in the `server` directory:
   ```bash
   cp .env.example .env
   ```

2. Fill in your environment variables:
   ```env
   # Discord Configuration
   DISCORD_BOT_TOKEN=your_discord_bot_token_here
   DISCORD_CLIENT_ID=your_discord_client_id_here

   # Supabase Configuration
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_supabase_anon_key_here
   SUPABASE_SERVICE_KEY=your_supabase_service_role_key_here

   # Server Configuration
   PORT=6078
   DASHBOARD_URL=http://localhost:6078
   ```

### 4. Install Dependencies

```bash
cd server
npm install discord.js @supabase/supabase-js dotenv
```

### 5. Start the Services

1. **Start the main server** (with Discord API endpoints):
   ```bash
   node server.js
   ```

2. **Start the Discord bot** (in a separate terminal):
   ```bash
   node bot-launcher.js
   ```

## 🤖 Bot Commands

Once the bot is running, it supports these slash commands:

### `/submit`
Submit your Tower run data directly from Discord
```
/submit tier:15 wave:342 damage:1.24e89 coins:456M research:250 duration:45
```

### `/link`
Generate a code to link your Discord account to the dashboard
```
/link
```

### `/stats`
View your recent runs and statistics
```
/stats
```

### `/leaderboard`
View server or global leaderboards
```
/leaderboard
/leaderboard global:true
```

### `/help`
Show help information
```
/help
```

## 🔗 Bot Invitation

### For Server Owners:
Invite the bot to your server using this URL (replace `YOUR_BOT_CLIENT_ID`):
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_BOT_CLIENT_ID&permissions=2048&scope=bot%20applications.commands
```

### Required Permissions:
- **Send Messages** (2048) - To respond to commands
- **Use Slash Commands** - Automatically included with applications.commands scope

## 🔄 User Workflow

### For Discord Users:

1. **Link Account** (one-time setup):
   ```
   /link → Get code → Enter code on dashboard → Accounts linked!
   ```

2. **Submit Runs**:
   ```
   /submit tier:15 wave:342 damage:1.24e89 coins:456M
   ```

3. **View Progress**:
   ```
   /stats → See your recent runs
   /leaderboard → Compare with others
   ```

### For Dashboard Users:

1. **Link Discord** (optional):
   - Click "Link Discord Account" on dashboard
   - Enter code from Discord `/link` command
   - Your Discord submissions now appear in dashboard

2. **Sync Data**:
   - Discord runs automatically sync to dashboard
   - Dashboard runs remain local (for privacy)
   - Best of both worlds!

## 🏆 Features

### Multi-Server Support
- Bot can be invited to any Tower community server
- Each server gets its own leaderboard
- Global leaderboard across all servers
- Server-specific settings and competitions

### Data Integration
- Discord runs sync to dashboard automatically
- Dashboard runs remain private
- Unified progress tracking
- Cross-platform data sharing

### Security & Privacy
- Link codes expire in 15 minutes
- User data is properly isolated
- No sensitive data stored in Discord
- Supabase handles secure authentication

## 🛠️ Development & Customization

### Database Schema
The bot uses these main tables:
- `users` - Discord user profiles and linking
- `servers` - Discord server configurations
- `tower_runs` - All run submissions
- `link_codes` - Temporary linking codes
- `competitions` - Server competitions (future feature)

### API Endpoints
The server exposes these endpoints:
- `POST /api/discord/link` - Link Discord accounts
- `GET /api/discord/runs/:discordId` - Get user runs
- `GET /api/discord/leaderboard/:serverId` - Server leaderboard
- `GET /api/discord/leaderboard` - Global leaderboard
- `POST /api/discord/sync/:discordId` - Sync to dashboard

### Extending the Bot
You can easily add new commands by:
1. Adding to `setupCommands()` in `discord-bot.js`
2. Adding handler in `handleSlashCommand()`
3. Implementing the command logic

## 🚀 Deployment

### Production Deployment

1. **Hosting Options**:
   - Railway (recommended)
   - Heroku
   - DigitalOcean
   - AWS/GCP/Azure

2. **Environment Setup**:
   - Set all environment variables
   - Ensure Supabase is configured for production
   - Update DASHBOARD_URL to your domain

3. **Process Management**:
   - Use PM2 or similar for process management
   - Run both server.js and bot-launcher.js
   - Set up monitoring and logging

## 🐛 Troubleshooting

### Common Issues

1. **Bot not responding**:
   - Check bot token is correct
   - Ensure bot has proper permissions
   - Verify slash commands are registered

2. **Database errors**:
   - Check Supabase configuration
   - Verify schema was applied correctly
   - Check API keys and permissions

3. **Linking issues**:
   - Ensure both server and bot are running
   - Check API endpoints are accessible
   - Verify link codes haven't expired

### Debug Mode
Set `NODE_ENV=development` for verbose logging:
```env
NODE_ENV=development
```

## 📊 Monitoring

### Key Metrics to Monitor
- Bot uptime and response times
- Database query performance
- User linking success rates
- Command usage statistics
- Error rates and types

### Logging
The bot logs important events:
- User registrations and linking
- Run submissions
- Errors and warnings
- Server joins/leaves

## 🎯 Future Enhancements

### Planned Features
- **Competitions**: Server-wide competitions with automated tracking
- **Achievements**: Discord role assignments based on progress
- **Notifications**: DM users about milestones and updates
- **Analytics**: Detailed progress tracking and insights
- **Import/Export**: Bulk data operations
- **Webhooks**: Real-time updates to external services

### Community Features
- **Guild Integration**: Link with Tower guild systems
- **Tournaments**: Cross-server tournament management
- **Rewards**: Integration with creator codes and rewards
- **Social**: Progress sharing and community challenges

---

## 🆘 Support

If you need help setting up the bot:

1. Check this guide thoroughly
2. Review the troubleshooting section
3. Check Discord and Supabase documentation
4. Create an issue in the project repository

Happy Tower climbing! 🏰⚡