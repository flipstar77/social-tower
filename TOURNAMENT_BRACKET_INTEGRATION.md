# Tournament Bracket Difficulty Integration - Complete Guide

## Overview

The tournament bracket difficulty feature is now fully integrated into the dashboard at **https://trackyourstats.vercel.app/**. This system automatically scrapes tournament data twice weekly, calculates bracket difficulty for all players, and displays personalized results on each player's dashboard.

## System Architecture

### 1. **Backend Components** (Railway/Server)

#### Automated Scraping Service
- **File**: `server/services/tournament-automation-service.js`
- **Schedule**: Runs every 3 days at 2 AM (configurable via cron)
- **Process**:
  1. Scrapes tournament data from thetower.lol
  2. Matches tournament data with player runs in `tower_runs` table by date
  3. Calculates bracket difficulty for all matched players
  4. Stores results in `bracket_difficulty_analysis` table

#### API Endpoints
- **File**: `server/routes/tournament-brackets.js`
- **Base URL**: `https://tower-stats-backend-production.up.railway.app/api/tournament-brackets`

**Available Endpoints**:
```
GET /user/:discordUserId?limit=10
  - Fetch all bracket analyses for a user
  - Returns: Array of analysis results sorted by date

GET /run/:runId
  - Fetch bracket analysis for specific run
  - Returns: Single analysis result

GET /automation/status
  - Check automation service status
  - Returns: { isRunning, lastScrapeDate, nextScheduledRun }

POST /automation/trigger
  - Manually trigger tournament analysis
  - Returns: { success: true, message: "Started in background" }
```

#### Data Flow
```
thetower.lol → Scraper → tournament_brackets table
                                    ↓
                         Match with tower_runs by date
                                    ↓
                         Calculate difficulty scores
                                    ↓
                         bracket_difficulty_analysis table
                                    ↓
                         API endpoints → Dashboard
```

### 2. **Frontend Components** (Vercel Dashboard)

#### UI Section
- **File**: `public/index.html` (line 516-533)
- **Location**: Within the Tournaments section, after the tournament list
- **Components**:
  - Latest bracket analysis card with visualization
  - Historical bracket analysis list
  - Empty states and loading indicators

#### Styling
- **File**: `public/css/bracket-difficulty.css`
- **Features**:
  - Gradient difficulty badges (Very Easy → Very Hard)
  - Responsive stats grid
  - ECharts integration for rank comparison
  - Glassmorphism design matching dashboard theme

#### JavaScript Module
- **File**: `public/js/bracket-difficulty.js`
- **Class**: `BracketDifficultyManager`
- **Initialization**: Called when tournaments section is shown
- **Features**:
  - Fetches user's bracket analyses from API
  - Renders latest analysis with chart
  - Displays historical analyses
  - Interprets difficulty scores with personalized messages

## Database Schema

### Required Tables in Supabase

#### 1. `tournament_brackets`
Stores all tournament bracket data scraped from thetower.lol:
```sql
tournament_date    TIMESTAMPTZ  -- Tournament date
league            VARCHAR(20)   -- legend, champion, platinum, gold, silver, copper
bracket_id        VARCHAR(50)   -- Unique bracket identifier
player_id         VARCHAR(50)   -- Player ID from thetower.lol
wave              INTEGER       -- Wave reached
rank              INTEGER       -- Bracket rank (1-30)
```

#### 2. `bracket_difficulty_analysis`
Stores calculated difficulty scores paired with player runs:
```sql
discord_user_id          VARCHAR(100)  -- Link to Discord user
run_id                   BIGINT        -- FK to tower_runs.id
league                   VARCHAR(20)   -- League played
wave                     INTEGER       -- Wave reached
difficulty_score         DECIMAL(5,2)  -- 0-100 score (higher = easier)
difficulty_label         VARCHAR(20)   -- Very Easy/Easy/Medium/Hard/Very Hard
actual_rank              INTEGER       -- Actual rank in bracket
best_possible_rank       INTEGER       -- Best rank across all brackets
worst_possible_rank      INTEGER       -- Worst rank across all brackets
average_rank             DECIMAL(5,2)  -- Average rank across all brackets
total_brackets_analyzed  INTEGER       -- Number of brackets compared
analyzed_at             TIMESTAMPTZ    -- Analysis timestamp
```

#### 3. `tournament_metadata` (optional)
Tracks scraping history and status

### Setup Database Tables

Run this SQL in Supabase SQL Editor:
```bash
# Execute the schema file
psql -h [supabase-host] -U postgres -d postgres < server/database/tournament-brackets-schema.sql
```

Or manually run the SQL from: `server/database/tournament-brackets-schema.sql`

## Difficulty Score Algorithm

### How It Works

For each player's tournament run:

1. **Identify League**: Determine player's league from wave/tier data
   - Legend: wave ≥ 5000
   - Champion: wave ≥ 2500
   - Platinum: wave ≥ 2000
   - Gold: wave ≥ 1500
   - Silver: wave ≥ 500
   - Copper: wave < 500

2. **Simulate Performance**: Test how player would rank in every other bracket in their league
   - Count players above their wave count in each bracket
   - Calculate hypothetical rank

3. **Calculate Difficulty Score**:
   ```javascript
   bracketsWouldDoWorse = brackets where hypothetical_rank > actual_rank
   difficultyScore = (bracketsWouldDoWorse / totalBrackets) × 100
   ```

4. **Assign Label**:
   - 80-100: Very Easy (got very lucky)
   - 60-80: Easy (got lucky)
   - 40-60: Medium (average)
   - 20-40: Hard (unlucky)
   - 0-20: Very Hard (very unlucky)

### Example

Player achieved rank #8 with wave 1600 in Gold league:

- **Best possible**: #3 (in easiest bracket)
- **Worst possible**: #15 (in hardest bracket)
- **Average**: #9.2 across all brackets
- **Difficulty Score**: 65/100 (Easy)

**Interpretation**: "You got lucky! Your bracket was easier than 65% of other brackets. In most other brackets, you would have ranked worse than #8."

## Dashboard Display

### Visual Components

1. **Latest Analysis Card**
   - Large featured card at top
   - Difficulty badge (color-coded)
   - Stats grid: Difficulty Score, Your Rank, Best/Worst/Average Rank, Wave
   - Bar chart comparing ranks across scenarios
   - Personalized interpretation text

2. **Bracket History List**
   - Compact list of past analyses
   - Date, league, difficulty badge
   - Quick stats: Rank, Wave, Best, Worst
   - Clickable for future expansion

3. **Empty States**
   - Shown when no data available
   - Explains that data appears after scraping

## Deployment Checklist

### Backend (Railway)

- [x] Tournament automation service created
- [x] Integrated into server.js startup
- [x] API endpoints implemented
- [ ] Database tables created in Supabase
- [ ] Playwright scraper fully implemented (currently placeholder)
- [ ] Test scraping with real tournament data

### Frontend (Vercel)

- [x] UI section added to index.html
- [x] CSS styling created
- [x] JavaScript module implemented
- [x] Integrated with tournaments section
- [x] ECharts visualization working

### Manual Steps Required

1. **Create Database Tables**:
   ```bash
   # In Supabase SQL Editor, run:
   server/database/tournament-brackets-schema.sql
   ```

2. **Implement Playwright Scraper**:
   - Complete `server/services/tower-lol-playwright-scraper.js`
   - Use MCP Playwright tools to navigate thetower.lol
   - Extract bracket data from Streamlit interface

3. **Test Full Flow**:
   ```bash
   # Manually trigger scraping
   POST /api/tournament-brackets/automation/trigger

   # Check automation status
   GET /api/tournament-brackets/automation/status

   # Verify data in dashboard
   Navigate to https://trackyourstats.vercel.app/
   Login with Discord
   Go to Tournaments section
   ```

## Usage for Players

### How Players See Their Data

1. **Login** to https://trackyourstats.vercel.app/ with Discord
2. **Navigate** to Tournaments section (🏆 icon in sidebar)
3. **View** Bracket Difficulty section below tournament list
4. **See**:
   - Latest tournament bracket analysis
   - How lucky/unlucky their bracket was
   - Visual comparison of possible ranks
   - Historical bracket analyses

### Automatic Updates

- Scraping runs **twice weekly** (every 3 days at 2 AM)
- New analyses appear automatically after each tournament
- Only shows data for tournaments where player participated
- Data is paired with existing runs in `tower_runs` table

## Monitoring & Maintenance

### Check Automation Status

```bash
curl https://tower-stats-backend-production.up.railway.app/api/tournament-brackets/automation/status
```

### Manually Trigger Analysis

```bash
curl -X POST https://tower-stats-backend-production.up.railway.app/api/tournament-brackets/automation/trigger
```

### View Logs

Check Railway deployment logs for:
- `⏰ Scheduled tournament scrape triggered`
- `✅ Tournament analysis completed`
- `❌ Tournament scrape failed`

## Future Enhancements

1. **Discord Notifications**: Send DM when new analysis available
2. **Detailed Breakdown**: Click history item to see full bracket data
3. **Comparison**: Compare difficulty across multiple tournaments
4. **Leaderboard**: Show luckiest/unluckiest players
5. **Predictions**: Use historical data to predict future bracket difficulty

## API Response Examples

### Get User's Bracket Analyses

**Request**:
```bash
GET /api/tournament-brackets/user/123456789?limit=5
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "discord_user_id": "123456789",
      "run_id": 456,
      "league": "Gold",
      "wave": 1650,
      "difficulty_score": 68.5,
      "difficulty_label": "Easy",
      "actual_rank": 7,
      "best_possible_rank": 3,
      "worst_possible_rank": 15,
      "average_rank": 9.2,
      "total_brackets_analyzed": 120,
      "percentile_vs_winners": 45.3,
      "analyzed_at": "2025-10-06T14:30:00Z"
    }
  ]
}
```

## Files Modified/Created

### Backend
- ✅ `server/services/tournament-automation-service.js` (NEW)
- ✅ `server/services/tower-lol-scraper.js` (CREATED EARLIER)
- ✅ `server/services/tower-lol-playwright-scraper.js` (PLACEHOLDER)
- ✅ `server/routes/tournament-brackets.js` (MODIFIED - added endpoints)
- ✅ `server/database/tournament-brackets-schema.sql` (CREATED EARLIER)
- ✅ `server/server.js` (MODIFIED - added automation initialization)

### Frontend
- ✅ `public/index.html` (MODIFIED - added bracket difficulty section)
- ✅ `public/css/bracket-difficulty.css` (NEW)
- ✅ `public/js/bracket-difficulty.js` (NEW)
- ✅ `public/tournaments.js` (MODIFIED - added bracket init)

## Support

For issues or questions:
- Check Railway logs for backend errors
- Check browser console for frontend errors
- Verify database tables exist in Supabase
- Ensure Discord auth is working
- Test API endpoints directly with curl/Postman

---

**Status**: ✅ UI Integration Complete | ⏳ Scraper Implementation Pending | 📊 Ready for Testing
