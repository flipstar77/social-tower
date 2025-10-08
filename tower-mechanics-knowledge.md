# The Tower Game - Damage Mechanics & Lab Optimization Guide

## Core Damage Formula

The Tower Game calculates damage using this formula:

```
Total Damage = Base Damage × (1 + Crit Factor × Crit Chance) × (1 + SuperCrit Multiplier × Crit Chance × SuperCrit Chance)
```

### Formula Components:

- **Base Damage**: Your tower's raw damage stat
- **Crit Factor (CF)**: Multiplies critical hit damage
- **Crit Chance (CC)**: Percentage chance for critical hits (0-100%)
- **SuperCrit Multiplier (SCM)**: Additional multiplier for super-critical hits
- **SuperCrit Chance (SCC)**: Percentage of crits that become super-crits (0-100%)

## Lab Upgrade Efficiency Rankings

Based on improvement-per-time-invested calculations, here are the optimal lab upgrade priorities:

### 1. **SuperTower** - 13.38% improvement per day
- **Priority**: MAXIMUM (highest efficiency by far)
- **Effect**: 1.00% improvement per level
- **Time**: 1 hour 47 minutes per level
- **Note**: This should ALWAYS be your first priority when available

### 2. **DP(10)m (Damage Per Minute at 10 meters)** - 1.25% improvement per day
- **Priority**: Very High
- **Effect**: 0.86% improvement per level
- **Time**: 16 hours 36 minutes per level
- **Effect on bullets**: Improves sustained DPS

### 3. **Crit Factor** - 1.24% improvement per day
- **Priority**: Very High
- **Effect**: 1.32% improvement for bullets, 1.29% for UWs
- **Time**: 25 hours 27 minutes per level
- **Synergy**: Works multiplicatively with Crit Chance

### 4. **SuperCrit Multiplier** - 0.79% improvement per day
- **Priority**: High
- **Effect**: 1.29% improvement for bullets, 1.21% for UWs
- **Time**: 39 hours 22 minutes per level
- **Synergy**: Only affects hits that are already crits with super-crit chance

### 5. **Damage** - 0.71% improvement per day
- **Priority**: Medium
- **Effect**: 1.16% improvement per level
- **Time**: 39 hours 7 minutes per level
- **Note**: Linear scaling, no synergies

### 6. **SuperCrit Chance** - 0.38% improvement per day
- **Priority**: Lower (but still valuable)
- **Effect**: 0.32% improvement per level
- **Time**: 20 hours 7 minutes per level
- **Note**: Only valuable when you have high SuperCrit Multiplier

## Workshop Enhancement Factors

Workshop enhancements multiply your lab bonuses by a factor (typically 1.20):

- **Damage Enhancement**: 1.20× multiplier
- **Crit Factor Enhancement**: 1.20× multiplier
- **SuperCrit Multiplier Enhancement**: 1.00× multiplier
- **DPM Enhancement**: 1.00× multiplier

## Damage Type Weights (Typical Build)

Based on actual gameplay data:
- **Regular hits**: 8% of total damage
- **Critical hits**: 69% of total damage
- **SuperCrit hits**: 23% of total damage

This shows that **critical hits are by far the most important damage source**, making Crit Factor and Crit Chance extremely valuable.

## Optimization Strategy

### Early Game (Tiers 1-10):
1. Max SuperTower ASAP
2. Balance Damage + Crit Factor equally
3. Get Crit Chance to ~80%+
4. Ignore SuperCrit stats until mid-game

### Mid Game (Tiers 11-18):
1. Keep SuperTower maxed
2. Focus on Crit Factor (highest time efficiency)
3. Boost DP(10)m for sustained DPS
4. Start investing in SuperCrit Multiplier
5. Get SuperCrit Chance to ~20%+

### Late Game (Tier 18+):
1. SuperTower remains priority #1
2. Balance Crit Factor and DP(10)m
3. Max SuperCrit Multiplier (synergizes with high crit chance)
4. SuperCrit Chance becomes valuable
5. Raw Damage last (lowest efficiency)

## Important Notes

- **SuperTower (ST) and DPM do NOT affect Ultimate Weapon damage**
- UWs (Ultimate Weapons) only benefit from: Damage, Crit Factor, SuperCrit Multiplier, SuperCrit Chance
- Standard Perk Bonus (SPB) multiplies all damage by 25% base + 1% per level
- Relics provide multiplicative bonuses (e.g., 1.72× for Damage, 1.90× for Crit Factor)

## Formula for Scale Factor

```
Scale Factor = Workshop Level × Enhancement Factor × Lab Multiplier × Relic Multiplier × SPB Multiplier
```

Example calculation:
- Workshop: 6000 damage
- Enhancement: 1.20×
- Lab: 1.72×
- Relic: 125% (1.25×)
- Result: 275.10 scale factor

## Key Takeaway

**Time efficiency matters more than raw improvement percentage.**

A 1% improvement that takes 2 hours is better than a 2% improvement that takes 40 hours!

Always prioritize:
1. SuperTower (by far the best)
2. Labs with best improvement/time ratio
3. Synergistic stats (Crit Factor + Crit Chance work together)
