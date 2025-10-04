# Railway Deployment Guide - Discord Bot

## 🚂 Deploy Discord Bot to Railway (FREE)

Railway provides **$5/month free credit** which is perfect for running a Discord bot 24/7!

---

## 📋 Prerequisites

- [x] Railway account - Sign up at [railway.app](https://railway.app)
- [x] GitHub account
- [x] Your code pushed to GitHub
- [x] Environment variables ready (from `.env` file)

---

## 🚀 Deployment Steps

### Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Click "Login" → "Login with GitHub"
3. Authorize Railway to access your repos

### Step 2: Create New Project

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your `social-tower` repository
4. Railway will detect it's a Node.js project

### Step 3: Configure Environment Variables

Click on your project → Variables tab, add these:

```env
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_key_here
NODE_ENV=production
```

**Important:** Get these values from your `server/.env` file!

### Step 4: Deploy!

Railway will automatically:
1. Install dependencies (`npm install`)
2. Start the bot (`cd server && node bot-launcher.js`)
3. Keep it running 24/7
4. Auto-restart if it crashes
5. Auto-deploy on every GitHub push

### Step 5: Check Logs

1. Click on your project
2. Click "View Logs"
3. You should see:
   ```
   🤖 Tower Bot is ready!
   ✅ Bot database initialized
   ✅ Slash commands registered
   ```

---

## 🎯 Alternative: Deploy via Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to project (first time)
railway link

# Deploy
railway up

# View logs
railway logs
```

---

## 📊 What Railway Provides

✅ **24/7 Uptime** - Bot never goes offline
✅ **Auto-restart** - Recovers from crashes
✅ **Auto-deploy** - Deploys on git push
✅ **Logs** - Real-time log viewing
✅ **Metrics** - CPU/Memory usage
✅ **FREE** - $5/month credit (renews monthly)

---

## 💰 Cost Breakdown

**Free Tier:**
- $5/month credit (auto-renews)
- ~550 hours/month runtime
- Perfect for 1 Discord bot

**Your Bot Usage:**
- ~$0.30/month (estimated)
- Plenty of free credit left!

---

## 🔧 Troubleshooting

### Issue: Bot not starting
**Solution:**
1. Check Railway logs
2. Verify all environment variables are set
3. Make sure `DISCORD_BOT_TOKEN` is correct

### Issue: Database connection fails
**Solution:**
1. Check `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`
2. Verify Supabase project isn't paused
3. Check Railway logs for specific error

### Issue: Commands not working
**Solution:**
1. Make sure bot has been invited to your Discord server
2. Check bot has necessary permissions
3. Wait 1-2 minutes for commands to register globally

---

## 🔗 Useful Links

- [Railway Documentation](https://docs.railway.app)
- [Railway Dashboard](https://railway.app/dashboard)
- [Discord Developer Portal](https://discord.com/developers/applications)

---

## ✅ Post-Deployment Checklist

- [ ] Bot shows as "Online" in Discord
- [ ] `/submit` command works
- [ ] Data saves to Supabase
- [ ] Railway logs show no errors
- [ ] Free credit is being used (check Railway dashboard)

---

## 📝 Quick Commands

```bash
# View logs
railway logs

# Restart bot
railway restart

# Check status
railway status

# Open dashboard
railway open
```

---

## 🎉 You're Done!

Your Discord bot is now running 24/7 on Railway!

**Bot Commands Available:**
- `/submit` - Submit tower run
- `/stats` - View your stats
- `/leaderboard` - Server leaderboard
- `/link` - Link to dashboard
- `/help` - Get help

**Next Steps:**
1. Deploy your dashboard to Vercel (see VERCEL_DEPLOYMENT.md)
2. Invite bot to your Discord server
3. Start submitting runs!

---

Need help? Check Railway logs or Discord bot logs for errors.
