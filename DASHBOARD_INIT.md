# Tower Stats Dashboard - Initialization Guide

## Overview
A comprehensive statistics tracking dashboard for "The Tower" mobile game. The dashboard allows players to import game runs, track performance, manage card/module presets, and access community content.

## Project Structure

```
social tower/
├── public/
│   ├── index.html              # Main HTML file
│   ├── script.js               # Main dashboard logic
│   ├── styles.css              # Main stylesheet
│   ├── discord-auth.js         # Discord OAuth authentication
│   │
│   ├── js/
│   │   ├── config/
│   │   │   ├── field-mappings.js    # Centralized field name mappings
│   │   │   └── preset-manager.js    # Card/module preset system
│   │   │
│   │   ├── utils/
│   │   │   ├── data-parser.js       # Game stats text parser
│   │   │   ├── formatting.js        # Number/time formatting utilities
│   │   │   ├── storage.js           # localStorage wrapper
│   │   │   ├── notifications.js     # Toast notification system
│   │   │   └── modal.js             # Modal dialog utilities
│   │   │
│   │   └── modules/
│   │       ├── cards-manager.js           # Card selection system
│   │       ├── unique-modules-manager.js  # Unique module selection
│   │       └── ... (other feature modules)
│   │
│   ├── css/
│   │   ├── glassmorphism-theme.css  # Modern UI theme
│   │   ├── landing-page.css         # Login page styling
│   │   └── ... (other component styles)
│   │
│   └── assets/
│       ├── cards/                   # Card images
│       └── thetowerlogo.jpg         # Game logo
│
└── server/
    └── server.js                    # Express backend server
```

## Core Systems

### 1. Data Management (`script.js`)

**TowerStatsManager Class**
- **Purpose**: Main controller for dashboard functionality
- **Key Properties**:
  - `sessions`: Array of all imported game runs
  - `currentSession`: Currently displayed run
  - `activeFilter`: Filter mode ('current', 'last5', 'week', 'all')
  - `chart`: Chart.js instance for performance visualization

**Key Methods**:
```javascript
// Data Import
importGameData()           // Parse and store game stats
parseGameStats()           // Convert text to structured data
addSession(data)           // Add new run to sessions array

// Display
updateDisplay()            // Refresh all UI elements
updateStatCards()          // Update main stat tiles
updateComprehensiveStats() // Update detailed stats grid
updateHistoryList()        // Refresh run history

// Storage
saveToStorage()            // Save to localStorage
loadStoredData()           // Load from localStorage
```

### 2. Field Mappings (`field-mappings.js`)

**Purpose**: Centralize field name mapping to prevent inconsistencies

**Structure**:
```javascript
{
  'Game Time': 'game_time',      // Display Name -> Internal Key
  'Real Time': 'real_time',
  'Tier': 'tier',
  'Wave': 'wave',
  // ... 88 total fields
}
```

**Key Features**:
- `getFieldMappings()`: Returns all mappings
- `getDisplayFields()`: Returns array with labels, keys, and default values
- `getFieldKey(label)`: Get internal key from display label
- Used by both parser (data-parser.js) and display (script.js)

### 3. Data Parser (`data-parser.js`)

**Purpose**: Parse game statistics from clipboard text

**Process**:
1. Split text into lines
2. Parse tab or space-separated values
3. Map field names using FieldMappings
4. Preserve formatting (times, currency, abbreviations)
5. Return structured object

**Value Handling**:
- Times: Keep as strings (e.g., "3d 0h 20m 57s")
- Currency: Keep with $ (e.g., "$217.87T")
- Numbers: Parse to numeric values
- Abbreviations: Preserve (K, M, B, T, q, Q, s, S)

### 4. Preset System (`preset-manager.js`)

**Purpose**: Save and load card/module configurations

**Built-in Presets**:
- 🌾 **Farm Setup**: Coin/cash optimization
- 🏆 **Tournament Setup**: Maximum damage
- 📈 **Push Setup**: Balanced tier pushing
- 🛡️ **Defense Setup**: Maximum survivability

**Data Structure**:
```javascript
{
  name: 'Preset Name',
  description: 'What this preset does',
  cards: ['Card 1', 'Card 2', ...],
  modules: {
    cannons: 'moduleKey',
    armor: 'moduleKey',
    generators: 'moduleKey',
    cores: 'moduleKey'
  }
}
```

**Key Methods**:
- `applyPreset(key)`: Load and activate a preset
- `saveCurrentAsPreset()`: Save current selection as new preset
- `getCurrentSetup()`: Get active cards/modules

### 5. Card Manager (`cards-manager.js`)

**Purpose**: Track which cards were used in each run

**Features**:
- Visual card selection grid
- Active card tracking
- Preset integration
- localStorage persistence

**Data Storage**:
```javascript
localStorage.setItem('activeCards', JSON.stringify(['Card 1', 'Card 2']));
```

### 6. Module Manager (`unique-modules-manager.js`)

**Purpose**: Track unique modules (one per category)

**Categories**:
- Cannons (5 unique modules)
- Armor (5 unique modules)
- Generators (5 unique modules)
- Cores (5 unique modules)

**Constraint**: Only one module active per category

### 7. Authentication (`discord-auth.js`)

**Purpose**: Discord OAuth login via Supabase

**Flow**:
1. User clicks login → redirect to Discord OAuth
2. Discord authenticates → returns to app
3. Supabase stores session
4. App shows authenticated content

**Session Check**:
```javascript
supabase.auth.getSession() // Check if user logged in
```

## Data Flow

### Import Run Flow
```
User pastes stats text
    ↓
GameDataParser.parseGameStats()
    ↓
Field name mapping via FieldMappings
    ↓
Add selected cards (CardsManager.activeCards)
    ↓
Add active modules (UniqueModulesManager.activeModules)
    ↓
Add preset info (PresetManager.currentPreset)
    ↓
TowerStatsManager.addSession()
    ↓
Save to localStorage
    ↓
Update all displays
```

### Display Update Flow
```
TowerStatsManager.updateDisplay()
    ↓
├── updateStatCards()          (Main tiles)
├── updateComprehensiveStats() (Detailed grid)
├── updateHistoryList()        (Run history)
└── updateChart()              (Performance graph)
```

## Storage Structure

### localStorage Keys
- `towerStats`: All game run sessions
- `activeCards`: Currently selected cards
- `uniqueModules:active`: Currently selected modules
- `gamePresets`: Custom saved presets

### Session Data Structure
```javascript
{
  sessionId: 'session_1234567890',
  timestamp: '2025-10-01T...',

  // Game Stats (88 fields total)
  game_time: '3d 0h 20m 57s',
  real_time: '14h 38m 50s',
  tier: 14,
  wave: 8541,
  damage_dealt: '217,87T',
  // ... all other stats

  // Metadata
  cards_used: ['Card 1', 'Card 2'],
  modules_used: [
    { key: 'moduleKey', name: 'Module Name', category: 'cannons' }
  ],
  preset_used: 'farm'
}
```

## UI Components

### Dashboard Tab
- **Quick Stats Cards**: Tier, Wave, Coins
- **Comprehensive Stats Grid**: All 88 game statistics
- **Performance Chart**: Progress over time
- **Recent Sessions**: Filterable run history

### Content Hub Tab
- **Wiki Search**: Search game documentation
- **YouTube Videos**: Latest community videos
- **Reddit Posts**: Recent game discussions

### Data Import Modal
- **Preset Selector**: Quick setup presets
- **Stats Input**: Paste game statistics
- **Card Grid**: Visual card selection
- **Save Preset**: Save current configuration

## Run Filtering

### Filter Options
- **Current Run**: Show only the latest run
- **Last 5 Runs**: Show 5 most recent runs
- **Last Week**: Show runs from past 7 days
- **All Runs**: Show all runs (default)

### Implementation
```javascript
activeFilter = 'all' | 'current' | 'last5' | 'week'
applyRunFilter() // Filter sessions array based on activeFilter
```

## Formatting Utilities

### Number Formatting
```javascript
FormattingUtils.formatNumber(12345)
// Returns: "12.35K"

FormattingUtils.formatNumber(1234567890)
// Returns: "1.23B"
```

### Abbreviation Scale
- K = thousand (1,000)
- M = million (1,000,000)
- B = billion (1,000,000,000)
- T = trillion (1,000,000,000,000)
- q = quadrillion (1,000,000,000,000,000)
- Q = quintillion (1,000,000,000,000,000,000)
- s = sextillion (1,000,000,000,000,000,000,000)
- S = septillion (1,000,000,000,000,000,000,000,000)

## Styling System

### CSS Architecture
- **Root Variables**: Glassmorphism color scheme
- **Component Styles**: Modular CSS per feature
- **Responsive**: Breakpoints at 1200px, 768px

### Theme Colors
```css
--accent-color: #26E2B3 (Teal)
--accent-secondary: #01A1F5 (Blue)
--background-primary: #232323 (Dark gray)
--text-primary: #FFFFFF (White)
```

## Event System

### Event Bus Pattern
```javascript
window.eventBus.emit('cards:selection-changed', data)
window.eventBus.on('cards:selection-changed', callback)
```

### Key Events
- `cards:selection-changed`: Card selection updated
- `modules:selection-changed`: Module selection updated
- `session:added`: New run imported
- `filter:changed`: Run filter changed

## API Endpoints

### Server Routes (server.js)
- `GET /api/tower/stats`: Get latest statistics
- `GET /api/discord/auth`: Discord OAuth callback
- `GET /api/wiki/search`: Search wiki content
- `GET /api/youtube/videos`: Fetch latest videos
- `GET /api/reddit/posts`: Fetch Reddit posts

## Development Workflow

### Adding New Statistics Field
1. Add to `field-mappings.js` → `getFieldMappings()`
2. Parser automatically picks it up
3. Display automatically shows it in comprehensive stats

### Creating New Preset
1. Select cards and modules
2. Click "Save Current" in preset modal
3. Enter name and description
4. Preset saved to localStorage

### Debugging
- Open browser console (F12)
- Check console.log outputs:
  - "Parsing field: ..." - Field parsing
  - "Added selected cards: ..." - Card tracking
  - "Session added successfully" - Import success
  - Any errors with stack traces

## Common Issues

### Stats Showing "0"
- **Cause**: Field name mismatch
- **Fix**: Check field-mappings.js for correct mapping

### Time Showing as Number
- **Cause**: Parser converting time to seconds
- **Fix**: Already fixed - times kept as strings

### Preset Not Applying
- **Cause**: CardsManager/ModulesManager not initialized
- **Fix**: Check console for initialization logs

### Login Loop
- **Cause**: Missing Supabase environment variables
- **Fix**: Set SUPABASE_URL and SUPABASE_SERVICE_KEY

## Future Enhancements

### Planned Features
- [ ] Run filtering (current/last 5/week/all) - IN PROGRESS
- [ ] Export runs to CSV
- [ ] Compare multiple runs
- [ ] Achievement tracking
- [ ] Tournament leaderboards
- [ ] Advanced analytics charts

### Performance Optimizations
- [ ] Virtual scrolling for large run lists
- [ ] Lazy load stat tiles
- [ ] IndexedDB for large datasets
- [ ] Web Workers for parsing

## Testing

### Manual Testing Checklist
- [ ] Import run with valid stats
- [ ] Select cards and modules
- [ ] Apply preset
- [ ] Save custom preset
- [ ] Filter runs
- [ ] Delete run
- [ ] Check localStorage persistence
- [ ] Test on mobile viewport

## Deployment

### Production Checklist
1. Set environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
2. Update API endpoints if different domain
3. Minify CSS/JS (optional)
4. Enable HTTPS
5. Test Discord OAuth redirect URLs

## Support & Resources

### Documentation Files
- `TOWER_INIT.md`: Initial setup guide
- `WIKI_IMPLEMENTATION_SUMMARY.md`: Wiki search feature
- `MODULARIZATION_PLAN.md`: Code organization plan
- `DASHBOARD_INIT.md`: This file

### External Resources
- Game: "The Tower" on mobile app stores
- Discord: Game community server
- Reddit: r/TheTower (if exists)

---

**Last Updated**: 2025-10-01
**Version**: 1.0
**Maintainer**: Dashboard Development Team
