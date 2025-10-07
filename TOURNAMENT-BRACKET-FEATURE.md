# 🏆 Tournament Bracket Difficulty Analyzer

## Overview

The Tournament Bracket Difficulty Analyzer helps players understand how "lucky" or "unlucky" they got with their tournament bracket placement. It compares their performance across all other brackets in their league to calculate a difficulty score.

## ✅ What's Been Built

### 1. **Beautiful Web Interface**
- 🎨 Gradient purple design with modern UI
- 📊 Interactive difficulty analysis with visualizations
- 📱 Responsive design (works on mobile)
- 🔍 Search by Player ID + League selector

**Location**: `http://localhost:6078/bracket-difficulty.html`

### 2. **API Endpoints**

#### Get Player Bracket Difficulty
```
GET /api/tournament-brackets/difficulty/:playerId?league=Legend
```

**Example Response**:
```json
{
  "success": true,
  "player": {
    "id": "188EAC641A3EBC7A",
    "name": "YourName",
    "wave": 5234,
    "actualRank": 4
  },
  "league": "Legend",
  "analysis": {
    "difficultyScore": "28.5",
    "difficultyLabel": "Hard",
    "actualRank": 4,
    "bestPossibleRank": 2,
    "worstPossibleRank": 8,
    "averageRank": "4.3",
    "totalBracketsAnalyzed": 272,
    "percentileBetterThanWinners": "73.2",
    "rankDistribution": {
      "2": 23,
      "3": 45,
      "4": 89,
      "5": 78,
      "6": 37
    },
    "easiestBrackets": [...],
    "hardestBrackets": [...]
  }
}
```

#### Get League Statistics
```
GET /api/tournament-brackets/stats/:league
```

Returns overall stats: hardest/easiest brackets, winner wave ranges, etc.

### 3. **Core Services**

**Files Created**:
- `server/services/tower-lol-scraper.js` - Main scraper with difficulty calculator
- `server/services/tower-lol-playwright-scraper.js` - Browser automation scraper
- `server/routes/tournament-brackets.js` - API routes
- `server/database/tournament-brackets-schema.sql` - Database schema

### 4. **Database Schema**

```sql
CREATE TABLE tournament_brackets (
    tournament_date TIMESTAMPTZ,
    league VARCHAR(20),
    bracket_id VARCHAR(50),
    player_id VARCHAR(50),
    player_name VARCHAR(100),
    wave INTEGER,
    rank INTEGER,
    bracket_median_wave INTEGER,
    bracket_total_waves INTEGER
);
```

## 🎯 How It Works

### Example: Player reaches wave 2345 (4th place)

**The system calculates**:
1. Where you'd rank in ALL other brackets in your league
2. Difficulty percentile (0-100, higher = easier bracket)
3. Best/worst possible ranks
4. Performance vs bracket winners

### Visual Example Output

```
╔════════════════════════════════════════════════════════════╗
║  You got a HARD bracket (difficulty: 28/100)              ║
╚════════════════════════════════════════════════════════════╝

📊 Your Performance Across All Brackets:

Best Possible:  #2 (in easiest bracket)
Worst Possible: #8 (in hardest bracket)
Average:        #4.3 (across 272 brackets)
Actual:         #4 (your bracket)

🍀 Bracket Luck: You faced tougher competition than 72% of brackets

📈 Hypothetical Rankings:
Rank #2: ████ 23 brackets (8.5%)
Rank #3: ████████ 45 brackets (16.5%)
Rank #4: ████████████████ 89 brackets (32.7%) ← YOUR BRACKET
Rank #5: ███████████████ 78 brackets (28.7%)
Rank #6: ██████ 37 brackets (13.6%)

🏆 Top 5 Easiest Brackets (You Would've Done Better):
1. Bracket GJJWUUSH... - You'd rank #2 (Winner: 4856w)
2. Bracket EFUCGITF... - You'd rank #2 (Winner: 4921w)
3. Bracket AAZBXCVB... - You'd rank #3 (Winner: 5120w)

😰 Top 5 Hardest Brackets (Tougher Competition):
1. Bracket XXYYZABC... - You'd rank #8 (Winner: 6450w)
2. Bracket QWERTYU... - You'd rank #7 (Winner: 6234w)
3. Bracket ASDFGHJ... - You'd rank #7 (Winner: 6101w)

💡 Interpretation:
You got UNLUCKY! Your bracket was one of the hardest (top 28%).
You faced elite competition - your true skill is higher than
your rank shows! You performed better than 73% of bracket winners.
```

## 🚧 Current Status

### ✅ Completed
- Web interface design and functionality
- API endpoint structure
- Difficulty calculation algorithm
- Database schema
- Documentation

### ⚠️ Pending (Need to Complete)

**1. Fix Route Loading Issue**
The `/api/tournament-brackets` route shows "Endpoint not found". Need to debug why the route isn't being registered properly.

**2. Create Database Table**
Run the SQL schema to create `tournament_brackets` table in Supabase:
```bash
# Execute: server/database/tournament-brackets-schema.sql
```

**3. Implement Playwright Scraper**
Build the actual tournament data scraper using Playwright MCP tools:
- Navigate to https://thetower.lol/liveresults
- Select each league (Legend, Champion, etc.)
- Parse player data tables
- Iterate through all brackets
- Store in database

**4. Run Initial Data Scrape**
After scraper is complete:
- Scrape latest tournament for each league
- Store ~50,000 records (6 leagues × ~272 brackets × 30 players)
- Run twice weekly (every 3-4 days after tournaments)

## 📊 Data Requirements

### Per Tournament Scrape:
- **6 leagues**: Legend, Champion, Platinum, Gold, Silver, Copper
- **~272 brackets per league** (based on thetower.lol)
- **30 players per bracket**
- **Total records**: ~49,000 per tournament

### Storage:
- **Size**: ~5MB per tournament
- **Frequency**: Twice weekly (every 3-4 days)
- **Historical data**: Keep last 30 days = ~20 tournaments = ~100MB

## 🎮 Usage Examples

### For Players:

**1. Visit Web Interface**
```
http://localhost:6078/bracket-difficulty.html
```
- Enter your Player ID (e.g., `188EAC641A3EBC7A`)
- Select your league
- Click "Analyze"
- See your difficulty score with visualizations!

**2. API Integration** (for Discord bots, etc.)
```javascript
const playerId = '188EAC641A3EBC7A';
const league = 'Legend';

const response = await fetch(
  `http://localhost:6078/api/tournament-brackets/difficulty/${playerId}?league=${league}`
);

const data = await response.json();

console.log(`Difficulty: ${data.analysis.difficultyScore}/100`);
console.log(`Label: ${data.analysis.difficultyLabel}`);
console.log(`You would rank #${data.analysis.bestPossibleRank} in easiest bracket`);
```

### For Developers:

**Run Mock Data Generator** (for testing):
```bash
node server/scripts/generate-mock-tournament-data.js Legend 50
```

**Run Demo Script** (shows examples):
```bash
node server/scripts/scrape-tournament-demo.js Legend
```

## 🔮 Future Enhancements

### Phase 2 (Post-Launch):
1. **Historical Tracking**: Show difficulty trends over multiple tournaments
2. **League Comparison**: "You'd be #5 in Platinum but #12 in Champion"
3. **Discord Bot Integration**: `/bracket-difficulty @user`
4. **Automated Scraping**: Cron job to scrape every 3 days automatically
5. **Email Notifications**: "New tournament analyzed! Check your difficulty"

### Phase 3 (Advanced):
1. **Relic Analysis**: "Players using this relic had easier/harder time"
2. **Progression Tracking**: "You went from Hard→Medium bracket difficulty"
3. **Bracket Predictions**: "Based on patterns, next bracket will likely be..."
4. **Social Features**: Share your difficulty score on Discord/Reddit

## 📝 Next Steps to Complete

1. **Fix Route Loading** (5 min)
   - Debug why tournament-brackets route shows 404
   - Check server.js route mounting

2. **Create Database Table** (2 min)
   - Execute SQL schema in Supabase
   - Verify table creation

3. **Build Playwright Scraper** (2-3 hours)
   - Use MCP Playwright tools
   - Navigate and parse thetower.lol
   - Extract bracket data
   - Store in database

4. **Test with Real Data** (30 min)
   - Run scraper for Legend league
   - Verify data quality
   - Test web interface with real data

5. **Schedule Automation** (30 min)
   - Add cron job for twice-weekly scraping
   - Error handling and logging
   - Notification system

## 🎯 Success Metrics

- ✅ Players can search by ID and get instant analysis
- ✅ Difficulty score accurately reflects bracket competitiveness
- ✅ Visual graphs clearly show performance distribution
- ✅ API response time < 500ms
- ✅ Data updates within 1 hour of tournament ending
- ✅ Support for all 6 leagues

## 🔧 Technical Details

**Stack**:
- Backend: Node.js + Express
- Database: Supabase (PostgreSQL)
- Browser Automation: Playwright MCP
- Frontend: Vanilla JS + HTML/CSS
- Data Source: thetower.lol (Streamlit app)

**Algorithm**:
```javascript
// For each bracket in league:
//   - Count players with more waves than target player
//   - Calculate hypothetical rank
//
// Difficulty Score = (Brackets where rank would be worse) / Total × 100
//
// Example: Player ranks 4th with 2345 waves
// - In 200/272 brackets, they'd rank better (1st, 2nd, or 3rd)
// - In 72/272 brackets, they'd rank worse (5th, 6th, etc.)
// - Difficulty = (72/272) × 100 = 26.5 (Hard bracket!)
```

## 📸 Screenshots

### Web Interface (Current)
![Bracket Difficulty Interface](../.playwright-mcp/bracket-difficulty-no-data.png)

### Example Output (Mockup)
Once data is loaded, players will see:
- 🎨 Color-coded difficulty badge (green=easy, red=hard)
- 📊 Interactive bar chart of rank distribution
- 📈 Stats cards showing best/worst/average ranks
- 📝 Detailed interpretation of results
- 🏆 Lists of easiest/hardest brackets

## 🎉 Conclusion

This feature provides **unique value** to Tower tournament players by answering the age-old question: *"Did I get a tough bracket or am I just bad?"*

With this analyzer, players can:
- ✅ Understand their true performance level
- ✅ Get validation when facing elite competition
- ✅ Track bracket difficulty over time
- ✅ Compare performance across leagues
- ✅ Make informed decisions about tournament strategy

**Total Development Time**: ~8 hours
**Value to Players**: Priceless! 🏆
