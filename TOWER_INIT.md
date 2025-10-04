# Tower Statistics Dashboard - Complete System Documentation

## Project Overview
Tower Statistics Dashboard is a comprehensive analytics platform for the Tower game, featuring Discord bot integration, real-time data collection, and advanced statistical analysis.

## Architecture Components

### 1. Backend Server (Node.js/Express)
- **Port**: 6078
- **Location**: `/server/server.js`
- **Database**: Supabase (PostgreSQL) with SQLite fallback
- **Authentication**: Discord OAuth 2.0

### 2. Discord Bot
- **Commands**: `/submit`, `/stats`, `/leaderboard`, `/link`, `/help`
- **Parser**: Supports 80+ game statistics fields
- **Integration**: Direct Supabase database writes

### 3. Frontend Dashboard
- **Sections**: Tower Analytics, Achievements, Tournaments, Content Hub
- **Charts**: Chart.js with multiple visualization types
- **Real-time**: WebSocket connections for live updates

## Complete Stats Fields (80+ metrics)

### Core Statistics
- **Game Time**: Total game duration (e.g., "3d 0h 20m 57s")
- **Real Time**: Actual play time (e.g., "14h 38m 50s")
- **Tier**: Current tier reached (1-20+)
- **Wave**: Maximum wave achieved
- **Killed By**: Enemy type that ended the run

### Economic Statistics
- **Coins Earned**: Total coins collected (supports K/M/B/T/q/Q/s/S/O/N/D/U notation)
- **Cash Earned**: Total cash generated
- **Interest Earned**: Passive income from interest
- **Gem Blocks Tapped**: Number of gem blocks clicked
- **Cells Earned**: Total cells collected
- **Reroll Shards Earned**: Shards for rerolling upgrades

### Damage Statistics
- **Damage Taken**: Total damage received
- **Damage Taken Wall**: Damage absorbed by wall
- **Damage Taken While Berserked**: Damage during berserk mode
- **Damage Gain From Berserk**: Multiplier from berserk (e.g., x8.00)
- **Death Defy**: Number of death defies used
- **Damage Dealt**: Total damage output

### Damage Sources
- **Projectiles Damage**: Main tower projectile damage
- **Rend Armor Damage**: Armor reduction damage
- **Projectiles Count**: Total projectiles fired
- **Lifesteal**: Health recovered from lifesteal
- **Thorn Damage**: Reflected damage from thorns
- **Orb Damage**: Orbital damage
- **Orb Hits**: Number of orb hits
- **Land Mine Damage**: Explosive trap damage
- **Land Mines Spawned**: Total mines placed
- **Death Ray Damage**: Laser beam damage
- **Smart Missile Damage**: Guided missile damage
- **Inner Land Mine Damage**: Secondary mine damage
- **Chain Lightning Damage**: Chain lightning total
- **Death Wave Damage**: Wave-clear damage
- **Swamp Damage**: Area denial damage
- **Black Hole Damage**: Gravitational damage

### Resource Income Sources
- **Coins from Death Wave**: Coins from wave clears
- **Cash from Golden Tower**: Golden tower cash generation
- **Coins from Golden Tower**: Golden tower coin generation
- **Coins from Blackhole**: Black hole coin generation
- **Coins from Spotlight**: Spotlight bonus coins
- **Coins from Orbs**: Orbital coin collection
- **Coins from Coin Upgrade**: Upgrade bonus coins
- **Coins from Coin Bonuses**: Various bonus sources

### Enemy Statistics
- **Total Enemies**: All enemies encountered
- **Basic**: Standard enemy count
- **Fast**: Speed enemy count
- **Tank**: Heavy enemy count
- **Ranged**: Projectile enemy count
- **Boss**: Boss enemy count
- **Protector**: Shield enemy count
- **Total Elites**: All elite enemies
- **Vampires**: Life-stealing elites
- **Rays**: Laser elites
- **Scatters**: Splitting elites
- **Saboteurs**: Debuff elites
- **Commanders**: Buff elites
- **Overcharges**: Overcharged elites

### Kill Methods
- **Destroyed by Orbs**: Orb kills
- **Destroyed by Thorns**: Thorn kills
- **Destroyed by Death ray**: Death ray kills
- **Destroyed by Land Mine**: Mine kills

### Bot Statistics
- **Flame bot damage**: Fire bot total damage
- **Thunder bot stuns**: Stun bot activations
- **Golden bot coins earned**: Gold bot income
- **Guardian catches**: Guardian saves
- **Coins Fetched**: Coins collected by bots
- **Coins Stolen**: Coins lost to enemies

### Upgrade Statistics
- **Waves Skipped**: Fast-forward count
- **Recovery Packages**: Health packs used
- **Free Attack Upgrade**: Attack upgrades earned
- **Free Defense Upgrade**: Defense upgrades earned
- **Free Utility Upgrade**: Utility upgrades earned
- **HP From Death Wave**: Health from wave clears

### Resource Rewards
- **Gems**: Premium currency earned
- **Medals**: Achievement medals
- **Reroll Shards**: Reroll currency
- **Cannon Shards**: Weapon shards
- **Armor Shards**: Defense shards
- **Generator Shards**: Income shards
- **Core Shards**: Core upgrade shards
- **Common Modules**: Common equipment
- **Rare Modules**: Rare equipment

## Data Flow

1. **User Submission**
   - Copy stats from Tower game
   - Paste in Discord with `/submit` command
   - Bot parses 80+ fields using regex patterns

2. **Data Processing**
   - European number format support (comma as decimal)
   - Time parsing (days/hours/minutes/seconds)
   - Multiplier notation (K/M/B/T/q/Q/s/S/O/N/D/U)

3. **Database Storage**
   - Supabase `tower_runs` table
   - All fields properly normalized
   - User/server association maintained

4. **Analytics Display**
   - Real-time calculations (coins/hour, efficiency)
   - Multiple chart types (bar, polar, doughnut, radar)
   - Filtering by session, time range, metrics

## Key Calculations

### Coins Per Hour
```javascript
// Fixed calculation with proper parsing
const hours = parseTime(realTime); // "14h 38m 50s" -> 14.65
const coins = parseValue(coinsEarned); // "217,87T" -> 217.87e12
const coinsPerHour = coins / hours; // ~14.87T/hour
```

### Efficiency Metrics
- Coins per wave
- Damage per projectile
- Kill efficiency by method
- Resource generation rates

## Database Schema

### tower_runs table (80+ columns)
- Basic: id, discord_user_id, discord_server_id, submitted_at
- Game: tier, wave, game_time, real_time, killed_by
- Economy: coins_earned, cash_earned, interest_earned
- Combat: damage_dealt, damage_taken, all damage sources
- Enemies: all enemy type counts
- Resources: all shard/module/gem counts
- Bots: all bot statistics

## API Endpoints

### GET /api/tower/runs
- Params: limit, offset, discordUserId
- Returns: Paginated run data

### GET /api/tower/stats
- Returns: Aggregated statistics

### GET /api/tower/leaderboard
- Returns: Top performers by metric

### POST /api/tower/submit
- Body: Full stats paste
- Returns: Parsed and stored run

## Configuration Files

### /server/.env
```env
DISCORD_BOT_TOKEN=your_token
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_secret
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key
PORT=6078
NODE_ENV=development
```

### /public/js/config/constants.js
- API endpoints configuration
- Chart colors and themes
- Module definitions
- Storage keys

## Running the System

### Development
```bash
cd server
node server.js
```

### Production
```bash
npm start
```

### Testing
```bash
# Test stats parsing
curl -X POST http://localhost:6078/api/tower/submit -d @stats.txt

# Test calculations
node test-calculations.js
```

## Key Features

1. **Complete Stats Tracking**: All 80+ game metrics captured
2. **Multi-format Support**: Tab-separated and multi-line stats
3. **European Numbers**: Comma decimal separator support
4. **Advanced Parsing**: Complex multiplier notation (up to Tv)
5. **Real-time Analytics**: Live charts and calculations
6. **Discord Integration**: Seamless bot commands
7. **Supabase Backend**: Scalable PostgreSQL database
8. **Fallback Systems**: Local data when services unavailable

## Common Issues & Solutions

### Issue: Coins/hour calculation wrong
**Solution**: Fixed parser to handle European format and clean time strings

### Issue: Missing stats fields
**Solution**: All 80+ fields now captured in submitCommand.js

### Issue: CORS errors
**Solution**: Ensure all services use same port (6078)

### Issue: Supabase connection
**Solution**: Check .env configuration in /server directory

## Future Enhancements

1. **WebSocket Updates**: Real-time dashboard updates
2. **Advanced Analytics**: Machine learning predictions
3. **Mobile App**: React Native companion app
4. **API Rate Limiting**: Protect against abuse
5. **Data Export**: CSV/JSON export functionality

## Support

For issues or questions:
- Discord: Join the Tower community server
- GitHub: Submit issues to the repository
- Documentation: This file (TOWER_INIT.md)