# Tower Statistics Dashboard

A comprehensive dashboard for The Tower game with Discord authentication, user statistics, content hub, and search functionality.

## Features

- 🔐 **Discord Authentication** with Supabase
- 📊 **Personal Dashboard** with run statistics and charts
- 🎮 **Content Hub** with YouTube videos and community content
- 🔍 **Search Functionality** for wiki and Notion content
- 📱 **Responsive Design** with modern UI
- 🌟 **Landing Page** for non-authenticated users

## 🚀 Deploy to Vercel

### Prerequisites

1. **GitHub Account** - Create a repository for your code
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
3. **Supabase Project** - Set up authentication and database
4. **Discord App** - Configure OAuth for authentication

### Step 1: Push to GitHub

```bash
# Initialize git repository
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/tower-dashboard.git
git push -u origin main
```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Configure the following settings:
   - **Framework Preset**: Other
   - **Root Directory**: Leave empty (/)
   - **Build Command**: npm run build
   - **Output Directory**: public
   - **Install Command**: npm install

### Step 3: Environment Variables

In Vercel dashboard, go to Settings → Environment Variables and add:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DISCORD_TOKEN=your-discord-bot-token
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
NODE_ENV=production
```

### Step 4: Update Discord OAuth URLs

In your Discord app settings, add:
- **Redirect URI**: `https://your-app.vercel.app/auth/callback`
- **JavaScript Origins**: `https://your-app.vercel.app`

### Step 5: Update Supabase Settings

In Supabase dashboard:
1. Go to Authentication → URL Configuration
2. Add your Vercel URL to **Site URL**: `https://your-app.vercel.app`
3. Add to **Redirect URLs**: `https://your-app.vercel.app/**`

### Step 6: Deploy!

Click "Deploy" in Vercel. Your app will be available at `https://your-app.vercel.app`

## Local Development

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your values
3. Install dependencies: `npm install`
4. Start the server: `npm start`
5. Visit `http://localhost:6079`

## Project Structure

```
├── public/                 # Static files (served by Vercel)
│   ├── index.html         # Main HTML file
│   ├── *.css              # Stylesheets
│   ├── *.js               # Frontend JavaScript
│   ├── assets/            # Images and assets
│   ├── css/               # Additional CSS files
│   └── js/                # Additional JS files
├── server/                # Backend API (Vercel Functions)
│   ├── server.js          # Main server file
│   └── ...                # Other server files
├── vercel.json            # Vercel configuration
├── package.json           # Dependencies
└── README.md              # This file
```

## API Endpoints

- `GET /` - Main dashboard
- `GET /api/videos` - YouTube content
- `GET /api/wiki/search` - Wiki search
- `GET /api/notion/search` - Notion search

## Technologies

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Node.js, Express
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Discord OAuth via Supabase
- **Deployment**: Vercel
- **Search**: Fuse.js for fuzzy search

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details