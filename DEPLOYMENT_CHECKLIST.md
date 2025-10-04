# 🚀 Complete Deployment Checklist

## 📦 What You're Deploying

1. **Discord Bot** → Railway (24/7)
2. **Dashboard Website** → Vercel (Public access)

---

## ✅ Pre-Deployment Checklist

### Code Ready
- [x] Discord bot fixed and tested locally
- [x] Dark theme applied from Figma
- [x] All features working
- [x] Environment variables documented

### Files Created
- [x] `Procfile` - Railway process file
- [x] `railway.json` - Railway configuration
- [x] `vercel.json` - Vercel configuration
- [x] `.gitignore` - Excludes sensitive files
- [x] Deployment guides created

### Accounts Needed
- [ ] GitHub account (to push code)
- [ ] Railway account (for bot)
- [ ] Vercel account (for dashboard)
- [ ] Supabase account (already have)
- [ ] Discord Developer Portal (already have)

---

## 🚂 Part 1: Deploy Discord Bot to Railway

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Ready for deployment"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Step 2: Create Railway Project
1. Go to [railway.app](https://railway.app)
2. Login with GitHub
3. New Project → Deploy from GitHub repo
4. Select your repository

### Step 3: Add Environment Variables
In Railway dashboard → Variables:
```
DISCORD_BOT_TOKEN=<from server/.env>
DISCORD_CLIENT_ID=<from server/.env>
SUPABASE_URL=<from server/.env>
SUPABASE_ANON_KEY=<from server/.env>
SUPABASE_SERVICE_KEY=<from server/.env>
NODE_ENV=production
```

### Step 4: Verify Deployment
- [ ] Check Railway logs show "Bot is ready!"
- [ ] Bot shows online in Discord
- [ ] Test `/submit` command works
- [ ] Verify data saves to Supabase

---

## 🌐 Part 2: Deploy Dashboard to Vercel

### Step 1: Create Vercel Project
1. Go to [vercel.com](https://vercel.com)
2. New Project → Import Git Repository
3. Select your GitHub repo
4. Vercel auto-detects configuration

### Step 2: Add Environment Variables
In Vercel dashboard → Settings → Environment Variables:
```
NODE_ENV=production
PORT=3000
SUPABASE_URL=<from server/.env>
SUPABASE_ANON_KEY=<from server/.env>
SUPABASE_SERVICE_KEY=<from server/.env>
DISCORD_CLIENT_ID=<from server/.env>
DISCORD_CLIENT_SECRET=<from server/.env>
DISCORD_REDIRECT_URI=https://your-app.vercel.app/api/auth/discord/callback
```

### Step 3: Update Discord OAuth
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. OAuth2 → Redirects
4. Add: `https://your-app.vercel.app/api/auth/discord/callback`

### Step 4: Verify Deployment
- [ ] Visit your Vercel URL
- [ ] Test Discord login
- [ ] Check dashboard loads
- [ ] Verify stats display correctly

---

## 🔗 Connect Everything

### Update Bot with Dashboard URL
In Railway → Variables, add:
```
DASHBOARD_URL=https://your-app.vercel.app
```

### Test Full Flow
1. [ ] Submit run via Discord `/submit`
2. [ ] Login to dashboard
3. [ ] See run data displayed
4. [ ] Test all dashboard features

---

## 📊 Monitoring

### Railway (Bot)
- URL: `https://railway.app/project/<your-project>`
- Check: Logs, CPU, Memory
- Cost: Check credit usage

### Vercel (Dashboard)
- URL: `https://vercel.com/<your-username>/<project>`
- Check: Deployments, Analytics
- Cost: Free tier (no cost)

---

## 🎯 Quick Reference

### Environment Variables You Need

From `server/.env`:
```bash
DISCORD_BOT_TOKEN=MTQy...
DISCORD_CLIENT_ID=1420...
DISCORD_CLIENT_SECRET=Ds5a...
SUPABASE_URL=https://kktvmpwxfyevkgotppah.supabase.co
SUPABASE_ANON_KEY=eyJh...
SUPABASE_SERVICE_KEY=eyJh...
```

### Useful Commands
```bash
# Railway CLI
railway login
railway logs
railway restart

# Vercel CLI
vercel login
vercel
vercel --prod
vercel logs

# Git
git status
git add .
git commit -m "message"
git push
```

---

## 🆘 Troubleshooting

### Bot not responding
- Check Railway logs
- Verify environment variables
- Restart Railway service

### Dashboard not loading
- Check Vercel deployment logs
- Verify all static files deployed
- Clear browser cache

### Database errors
- Check Supabase project status
- Verify service key is correct
- Check Row Level Security policies

---

## ✨ You're Ready!

Follow these steps in order:
1. ✅ Push code to GitHub
2. ✅ Deploy bot to Railway
3. ✅ Deploy dashboard to Vercel
4. ✅ Connect everything
5. ✅ Test and monitor

**Estimated Time:** 15-20 minutes total

---

Good luck! 🚀
