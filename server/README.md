# Tower Stats Backend Server

Simple Node.js backend server that fetches YouTube RSS feeds and serves the Tower Stats Dashboard.

## 🚀 Quick Start

### Option 1: Use the Batch File (Windows)
```bash
# Double-click start-server.bat
# OR run from command line:
start-server.bat
```

### Option 2: Manual Setup
```bash
# 1. Install dependencies
npm install

# 2. Start server
npm start

# 3. Open your browser
# Go to: http://localhost:3001
```

## 📡 API Endpoints

- `GET /` - Serves the frontend dashboard
- `GET /api/videos` - Get all YouTube videos
- `POST /api/videos/refresh` - Force refresh all feeds
- `GET /api/status` - Server status and stats
- `GET /api/health` - Health check

## ⚙️ Configuration

### YouTube Channel IDs
You need to replace the placeholder channel IDs in `server.js` with real ones:

```javascript
// Find this section in server.js and update:
const YOUTUBE_CHANNELS = [
    {
        name: 'GreenyTower',
        channelId: 'UC_REAL_CHANNEL_ID_HERE', // ← Update this
        color: '#4CAF50'
    },
    // ... more channels
];
```

### How to Find YouTube Channel IDs

1. **From Channel URL:**
   - Go to the channel page
   - Look for URL like: `youtube.com/channel/UC...`
   - The part after `/channel/` is the Channel ID

2. **From Handle (@username):**
   - Visit: `https://www.youtube.com/@USERNAME/about`
   - View page source and search for `"channelId"`

3. **Online Tool:**
   - Use: https://commentpicker.com/youtube-channel-id.php

## 🔧 Features

- **Real-time RSS Fetching**: Gets latest videos from all channels
- **Automatic Updates**: Refreshes feeds every 30 minutes
- **Caching**: Stores videos in memory for fast access
- **Error Handling**: Falls back gracefully if feeds are unavailable
- **CORS Enabled**: Works with frontend on different ports

## 📊 Response Format

```json
{
  "success": true,
  "videos": [
    {
      "id": "video_id",
      "title": "Video Title",
      "channel": "Channel Name",
      "channelColor": "#FF0000",
      "publishDate": "2024-01-01T12:00:00.000Z",
      "thumbnail": "https://img.youtube.com/vi/video_id/maxresdefault.jpg",
      "description": "Video description...",
      "url": "https://www.youtube.com/watch?v=video_id"
    }
  ],
  "lastUpdate": "2024-01-01T12:00:00.000Z",
  "totalVideos": 50,
  "totalChannels": 13
}
```

## 🐛 Troubleshooting

### Server Won't Start
- Make sure Node.js is installed: `node --version`
- Check if port 3001 is available
- Run `npm install` to install dependencies

### No Videos Loading
- Check if channel IDs are correct in `server.js`
- Some channels might have RSS disabled
- Check server console for error messages

### Frontend Not Connecting
- Make sure both servers are running:
  - Backend: `http://localhost:3001`
  - Frontend: `http://localhost:6077` (if using Python server)
- Update API URLs in `youtube-rss.js` if using different ports

## 📝 Logs

The server logs all activities:
- `🔄` - Fetching videos
- `✅` - Successful operations
- `❌` - Errors
- `🕐` - Scheduled updates

## 🛑 Stopping the Server

Press `Ctrl+C` in the terminal to stop the server gracefully.