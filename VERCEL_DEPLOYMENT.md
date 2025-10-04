# Vercel Deployment Guide - Tower Statistics Dashboard

## 📋 Prerequisites

- [x] Vercel account (free tier works)
- [x] GitHub repository (optional but recommended)
- [x] Supabase project setup
- [x] Discord Bot created (for bot features)

## ⚠️ Important Notes

### Discord Bot Limitations
**The Discord Bot CANNOT run on Vercel** because Vercel serverless functions don't support long-running processes. You have two options:

1. **Deploy bot separately** on a service like:
   - Railway.app (recommended - has free tier)
   - Render.com (free tier available)
   - Heroku (paid)
   - Your own VPS/server

2. **Disable bot features** for Vercel deployment (dashboard will work without bot)

### Package Limitations
- **Puppeteer is NOT supported** on Vercel serverless functions
- If you need YouTube transcript features, you'll need to:
  - Use a different library (e.g., `youtube-transcript` npm package)
  - Or deploy to a platform that supports Puppeteer (Railway, Render, etc.)

## 🚀 Step-by-Step Deployment

### 1. Prepare Your Repository

Make sure your code is in a Git repository:

```bash
git init
git add .
git commit -m "Ready for Vercel deployment"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Connect to Vercel

#### Option A: Via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect the configuration

#### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel
```

### 3. Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

#### Required Variables:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_role_key_here
NODE_ENV=production
PORT=3000
```

#### Discord OAuth (for authentication):
```env
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
DISCORD_REDIRECT_URI=https://your-app.vercel.app/api/auth/discord/callback
```

#### Optional (if using Discord Bot elsewhere):
```env
DISCORD_BOT_TOKEN=your_bot_token
```

### 4. Update Discord OAuth Settings

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. Go to OAuth2 → Redirects
4. Add your Vercel URL:
   ```
   https://your-app-name.vercel.app/api/auth/discord/callback
   ```

### 5. Deploy

```bash
# Deploy to production
vercel --prod

# Or let Vercel auto-deploy from GitHub
# Every push to main branch will trigger deployment
```

## 🔧 Post-Deployment Configuration

### Update CORS Settings

If you have CORS issues, update `server/server.js`:

```javascript
const cors = require('cors');
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://your-app.vercel.app']
    : ['http://localhost:6078'],
  credentials: true
}));
```

### Test Your Deployment

1. Visit `https://your-app.vercel.app`
2. Test Discord login
3. Check dashboard functionality
4. Verify API endpoints work

## 📦 Discord Bot Deployment (Separate Service)

Since Vercel doesn't support the Discord bot, deploy it separately:

### Option 1: Railway.app (Recommended)

1. Create account at [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Add a `Procfile`:
   ```
   bot: cd server && node bot-launcher.js
   ```
5. Set environment variables in Railway dashboard
6. Deploy!

### Option 2: Render.com

1. Create account at [render.com](https://render.com)
2. New → Background Worker
3. Connect GitHub repository
4. Build Command: `npm install`
5. Start Command: `cd server && node bot-launcher.js`
6. Add environment variables
7. Deploy!

## 🛠️ Troubleshooting

### Issue: "Module not found" errors
**Solution:** Make sure all dependencies are in `package.json`, not `devDependencies`

### Issue: Puppeteer fails
**Solution:** Remove Puppeteer or deploy to Railway/Render instead

### Issue: Discord auth not working
**Solution:**
- Check redirect URI matches exactly
- Verify all Discord environment variables are set
- Check CORS settings

### Issue: Database connection fails
**Solution:**
- Verify Supabase URL and keys are correct
- Check Supabase project is not paused
- Enable Row Level Security policies in Supabase

### Issue: Assets not loading
**Solution:**
- Check file paths are relative: `/assets/...` not `assets/...`
- Verify `public` folder structure
- Clear Vercel cache and redeploy

## 📊 Environment Variables Checklist

Copy this checklist to Vercel Environment Variables:

- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `3000`
- [ ] `SUPABASE_URL` = `https://xxx.supabase.co`
- [ ] `SUPABASE_ANON_KEY` = `eyJhbG...`
- [ ] `SUPABASE_SERVICE_KEY` = `eyJhbG...`
- [ ] `DISCORD_CLIENT_ID` = `your_client_id`
- [ ] `DISCORD_CLIENT_SECRET` = `your_client_secret`
- [ ] `DISCORD_REDIRECT_URI` = `https://your-app.vercel.app/api/auth/discord/callback`
- [ ] `DISCORD_BOT_TOKEN` = `your_bot_token` (optional)

## 🔗 Useful Links

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Discord Developer Portal](https://discord.com/developers/applications)
- [Railway Documentation](https://docs.railway.app)

## 📝 Quick Deploy Commands

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Check deployment logs
vercel logs

# List deployments
vercel ls
```

## ✅ Deployment Complete!

Once deployed, your app will be available at:
- **Dashboard:** `https://your-app-name.vercel.app`
- **API:** `https://your-app-name.vercel.app/api/*`

For the Discord bot, it will be at:
- **Railway:** `https://your-app.railway.app` (or Railway-provided URL)
- **Render:** `https://your-app.onrender.com`

---

Need help? Check the troubleshooting section above or create an issue on GitHub.
