# TheTowerofTobi Calculator System - Comprehensive Guide

## Overview

The TheTowerofTobi Calculator is a sophisticated spreadsheet-based optimization system designed to help players of "The Tower" game determine the most efficient lab upgrades, workshop enhancements, and resource allocations. The calculator focuses on maximizing Return on Investment (RoI) across multiple game dimensions: Damage, Economy (Coins), and Health/Defense.

## System Architecture

### Core Components

The calculator consists of 8 interconnected CSV files (originally Google Sheets) that work together to provide comprehensive optimization recommendations:

1. **Master Sheet** - Central data repository
2. **Home Page** - Version control and FAQ
3. **eDamage** - Damage optimization calculations
4. **eEcon** - Economy/coins optimization calculations
5. **eHP** - Health/defense optimization calculations
6. **Consolidated RoI** - Unified view of all RoI metrics
7. **Relics** - Relic bonuses and tracking
8. **Vault** - Vault upgrade tracking and bonuses

---

## Sheet-by-Sheet Breakdown

### 1. Master Sheet (TheTowerofTobi - Master Sheet.csv)

**Purpose**: Central database for all player stats, levels, and unlocks.

**Key Sections**:

#### Labs (Column A-E)
- **Game Speed**: Lab level for game speed enhancement (Max: 7)
- **Starting Cash**: Starting currency for runs (Max: 99)
- **Workshop Discounts**: Attack, Defense, Utility discounts (Max: 99 each)
- **Labs Coin Discount**: Reduces lab upgrade costs (Max: 99)
- **Labs Speed**: Accelerates lab research time (Max: 99)
- **Core Stats Labs**:
  - Damage (Max: 100)
  - Attack Speed (Max: 99)
  - Critical Factor (Max: 99)
  - Range (Max: 80)
  - Damage/Meter (Max: 99)
  - Super Critical Chance/Multiplier
  - Max Rend Armor Multiplier (Max: 30)
  - Health (Max: 100)
  - Defense % (Max: 50)
  - Defense Absolute (Max: 100)
  - And many more...

#### Workshop (Column G-K)
- **Workshop Upgrades**: Damage, Attack Speed, Critical stats
- **Workshop Enhancements**: Unlockable multipliers for various stats
- **WS+ Levels**: Enhanced workshop upgrades with higher caps (up to 300)

#### Cards (Column M-P)
- Card levels and stars
- Card bonuses for specific attributes (Damage, Attack Speed, Health, etc.)

#### Bots (Column R-V)
- Bot unlock status and levels
- Bot attributes (Damage, Cooldown, Duration, Range)
- Types: Flame Bot, Thunder Bot, Golden Bot, Amplify Bot

#### Relics (Column X-Y)
- Relic bonuses tracked from Relics sheet
- Categories: Lab Speed, Bot Range, Damage, Ultimate Damage, etc.

#### Modules (Column AA-AE)
- Module presets (Cannon, Armor, Generator, Core)
- Substat values and rarities
- Module-specific bonuses

#### Vault Trees (Column AG-AH)
- Vault upgrade bonuses
- Categories: Damage, Attack Speed, Critical stats, Economy, Utility

**Input Requirements**:
- Current lab levels (Column C)
- Workshop levels and enhancements
- Card levels and stars
- Bot unlock status and levels
- Module configurations
- Relic ownership
- Vault progress

---

### 2. Home Page (TheTowerofTobi - Home Page.csv)

**Purpose**: Version tracking, changelog, FAQ, and usage instructions.

**Key Features**:

#### Version Control
- Current Version: v3.16.04.03
- Latest Version: v4.11.00
- Validation checks for data integrity
- Preview of missed changes between versions

#### Lab Tier List
A read-only prioritization guide highlighting labs that provide exceptional value but may not appear in calculated paths due to difficulty in quantification.

#### FAQ Section

**Q: Why are some lines crossed out in Master Sheet?**
A: Crossed lines indicate values that don't affect path calculations. This doesn't mean they're irrelevant - just that changing them won't update the optimization paths.

**Q: How to move data to next version?**
1. Create new copy of base sheet
2. Copy MasterSheet/Relics/Vault/Module Presets from old to new
3. Update underlined values on paths (non-Master Sheet values) and checkboxes

**Q: How to use the paths?**
Fill Master Sheet with:
- Lab levels (striked lines optional)
- WS/WS+ levels
- Card levels
- Module details
- Relics/Themes & Songs/Vault
- All underlined cells or checkboxes in paths

#### Important Assumptions & Limitations

**eDamage Path Assumptions**:
- **Attack Speed**: Uses custom non-precise formula to convert AS into bullets per second
- **Max Rend Mult**: Assumes all hits are at maximum rend multiplier (which they're not)
- **Shock Multiplier**: Assumes all hits at max shock multiplier (depends on attack speed)
- **SM Damage**: Cannot determine damage heatup and area effects (user must estimate)
- **Chain Thunder**: User selects maximum CL damage estimate

**eHP Path Assumptions**:
- **CF Lab**: Assumes full Chrono Field uptime
- **Chain Thunder**: User picks maximum CL damage percentage

**eEcon Path Assumptions**:
- **DW Coins**: Assumes each wave is 4s duration (e.g., 3 waves = 12s bonus)
- **General**: Average calculation without sync bonuses
- **BH Coin**: Requires user-guess percentage
- **Golden Bot**: Doesn't consider sync with UWs (actual gain may be better)

---

### 3. eDamage Sheet (TheTowerofTobi - eDamage.csv)

**Purpose**: Calculate optimal lab upgrade path to maximize effective damage per second (eDPS).

**Structure**:

#### Three Optimization Paths

1. **Damage Lab PATH (Time-focused)**
   - Optimizes for fastest damage improvements
   - Metric: EDMG progress / day
   - Shows: Lab name, Level, Duration, Progress %, Running time

2. **Damage UW PATH (Stone-focused)**
   - Optimizes for Ultimate Weapon upgrades using stones
   - Metric: EDMG progress / stone
   - Shows: UW name, Level, Cost in stones, Progress %, Total stones

3. **Damage Coin PATH (Workshop Enhancement focused)**
   - Optimizes Workshop+ upgrades using coins
   - Shows WS+ recommendations

#### Key Calculated Values

**Base Damage Calculation**:
```
Total Damage = Base Damage × (1 + Damage Labs) × (1 + Cards) × (1 + Modules) ×
               (1 + Relics) × (1 + Vault) × (1 + Perks)
```

**Effective Damage (eDMG)**:
```
eDMG = Total Damage × Bullets per Second × Critical Multiplier ×
       Special Multipliers (Rend, Shock, etc.)
```

**Critical Multiplier**:
```
Crit Mult = (1 - Crit Chance) + (Crit Chance × Crit Factor) +
            (Super Crit Chance × Super Crit Mult)
```

**Special Multipliers**:
- **Rend Armor**: Increases damage against armored enemies
- **Shock Multiplier**: From Chain Lightning upgrades
- **Damage/Meter**: Scales with tower range
- **Rapid Fire**: Burst damage multiplier
- **Bounce Shot**: Multi-target damage
- **Ultimate Weapons**: Chain Lightning, Death Wave, Smart Missiles, etc.

#### RoI Calculation
```
RoI (Time) = (New eDMG - Current eDMG) / Current eDMG / Time Required × 100%
RoI (Stone) = (New eDMG - Current eDMG) / Current eDMG / Stones Required × 100%
```

#### Inputs Required
- Current lab levels from Master Sheet
- Workshop levels and enhancements
- Card configurations
- Ultimate Weapon levels
- Module substats
- User assumptions for:
  - Attack speed effectiveness
  - Rend armor multiplier cap
  - Shock multiplier effectiveness
  - Smart Missile damage contribution

#### Curve Visualization
Shows effective value increase over next 30 upgrades to help visualize diminishing returns.

---

### 4. eEcon Sheet (TheTowerofTobi - eEcon.csv)

**Purpose**: Calculate optimal path to maximize coins per kill (CPK) and overall economy.

**Structure**:

#### Three Optimization Paths

1. **Econ Lab PATH (Time-focused)**
   - Metric: ROI / day
   - Optimizes CPK improvements over time

2. **Econ UW PATH (Stone-focused)**
   - Metric: ROI / Stone
   - Focuses on UW that boost economy

3. **Econ Coins PATH (Coin-focused)**
   - Metric: CPK progress / 100B Coins
   - Workshop+ and high-cost upgrades

#### Key Economic Stats

**Primary Stats**:
- **Coins / Kill Bonus** (Max lab: 99)
- **Golden Tower Bonus** (Max: 25) - Multiplies coins during Golden Tower
- **Golden Tower Duration** (Max: 20s)
- **Death Wave Coin Bonus** (Max: 20)
- **Black Hole Coin Bonus** (Max: 20)
- **Spotlight Coin Bonus** (Max: 20)
- **Gold Bot Cooldown/Duration**
- **Recovery Package Chance** (Max: 20)
- **Standard Perks Bonus** (Max: 25)
- **Improve Trade-off Perks** (Max: 10)
- **Coin Mastery** (Max: 9)

#### CPK Calculation
```
Base CPK = Base Coins × (1 + Coins/Kill Labs) × (1 + Cards) × (1 + Modules) ×
           (1 + Relics) × (1 + Vault) × (1 + Perks)
```

**Average CPK with Bonuses**:
```
Avg CPK = Base CPK × (1 + GT Bonus × GT Uptime) × (1 + BH Bonus × BH Uptime) ×
          (1 + DW Bonus × DW Uptime) × (1 + SL Bonus × SL Uptime) ×
          (1 + GB Bonus × GB Uptime)
```

#### Ultimate Weapon Uptimes

**Global Cooldown Calculation**:
```
Global Cooldown = Base Cooldown / (1 + Cooldown Reduction from labs/cards/modules)
```

**Uptime Percentage**:
```
Uptime = Duration / (Duration + Global Cooldown)
```

#### Key Economic Mechanics

1. **Golden Tower (GT)**
   - Provides large multiplier for duration
   - Can sync with Black Hole for compound effect

2. **Black Hole (BH)**
   - Coin bonus with user-estimated dig percentage
   - Synergizes with GT

3. **Death Wave (DW)**
   - Coin bonus for wave duration (assumes 4s per wave)

4. **Spotlight (SL)**
   - Angle and missile-based coin bonuses

5. **Golden Bot (GB)**
   - Periodic coin multiplier
   - Cooldown and duration upgrades

#### RoI Calculation
```
RoI (Time) = (New CPK - Current CPK) / Current CPK / Days Required × 100%
RoI (Stone) = (New CPK - Current CPK) / Current CPK / Stones Required × 100%
```

---

### 5. eHP Sheet (TheTowerofTobi - eHP.csv)

**Purpose**: Calculate optimal path to maximize effective health points and survivability.

**Structure**:

#### Three Optimization Paths

1. **Health Lab PATH (Time-focused)**
   - Metric: EHP progress / day

2. **Health WS+ PATH (Coin-focused)**
   - Metric: RoI / 100B Coins

3. **Regen PATH (Time-focused)**
   - Wall regeneration optimization
   - Metric: WRegen progress / day

#### Key Health Stats

**Core Stats**:
- **Health** (Max lab: 100)
- **Defense %** (Max: 50)
- **Defense Absolute** (Max: 100)
- **Wall Health** (Max: 50)
- **Wall Fortification** (Max: 60)
- **Wall Regen** (Max: 30)
- **Health Regen** (Max: 100)
- **Recovery Package Max** (Max: 18)
- **Chrono Field Reduction %** (Max: 30)
- **Death Wave Health** (Max: 30)
- **Chain Thunder** (Max: 30)

#### EHP Calculation
```
Base HP = Base Health × (1 + Health Labs) × (1 + Cards) × (1 + Modules) ×
          (1 + Relics) × (1 + Vault) × (1 + Perks)
```

**Effective HP**:
```
EHP = Base HP / (1 - Defense %) × (1 + Defense Absolute)
```

**With Wall**:
```
Total EHP = Tower EHP + Wall EHP + Wall Regen × Combat Duration
```

**Special Mechanics**:
- **Chrono Field**: Reduces incoming damage by percentage
- **Death Wave**: Adds temporary health buffer
- **Chain Thunder**: Stun/damage reduction effect
- **Recovery Packages**: Heal amount during combat

#### RoI Calculation
```
RoI (Time) = (New EHP - Current EHP) / Current EHP / Time Required × 100%
RoI (Coins) = (New EHP - Current EHP) / Current EHP / (Coins / 100B) × 100%
```

---

### 6. Consolidated RoI Sheet (TheTowerofTobi - Consolidated RoI.csv)

**Purpose**: Unified view of all RoI calculations across all optimization paths.

**Structure**:

#### Lab RoI Columns
- **Labs RoI**: Lab name
- **Level**: Current level
- **Target**: Recommended target level
- **Time RoI**: RoI percentage for next upgrade
- **Max**: Maximum level cap

#### Categories Tracked

**eDamage Labs**:
- Damage, Attack Speed, Critical Factor
- Range, Damage/Meter
- Super Crit Chance/Multi
- Shock Multiplier
- Missile Amplifier
- Spotlight Missiles
- Death Wave Damage Amplifier
- Super Tower Bonus

**eHP Labs**:
- Health, Defense %, Defense Absolute
- Wall Health, Wall Fortification
- Recovery Package Max
- Chrono Field Reduction %
- Death Wave Health
- Chain Thunder

**eWall Regen Labs**:
- Health Regen
- Wall Regen

**eEcon Labs**:
- Coins / Kill Bonus
- Recovery Package Chance
- Golden Tower Bonus/Duration
- Death Wave Coin Bonus
- Black Hole Coin Bonus
- Spotlight Coin Bonus
- Gold Bot stats

**Perks**:
- Standard Perks Bonus
- Improve Trade-off Perks

#### WS+ RoI Tracking
Separate columns for Workshop+ upgrades with coin-based RoI.

#### Master Sheet Sync
- Copy Column C from RoI sheet to Master Sheet to update all calculations
- Or copy from Master Sheet to RoI sheet to sync current state

**Note**: "SPB and ITO sum the RoI value from all paths" - Standard Perks Bonus and Improve Trade-off perks affect multiple categories.

---

### 7. Relics Sheet (TheTowerofTobi - Relics.csv)

**Purpose**: Track relic ownership and calculate total bonuses.

**Structure**:

#### Relic Categories

**Rarity Tiers**:
1. **Rare (1-Rare)**: 52 relics
   - Typical bonus: 2-3% per stat
   - Some special: 1% (e.g., Lunar Cat Paw - Crit Chance)

2. **Epic (2-Epic)**: 49 relics
   - Typical bonus: 4-5% per stat
   - Special bonuses: Attack Speed 2%, Ultimate Damage 5%, Bot Range 200%

3. **Legendary (3-Legendary)**: 11 relics
   - Bonus: 10% per stat

#### Bonus Types
- **Damage**: Direct damage multiplier
- **Lab Speed**: Reduces lab research time
- **Crit Chance**: Increases critical hit probability
- **Crit Factor**: Increases critical damage multiplier
- **Damage/Meter**: Range-based damage scaling
- **Health**: Tower health pool
- **Defense Absolute**: Flat damage reduction
- **Coins**: Economy multiplier
- **Attack Speed**: Fire rate increase
- **Ultimate Damage**: Ultimate weapon damage
- **Super Critical Chance**: Super crit probability
- **Bot Range**: Bot attack range
- **Thorns**: Reflect damage
- **Health Regen**: Regeneration rate
- **Free Upgrades**: Free attack/defense/utility upgrades

#### Unlock Conditions
- **Event Relics (84 total)**: Earn 350-700 medals in specific events
- **Tournament Relics**: Beat wave 4500 in Tiers I-XVIII
- **Badge Relics**: Finish Prestige 4 in various ranks
- **Anniversary Relics**: Play for 1-3 years

#### Total Bonuses Calculation
```
Total Bonus (Stat X) = SUM(All Owned Relics with Stat X Bonus)
```

Example from sheet:
- Lab Speed Total: 0% (no relics owned in example)
- Bot Range Total: 2m
- Damage Total: 0%

#### Tracking Status
- **Unlocked**: TRUE/FALSE for each relic
- **Total Count**: Event Relics (0/84), Non-Event (0/29), Total (0/113)

---

### 8. Vault Sheet (TheTowerofTobi - Vault.csv)

**Purpose**: Track vault tree upgrades and calculate cumulative bonuses.

**Structure**:

#### Vault Tree Paths
The vault is organized as an upgrade tree with branching paths. Keys are spent to unlock bonuses.

**Initial Upgrades** (Base tier):
- 5 keys → 5% Defense Absolute
- 10 keys → 5% Health Regen
- 15 keys → 5% Health
- And more...

**Branching Structure**:
Uses arrows (⬅, ➡, ⬇) to show upgrade dependencies and paths.

#### Bonus Categories

**Misc Bonuses**:
- Bot Range: +6m total
- Discount Enhancements: 0-15%
- Discount Rerolls: 0-12.5%

**Attack Bonuses**:
- Damage: 0-5%
- Ultimate Weapon Damage: 0-15%
- Attack Speed: 0-5%
- Critical Chance: 0-1%
- Critical Factor: 0-5%
- Damage/Meter: 0-5%
- Super Crit Chance: 0-2%
- Super Crit Mult: 0-5%
- Rend Armor Mult: 0-5%

**Defense Bonuses**:
- Health: 0-5%
- Health Regen: 0%
- Defense %: 0-0.5%
- Defense Absolute: 0-5%
- Thorn Damage: 0-5%
- Knockback Force: 0-5%
- Orb Speed: 0-5%
- Wall Rebuild: 0 to -20s

**Utility Bonuses**:
- Cash: 0-5%
- Coins/Kill: 0-5%
- Free Attack Upgrade: 0-5%
- Free Defense Upgrade: 0-5%
- Free Utility Upgrade: 0-5%
- Recovery Amount: 0-5%
- Enemy Attack Skip: 0-0.5%
- Enemy Health Skip: 0-0.5%

#### Key Economics
- **Keys Spent**: Tracked (0/630 keys in example)
- **Total Available**: 630 keys to fully unlock all paths

#### Unlock Status
- **U Column**: TRUE/FALSE for each upgrade
- **Value**: Bonus amount when unlocked
- **Bonus Type**: Category of bonus

---

## How to Use the Calculator

### Step 1: Initial Setup

1. **Fill Master Sheet**:
   - Enter all current lab levels in Column C
   - Mark Workshop levels (¢ Level and $ Level)
   - Check Workshop Enhancement status (WS+)
   - Input Ultimate Weapon levels and unlock status
   - Enter Card levels and stars
   - Mark Bot unlock status and levels
   - Configure Module presets
   - Update Relic ownership in Relics sheet
   - Track Vault progress in Vault sheet

2. **Verify Data**:
   - Check "Validation Check" on Home Page (should show TRUE)
   - Ensure no #REF! errors

### Step 2: Choose Your Optimization Focus

**For Pushing Waves (Damage Focus)**:
- Open eDamage sheet
- Check "Damage Lab PATH" for time-efficient upgrades
- Use "Damage UW PATH" if you have excess stones
- Use "Damage Coin PATH" for WS+ recommendations

**For Economy (Coin Focus)**:
- Open eEcon sheet
- Follow "Econ Lab PATH" for CPK improvements
- Use "Econ UW PATH" for stone-based economy UWs
- Use "Econ Coins PATH" for high-value WS+ upgrades

**For Survivability (Health Focus)**:
- Open eHP sheet
- Follow "Health Lab PATH" for defense improvements
- Use "Health WS+ PATH" for coin-based health upgrades
- Check "Regen PATH" if using wall strategies

**For Balanced View**:
- Use Consolidated RoI sheet
- Sort by "Time RoI" column to see best overall upgrades

### Step 3: Read the Paths

Each path shows:
- **Lab/UW Name**: What to upgrade
- **Level**: Current level → Next level
- **Duration/Cost**: Time or resources required
- **RoI %**: Return on investment percentage
- **Running Time**: Cumulative time from start
- **After Upgrade**: Predicted stat after upgrade

**Path Reading Example** (from eEcon):
```
Coins / Kill Bonus, lvl 1, 0d 0h 0m, 12342.857%, 40, 0d 0h 0m
```
Means:
- Upgrade "Coins/Kill Bonus" from current to level 1
- Takes 0 days (instant)
- 12,342% RoI (extremely high)
- CPK after: 40
- Total running time: 0

### Step 4: Make Adjustments

**User-Specific Guesses** (underlined in paths):
- **Attack Speed Effectiveness**: Estimate bullets/second conversion
- **Rend Armor Multiplier**: Estimate realistic max multiplier
- **Shock Multiplier**: Estimate average shock level
- **Smart Missile Damage**: Estimate area coverage
- **Black Hole Dig %**: Estimate coin collection percentage
- **Chain Thunder Damage**: Pick max CL damage estimate
- **Wave Duration**: For Death Wave coin calculations

**Toggles**:
- Hide non-UW labs (eDamage)
- Include/exclude specific UWs
- Enable/disable wall calculations (eHP)
- Sync UW cooldowns (eEcon)

### Step 5: Execute Upgrades

1. Start from top of recommended path
2. Upgrade labs/UWs in order shown
3. Update Master Sheet as you progress
4. Paths will automatically recalculate
5. Continue down the list

### Step 6: Sync and Update

**To Update Consolidated RoI from Master Sheet**:
- Copy Column C from Master Sheet
- Paste into Column C of Consolidated RoI

**To Update Master Sheet from Consolidated RoI**:
- Copy Column C from Consolidated RoI
- Paste into Column C of Master Sheet

**To Update Targets**:
- Copy Column U from Consolidated RoI
- Paste into Column M of Master Sheet

---

## Calculation Methodology

### Return on Investment (RoI) Formula

The core of the calculator is the RoI calculation, which determines upgrade priority.

**Time-Based RoI**:
```
RoI_time = ((New_Value - Current_Value) / Current_Value) / Time_Required × 100%
```

**Resource-Based RoI**:
```
RoI_resource = ((New_Value - Current_Value) / Current_Value) / Resource_Cost × 100%
```

Where:
- **New_Value**: Predicted effective stat after upgrade
- **Current_Value**: Current effective stat
- **Time_Required**: Research time in days (or hours/minutes)
- **Resource_Cost**: Stones, coins, or other resources

**Daily Progress**:
```
Progress_per_day = RoI_time × 100%
```

### Effective Value Calculations

**Effective Damage (eDMG)**:
```
eDMG = Base_Damage × Damage_Multipliers × Attack_Rate ×
       Critical_Multiplier × Special_Multipliers
```

**Effective Coins Per Kill (eCPK)**:
```
eCPK = Base_CPK × Multipliers × UW_Bonus_Uptimes
```

**Effective Health (eHP)**:
```
eHP = (Tower_HP + Wall_HP) / (1 - Defense_%) × (1 + Defense_Absolute) ×
      (1 - Chrono_Field_Reduction)
```

### Multiplicative Stacking

Most bonuses in The Tower stack multiplicatively:

```
Total_Multiplier = (1 + Lab_Bonus) × (1 + Card_Bonus) × (1 + Module_Bonus) ×
                   (1 + Relic_Bonus) × (1 + Vault_Bonus) × (1 + Perk_Bonus)
```

**Example**:
- Lab Damage: +100% (×2.0)
- Card Damage: +50% (×1.5)
- Module Damage: +30% (×1.3)
- Relic Damage: +10% (×1.1)

Total: 2.0 × 1.5 × 1.3 × 1.1 = ×4.29 (329% increase)

### Diminishing Returns

The calculator automatically accounts for diminishing returns through the RoI formula:

```
Marginal_Benefit = (New_Total - Current_Total) / Current_Total
```

As stats increase, each additional upgrade provides smaller percentage gains, naturally lowering RoI and pushing those upgrades down the priority list.

### Curve Visualization

The "Curve represent the effective value increase in the next 30 upgrades" shows:
- Steep curves = high marginal returns
- Flat curves = diminishing returns
- Helps visualize when to stop investing in a stat

---

## Advanced Features

### Module Substats Planner

Available in eDamage and eEcon sheets.

**Purpose**: Compare different module substat configurations to find optimal build.

**How it Works**:
1. Input different module substat values
2. Calculator shows percentage impact on total damage/economy
3. Bold highlights the largest % gain
4. Helps decide which modules to prioritize farming

### Ultimate Weapon Sync

**What**: Keeps certain UW cooldowns synchronized for optimal comboing.

**Example**: Golden Tower + Black Hole sync
- Both use 190s cooldown
- Both active simultaneously
- Multiply coin bonuses together
- Much higher RoI than separate upgrades

**Cooldown Calculation**:
```
Global_Cooldown = Base_CD / (1 + CD_Reduction_Labs + CD_Reduction_Cards +
                             CD_Reduction_Modules)
```

### Card Mastery Integration

**Mastery Labs**: Special labs that unlock at high waves requiring specific cards.

**Types**:
- Damage Mastery (requires Damage cards)
- Attack Speed Mastery
- Health Mastery
- Coins Mastery
- And 32 total mastery types (Max level: 9 each)

**Calculation**:
- Mastery RoI calculated only if required cards are owned
- Otherwise hidden from paths

### Workshop+ (WS+) System

**Enhancement Bonuses**:
- WS+ levels go up to 300 (vs regular workshop max ~100)
- Require significant coin investment
- Discount enhancements from Vault reduce costs
- Separate RoI paths for coin-based upgrades

### Perk Optimization

**Standard Perks Bonus** (Max: 25):
- Increases effect of regular perks by %

**Improve Trade-off Perks** (Max: 10):
- Makes trade-off perks less punishing

**Auto Pick Settings**:
- Auto Pick Perks toggle
- Perk option quantity
- Ban certain perks
- Auto pick ranking

### Event & Tournament Integration

**Relics**:
- Track event participation through relic collection
- Each event has 2-3 relics (Rare/Epic/Legendary)
- Tournament tiers have dedicated relics

**Themes & Songs**:
- Separate tracking (mentioned in Home Page)
- Additional bonuses not included in base calculations

---

## Optimization Strategies

### Early Game (Waves 1-1000)

**Priority Order**:
1. **Coins/Kill Bonus** - Economy foundation
2. **Damage** - Wave pushing
3. **Attack Speed** - DPS scaling
4. **Health** - Survival
5. **Critical Factor** - Damage multiplier

**Focus**: Time-based RoI paths (Lab PATH)

### Mid Game (Waves 1000-3000)

**Priority Order**:
1. **Ultimate Weapons** - Game changers
2. **Workshop Enhancements** - Unlock multipliers
3. **Golden Tower + Black Hole** - Economy boost
4. **Critical Chance** - Consistent damage
5. **Defense %** - Survivability scaling

**Focus**: Balance Lab PATH and UW PATH

### Late Game (Waves 3000-4500)

**Priority Order**:
1. **Sync UWs** - Combo optimizations
2. **Mastery Labs** - High-level scaling
3. **Workshop+** - Extreme stat boosts
4. **Module Optimization** - Min-maxing
5. **Vault Completion** - All bonuses unlocked

**Focus**: Coins PATH and UW PATH, strategic min-maxing

### End Game (Waves 4500+)

**Priority Order**:
1. **Tournament Optimization** - Specific builds per tier
2. **Relic Collection** - Complete event participation
3. **Perfect Module Builds** - Mythic substats
4. **Max WS+** - Level 300 workshops
5. **Balanced Stats** - No weak points

**Focus**: Consolidated RoI for balanced progression

---

## Common Pitfalls & Tips

### Pitfalls to Avoid

1. **Blindly Following Paths Without User Guesses**
   - Attack speed, rend mult, shock mult require realistic estimates
   - Overestimating leads to wrong priorities

2. **Ignoring Lab Tier List**
   - Some labs provide value not captured in calculations
   - Check Home Page tier list regularly

3. **Not Updating Master Sheet**
   - Paths only accurate if Master Sheet is current
   - Update after every session

4. **Focusing Only One Dimension**
   - Pure damage → can't survive
   - Pure economy → can't push waves
   - Pure health → too slow progression
   - Need balance across eDMG, eEcon, eHP

5. **Forgetting Relic/Vault Updates**
   - Easy to forget these sheets
   - Can significantly change RoI calculations

6. **Ignoring Diminishing Returns Curves**
   - Flat curves = stop investing
   - Diversify to stats with steep curves

### Pro Tips

1. **Use Consolidated RoI for Quick Decisions**
   - Fastest way to see top priorities
   - Good for daily upgrade choices

2. **Plan UW Stone Spending**
   - Stones are scarce
   - Use UW PATH to maximize efficiency
   - Prioritize sync UWs

3. **Time Labs During Events**
   - Lab speed bonuses during events
   - Plan long research during speed events

4. **Module Substat Planning**
   - Use planner to determine best substats
   - Focus farming on high-RoI substats

5. **Perk Synergies**
   - Some perks multiply effectiveness
   - Standard Perks Bonus amplifies all perks
   - Invest early

6. **Golden Bot + Golden Tower Sync**
   - Massive coin multiplication
   - Priority for economy focus

7. **Recovery Packages for Pushing**
   - Recovery Chance + Max Amount
   - Critical for difficult wave pushes

8. **Wall Strategies**
   - Wall Health + Fortification + Regen
   - Good for idle play
   - Check Regen PATH

---

## Formulas Reference

### Core Formulas

**Time RoI**:
```
RoI% = [(New_Value - Old_Value) / Old_Value] / Time_Days × 100
```

**Stone RoI**:
```
RoI% = [(New_Value - Old_Value) / Old_Value] / Stone_Cost × 100
```

**Coin RoI**:
```
RoI% = [(New_Value - Old_Value) / Old_Value] / (Coins / 100B) × 100
```

**Effective Damage**:
```
eDMG = Damage × BPS × Crit_Mult × Rend × Shock × DpM × RF × BS × UW
```
Where:
- BPS = Bullets per second (custom formula from attack speed)
- Crit_Mult = Critical damage multiplier
- Rend = Rend armor multiplier
- Shock = Shock multiplier from Chain Lightning
- DpM = Damage per meter bonus
- RF = Rapid fire multiplier
- BS = Bounce shot multiplier
- UW = Ultimate weapon damage

**Critical Multiplier**:
```
Crit_Mult = (1 - CC - SCC) + (CC × CF) + (SCC × SCM)
```
Where:
- CC = Critical chance (capped at 100%)
- CF = Critical factor
- SCC = Super critical chance
- SCM = Super critical multiplier

**Effective CPK**:
```
eCPK = Base_CPK × CPK_Mult × GT_Bonus × BH_Bonus × DW_Bonus × SL_Bonus × GB_Bonus
```

**UW Uptime**:
```
Uptime = Duration / (Duration + Global_Cooldown)
```

**Global Cooldown**:
```
GC = Base_CD / (1 + Sum_Of_CD_Reductions)
```

**Effective HP**:
```
eHP = [Base_HP / (1 - Def%)] × (1 + Def_Abs) × (1 - CF_Reduction)
```

**Total EHP with Wall**:
```
Total_EHP = Tower_eHP + Wall_eHP + (Wall_Regen × Combat_Duration)
```

---

## Troubleshooting

### #REF! Errors
- **Cause**: Copied data incorrectly or deleted critical cells
- **Fix**: Re-copy from base sheet or restore from backup

### DIV/0 Errors
- **Cause**: Zero values in divisor (e.g., attack speed at 0)
- **Fix**: Ensure all base stats have non-zero values

### Validation Check FALSE
- **Cause**: Master Sheet data inconsistent
- **Fix**: Check for:
  - Levels exceeding max caps
  - Missing card levels (should be 1 minimum)
  - UW marked unlocked but level 0

### Negative RoI
- **Cause**: Usually calculation edge case or toggle issue
- **Fix**:
  - Check if UW/feature actually unlocked
  - Verify user guess inputs are reasonable
  - May indicate that upgrade is not beneficial

### Paths Not Updating
- **Cause**: Master Sheet not linked correctly
- **Fix**: Verify cell references point to Master Sheet

### Extremely High RoI (>10,000%)
- **Cause**: First level of critical stat
- **Not an Error**: Early upgrades have massive returns

---

## Version History Highlights

- **v4.11.00**: Latest official version
- **v3.16.04.03**: Current sheet version (user may be behind)
- **v3.16**: Golden Tower + Black Hole sync features
- **v3.14**: Module presets added
- **v3.13**: Mastery labs integrated
- **v3.11**: Coins mastery path
- **v3.10**: UW Critical cards
- **v3.08**: Mastery lab unlocks
- **v3.00**: Workshop+ (WS+) system
- **v2.3**: Recovery packages and Golden Combo
- **v2.2**: Economic sync UWs
- **v2.0**: eEcon path introduction
- **v1.0**: Initial public release

---

## Credits

Created by the community with major contributions from:
- **TheTowerofTobi**: Main creator
- **1410c**: Base eHP sheet and styling
- **Andy**: Styling
- **Audacious**: Consolidated RoI sheet
- **QuietFanta**: WS+ integration
- **Đ4ЯK3И5TØИ3, Keizhac, IGotSlain, zAlpha, Nykola, Phil, Shiriru94, Solaaar**: Testing and feedback
- **Boromir**: Persistent feature requests
- **Eyethberg**: Auto patch checking script

---

## Quick Start Checklist

- [ ] Download/copy TheTowerofTobi calculator
- [ ] Fill Master Sheet with all current stats
- [ ] Update Relics sheet with owned relics
- [ ] Update Vault sheet with unlocked upgrades
- [ ] Configure Module presets
- [ ] Choose optimization focus (damage/economy/health)
- [ ] Open relevant sheet (eDamage/eEcon/eHP)
- [ ] Fill user-specific guess values (underlined cells)
- [ ] Check Validation = TRUE on Home Page
- [ ] Review Lab PATH for time-based priorities
- [ ] Review UW PATH for stone-based priorities
- [ ] Review Coin PATH for workshop+ priorities
- [ ] Use Consolidated RoI for overall view
- [ ] Execute top 3-5 recommended upgrades
- [ ] Update Master Sheet after upgrades
- [ ] Repeat!

---

## Glossary

- **eDMG**: Effective Damage (damage per second accounting for all multipliers)
- **eCPK**: Effective Coins Per Kill (average coins accounting for bonuses)
- **eHP**: Effective Health Points (survivability accounting for defense)
- **RoI**: Return on Investment (percentage benefit per resource spent)
- **WS**: Workshop
- **WS+**: Workshop Enhancement/Plus
- **UW**: Ultimate Weapon
- **UW+**: Ultimate Weapon Enhancement
- **GT**: Golden Tower
- **BH**: Black Hole
- **DW**: Death Wave
- **SL**: Spotlight
- **CL**: Chain Lightning
- **SM**: Smart Missiles
- **CF**: Critical Factor (or Chrono Field depending on context)
- **CC**: Critical Chance
- **SCC**: Super Critical Chance
- **SCM**: Super Critical Multiplier
- **DpM**: Damage per Meter
- **CPK**: Coins Per Kill
- **GC**: Global Cooldown
- **RF**: Rapid Fire
- **BS**: Bounce Shot
- **Def%**: Defense Percentage
- **Def Abs**: Defense Absolute
- **HP**: Health Points
- **BPS**: Bullets Per Second
- **AS**: Attack Speed
- **PKG**: Package (Recovery Package)
- **SPB**: Standard Perks Bonus
- **ITO**: Improve Trade-off Perks
- **Mast**: Mastery (labs)

---

## Additional Resources

- **Discord Channel**: Community support and discussions (linked in Home Page)
- **Base Copy URL**: Get fresh calculator copy (on Home Page)
- **Version Check**: Auto-checks for updates (v3.06+)
- **FAQ**: Home Page has detailed answers
- **Lab Tier List**: Read-only priorities on Home Page

---

*This guide covers version 3.16.04.03 of TheTowerofTobi Calculator. Always check Home Page for latest version and changelog.*
