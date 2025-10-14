# Next Session: Tobi Calculator Implementation

## What We Accomplished This Session ✅

### Chatbot Enhancements:
- ✅ Fixed Railway deployment (added missing dependencies: winston, node-cache, joi)
- ✅ Generated new Railway domain: `https://social-tower-production.up.railway.app`
- ✅ Updated chatbot to use new Railway URL
- ✅ Fixed CORS to allow Vercel frontend
- ✅ **Chatbot now fetches user's lab data from Supabase**
- ✅ **Includes user lab levels in AI context for personalized answers**

### Calculator Planning:
- ✅ Analyzed Tobi spreadsheet structure (CSV and Excel)
- ✅ Created comprehensive implementation plan: `TOBI-FORMULA-IMPLEMENTATION-PLAN.md`
- ✅ Identified all key formulas and variables
- ✅ Found the Excel file with actual formulas
- ✅ Created formula extraction scripts
- ✅ Documented Super Tower Bonus card mastery issue

## Current State 🎯

### What Works Now:
1. **Chatbot asks about labs** → Fetches YOUR lab data → Gives personalized advice
2. Chatbot searches both Reddit community posts AND game knowledge base
3. Labs are saved to Supabase (fixed in previous session)

### What's Missing:
The chatbot currently gives advice based on community knowledge, but doesn't calculate:
- **eDamage** (effective damage)
- **eHP** (effective health)
- **eEcon** (effective economy)
- **ROI rankings** (which lab upgrade gives best return)

## Next Session Goals 🚀

### Phase 1: Extract Formulas (30 min)
**Action Items:**
1. Open `server/database/migrations/TheTowerofTobi.xlsx` in Excel
2. Go to **eDamage** sheet
3. Press `Ctrl+` ` to show formulas (or go to Formulas → Show Formulas)
4. Document the formula in these key cells:
   - **Cell with final eDamage value** (around column EP-ER, row 5)
   - **Lab multiplier cells** (how lab levels affect stats)
   - **Card mastery cells** (BL5:BR5)
   - **Super Tower Bonus formula** (specifically how card mastery affects it)

**Save screenshots or copy formulas to a text file!**

### Phase 2: Build Calculator Engine (90 min)

**2.1 Create Lab Effects Lookup:**
```javascript
// server/services/tower-calculator/lab-effects.js
// Map lab levels to multipliers
function getLabMultiplier(labName, level) {
  // Parse Lab_Researches.csv for this data
  // Return multiplier for given level
}
```

**2.2 Implement eDamage Calculator:**
```javascript
// server/services/tower-calculator/edmg-calculator.js
function calculateEDamage(labs, cardMastery, modules) {
  // 1. Get lab multipliers
  const damage = getLabMultiplier('damage', labs.damage);
  const attackSpeed = getLabMultiplier('attack_speed', labs.attack_speed);
  // ... all other labs

  // 2. Apply card mastery
  const damageWithMastery = damage * (1 + cardMastery.damage * 0.02);

  // 3. Calculate Super Tower Bonus WITH card mastery
  const stBonus = calculateSuperTowerBonus(
    labs.super_tower_bonus,
    cardMastery.super_tower
  );

  // 4. Calculate effective damage
  return calculateFinalEDamage({ damage, attackSpeed, stBonus, ... });
}
```

**2.3 Implement eHP Calculator:**
```javascript
// server/services/tower-calculator/ehp-calculator.js
// Similar structure for health
```

**2.4 Implement eEcon Calculator:**
```javascript
// server/services/tower-calculator/eecon-calculator.js
// Similar structure for economy
```

**2.5 Create ROI Calculator:**
```javascript
// server/services/tower-calculator/roi-calculator.js
function calculateLabPriorities(currentLabs, cardMastery) {
  const upgrades = [];

  // For each lab, calculate ROI
  for (const lab of ALL_LABS) {
    const currentEDMG = calculateEDamage(currentLabs, cardMastery);

    // Simulate upgrading this lab by 1 level
    const testLabs = { ...currentLabs, [lab]: currentLabs[lab] + 1 };
    const newEDMG = calculateEDamage(testLabs, cardMastery);

    const improvement = (newEDMG / currentEDMG - 1) * 100; // % increase
    const time = getUpgradeTime(lab, currentLabs[lab] + 1);
    const roi = improvement / time; // ROI per hour

    upgrades.push({ lab, improvement, time, roi });
  }

  return upgrades.sort((a, b) => b.roi - a.roi);
}
```

### Phase 3: Database & API (30 min)

**3.1 Add Card Mastery to Database:**
```sql
-- server/database/migrations/010_add_card_mastery.sql
ALTER TABLE user_labs ADD COLUMN damage_mastery INTEGER DEFAULT 0;
ALTER TABLE user_labs ADD COLUMN attack_speed_mastery INTEGER DEFAULT 0;
ALTER TABLE user_labs ADD COLUMN critical_chance_mastery INTEGER DEFAULT 0;
ALTER TABLE user_labs ADD COLUMN range_mastery INTEGER DEFAULT 0;
ALTER TABLE user_labs ADD COLUMN super_tower_mastery INTEGER DEFAULT 0;
ALTER TABLE user_labs ADD COLUMN ultimate_crit_mastery INTEGER DEFAULT 0;
ALTER TABLE user_labs ADD COLUMN demon_mode_mastery INTEGER DEFAULT 0;
```

**3.2 Create API Endpoints:**
```javascript
// server/routes/calculator.js
router.post('/calculate/edmg', async (req, res) => {
  const { discord_user_id } = req.body;

  // Get user's labs and card mastery
  const userData = await getUserData(discord_user_id);

  // Calculate current values
  const edmg = calculateEDamage(userData.labs, userData.card_mastery);
  const ehp = calculateEHP(userData.labs, userData.card_mastery);
  const eecon = calculateEEcon(userData.labs, userData.card_mastery);

  // Get lab priorities
  const priorities = calculateLabPriorities(userData.labs, userData.card_mastery);

  res.json({
    current: { edmg, ehp, eecon },
    recommended_upgrades: priorities.slice(0, 5)
  });
});
```

### Phase 4: Chatbot Integration (30 min)

**4.1 Update reddit-rag.js:**
```javascript
// When user asks about labs, also call calculator
if (discord_user_id && question.toLowerCase().includes('lab')) {
  // Fetch user labs AND call calculator
  const calcResponse = await fetch(`${BASE_URL}/api/calculator/edmg`, {
    method: 'POST',
    body: JSON.stringify({ discord_user_id })
  });

  const calculations = await calcResponse.json();

  userLabsContext += `\n\n[CALCULATED VALUES]:\n`;
  userLabsContext += `Current eDamage: ${calculations.current.edmg}\n`;
  userLabsContext += `\nTOP 5 RECOMMENDED UPGRADES:\n`;
  calculations.recommended_upgrades.forEach((up, i) => {
    userLabsContext += `${i+1}. ${up.lab}: +${up.improvement}% in ${up.time}\n`;
  });
}
```

## Key Files to Work With 📁

### Input Data:
- `server/database/migrations/TheTowerofTobi.xlsx` - Has all formulas
- `assets/Lab_Researches.csv` - Lab upgrade costs and times

### Code to Create:
- `server/services/tower-calculator/` - New directory for calculators
  - `edmg-calculator.js`
  - `ehp-calculator.js`
  - `eecon-calculator.js`
  - `roi-calculator.js`
  - `lab-effects.js`
  - `card-mastery.js`
  - `constants.js`

### Code to Update:
- `server/routes/reddit-rag.js` - Add calculator integration
- `server/database/migrations/` - Add card mastery columns
- `public/js/labs-manager.js` - Add card mastery UI

## Testing Checklist ✓

- [ ] Calculator matches Tobi sheet values within 1%
- [ ] Super Tower Bonus accounts for card mastery
- [ ] Lab priorities match community consensus
- [ ] Chatbot gives accurate personalized advice
- [ ] All three calculators (eDamage, eHP, eEcon) work
- [ ] ROI rankings are sensible

## Quick Start for Next Session

1. **Open the Excel file** and document formulas
2. **Start with eDamage only** (most complex, others are similar)
3. **Test against known values** as you go
4. **Add one calculator at a time** (don't try to do all at once)

## Resources

- Implementation plan: `TOBI-FORMULA-IMPLEMENTATION-PLAN.md`
- Formula extraction scripts: `extract-all-formulas.py`, `analyze-tobi-formulas.js`
- Current chatbot integration: `server/routes/reddit-rag.js:197-215`

---

**Remember:** This is a substantial task (2-3 hours). Break it into phases and test each part before moving to the next!
