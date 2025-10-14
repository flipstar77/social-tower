# Tobi Calculator Implementation Plan

## Overview
This document details the plan to implement eDamage, eHP, and eEcon calculators based on "TheTowerofTobi" spreadsheets.

## Data Sources

### 1. Lab_Researches.csv
Contains all lab upgrade information:
- Lab names (Damage, Attack Speed, Critical Factor, etc.)
- Level progression (1-100+)
- Duration (cumulative time from level 1)
- Cost (in coins)
- Gems (gem cost)

**Key Labs for Each Category:**

#### eDamage Labs:
- Damage
- Attack Speed
- Critical Factor
- Range
- Damage / Meter
- Super Crit Chance
- Super Crit Multi
- Super Tower Bonus
- Max Rend Armor Multiplier
- Spotlight Missiles
- Standard Perks Bonus
- Improve Trade-off Perks
- Death Wave Damage Amplifier
- Shock Multiplier
- Missile Amplifier

#### eHP Labs:
- Health
- Defense %
- Defense Absolute
- Wall Health
- Wall Fortification
- Recovery Package Max
- Chrono Field Reduction %
- Death Wave Health
- Chain Thunder

#### eEcon Labs:
- Coins / Kill Bonus
- Golden Tower Bonus
- Golden Tower Duration
- Black Hole Coin Bonus
- Death Wave Coin Bonus
- Spotlight Coin Bonus
- Gold Bot - Cooldown
- Gold Bot - Duration

### 2. TheTowerofTobi - eDamage.csv
**Input Variables (Row 4, Columns ~52-66):**
- Damage (lab level effect)
- Attack Speed (lab level effect)
- Critical Factor (lab level effect)
- Range (lab level effect)
- Damage / Meter (lab level effect)
- Super Crit Chance (lab level effect)
- Super Crit Multi (lab level effect)
- Super Tower Bonus (lab level effect)
- Max Rend Armor Multiplier (lab level effect)
- Spotlight Missiles (lab level effect)
- Standard Perks Bonus (lab level effect)
- Improve Trade-off Perks (lab level effect)
- Death Wave Damage Amplifier (lab level effect)
- Shock Multiplier (lab level effect)
- Missile Amplifier (lab level effect)

**Card Mastery Inputs (Row 4, Columns ~67-73):**
- Damage Mastery (0-7)
- Attack Speed Mastery (0-7)
- Critical Chance Mastery (0-7)
- Range Mastery (0-7)
- Super Tower Mastery (0-7)
- Ultimate Crit Mastery (0-7)
- Demon Mode Mastery (0-7)

**Constants/Configuration (Row 4, Columns ~75-95):**
- Base values
- Critical Chance base
- UW Crit Chance
- Super Crit Multi base
- Rapid Fire multiplier
- And more...

**Output (Row 4, Column ~127):**
- eDamage final value (e.g., 5.275E+10)

### 3. TheTowerofTobi - eHP.csv
Similar structure to eDamage but with HP-focused stats

### 4. TheTowerofTobi - eEcon.csv
Similar structure to eDamage but with economy-focused stats

---

## Formula Structure Analysis

### eDamage Formula (High-Level)

The eDamage calculation appears to follow this general structure:

```
eDamage = BaseDamage × DamageMultipliers × CriticalMultipliers ×
          AttackSpeedMultipliers × PerksMultipliers × UWMultipliers ×
          CardMasteryMultipliers
```

**Components:**

1. **Base Damage**: Starting damage value (from constants)

2. **Lab Multipliers**:
   - Damage lab: Direct multiplier (e.g., x1.00 at level 0, increases with levels)
   - Attack Speed lab: Increases attacks per second
   - Critical Factor lab: Increases crit damage multiplier
   - Damage / Meter: Multiplier based on range
   - And more...

3. **Critical Hit Calculations**:
   ```
   Effective Crit = (1 - CritChance) × 1 + CritChance × CritFactor
   ```
   - With Super Crits:
   ```
   Effective Crit = (1 - SuperCritChance) × NormalCrit + SuperCritChance × SuperCritMulti
   ```

4. **Card Mastery Effects**:
   - Damage Mastery: +2% per level
   - Attack Speed Mastery: +2% per level
   - Critical Chance Mastery: +3% per level
   - Range Mastery: +2% per level
   - **Super Tower Mastery: Affects Super Tower Bonus calculation**
   - Ultimate Crit Mastery: +4% per level
   - Demon Mode Mastery: +1.5x per level

5. **Super Tower Bonus**:
   This is where card mastery matters!
   ```
   SuperTowerBonus = BaseSTBonus × (1 + SuperTowerMastery × MasteryMultiplier)
   ```
   **Issue**: Currently not accounting for card mastery levels

6. **Perks Multipliers**:
   - Standard Perks Bonus: Base 100%, modified by lab
   - Improve Trade-off Perks: Base 100%, modified by lab

7. **Special Abilities**:
   - Death Wave Damage Amplifier
   - Shock Multiplier
   - Missile Amplifier
   - Spotlight Missiles
   - Max Rend Armor Multiplier

---

## Implementation Strategy

### Phase 1: Data Layer ✅
1. ✅ Parse Lab_Researches.csv
2. ✅ Parse Tobi calculation sheets
3. ✅ Store in game_knowledge_base table

### Phase 2: Formula Engine (Current)
1. **Identify exact formula logic** from spreadsheet
   - Use LibreOffice/Excel to view actual cell formulas
   - Reverse engineer from values
   - Document each calculation step

2. **Create calculation modules**:
   ```javascript
   // server/services/tower-calculator/
   ├── edmg-calculator.js      // eDamage formulas
   ├── ehp-calculator.js       // eHP formulas
   ├── eecon-calculator.js     // eEcon formulas
   ├── lab-effects.js          // Lab level → multiplier mappings
   ├── card-mastery.js         // Card mastery effects
   └── constants.js            // Game constants
   ```

3. **API Endpoints**:
   ```javascript
   POST /api/calculator/edmg
   Body: {
     discord_user_id: "...",
     labs: { damage: 60, attack_speed: 0, ... },
     card_mastery: { damage: 0, attack_speed: 0, ... },
     modules: [...],
     perks: {...}
   }
   Response: {
     current_edmg: 5.275E+10,
     next_best_upgrade: { lab: "critical_factor", roi: 18381.77 },
     all_upgrades: [...]
   }
   ```

### Phase 3: Integration
1. **Update user profile**:
   - Add card_mastery fields to user_labs table
   - Track modules owned
   - Track perks configuration

2. **Chatbot integration**:
   - When user asks "what should I upgrade", call calculator
   - Use user's current labs + card mastery
   - Return personalized ROI-ranked list

3. **UI Components**:
   - Lab priority visualization
   - What-if calculator (try different upgrades)
   - Progress tracking

---

## Critical Findings

### Super Tower Bonus Issue
**Current Problem**: Super Tower Bonus doesn't account for Super Tower Mastery card.

**Solution Needed**:
1. Extract exact formula from Tobi sheet for ST Bonus
2. Identify how Super Tower Mastery (0-7 levels) affects it
3. Update calculation to include mastery:
   ```javascript
   function calculateSuperTowerBonus(stBonusLab, superTowerMastery) {
     const baseBonus = getLabMultiplier('super_tower_bonus', stBonusLab);
     const masteryBonus = superTowerMastery * MASTERY_MULTIPLIER; // Need to find this
     return baseBonus * (1 + masteryBonus);
   }
   ```

### Lab Effect Curves
Each lab has a diminishing returns curve:
- Early levels: High ROI (e.g., +12342% for first level)
- Later levels: Lower ROI (e.g., +1% for level 90)

The Tobi sheet calculates "EDMG progress / day" which is the efficiency metric.

---

## Next Steps

1. **Extract exact formulas**:
   - Open TheTowerofTobi sheets in LibreOffice Calc
   - View cell formulas (Ctrl+`)
   - Document each calculation step
   - Focus on eDamage first (most complex)

2. **Implement calculator engine**:
   - Start with simplified version
   - Add complexity incrementally
   - Test against known values from sheet

3. **Add card mastery to user profile**:
   - Database migration for card_mastery columns
   - UI for users to input mastery levels
   - Store alongside lab levels

4. **Integrate with chatbot**:
   - Call calculator when user asks about labs
   - Return personalized recommendations
   - Show ROI calculations

---

## Questions to Answer

1. What is the exact formula for each lab's multiplier at each level?
2. How does card mastery affect each stat?
3. What are the base values for all calculations?
4. How do modules factor into calculations?
5. How do different perks interact?
6. What is the "Avg Time Boost" calculation?
7. How do UWs factor in (beyond just their direct stats)?

---

## Resources Needed

- [ ] Access to actual spreadsheet formulas (not just CSV)
- [ ] Game data validation (test in actual game)
- [ ] Community feedback on accuracy
- [ ] More example scenarios to test against

---

## Success Criteria

✅ Calculator matches Tobi sheet outputs within 1%
✅ Recommendations match community best practices
✅ Users report accurate and helpful suggestions
✅ All three calculators (eDamage, eHP, eEcon) working
✅ Card mastery properly integrated
✅ Lab priority system functional
