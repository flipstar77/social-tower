# TODO: Add Detailed Damage Statistics Tracking

## Problem
Currently only capturing "Damage Dealt" (80.52D) but the game provides 12+ different damage sources that should be tracked for better analysis.

## Missing Damage Stats to Capture

### Damage Sources (all as TEXT to preserve formatting like "168.79S"):
- ✅ damage_dealt (already captured)
- ❌ projectiles_damage
- ❌ rend_armor_damage
- ❌ thorn_damage
- ❌ orb_damage
- ❌ land_mine_damage
- ❌ death_ray_damage
- ❌ smart_missile_damage
- ❌ inner_land_mine_damage
- ❌ chain_lightning_damage
- ❌ death_wave_damage
- ❌ swamp_damage
- ❌ black_hole_damage
- ❌ flame_bot_damage

### Combat Stats:
- ❌ projectiles_count
- ❌ orb_hits
- ❌ land_mines_spawned
- ❌ lifesteal

## Implementation Steps

### 1. Database Migration ✅
File created: `sql/add_detailed_damage_stats.sql`
- Run this in Supabase SQL editor to add all columns

### 2. Update Parser
File: `public/js/utils/data-parser.js`

Add these field mappings to the `parseGameStats()` method:

```javascript
// In the damage section
projectilesDamage: this.extractValue(content, 'Projectiles Damage'),
rendArmorDamage: this.extractValue(content, 'Rend Armor Damage'),
thornDamage: this.extractValue(content, 'Thorn Damage'),
orbDamage: this.extractValue(content, 'Orb Damage'),
landMineDamage: this.extractValue(content, 'Land Mine Damage'),
deathRayDamage: this.extractValue(content, 'Death Ray Damage'),
smartMissileDamage: this.extractValue(content, 'Smart Missile Damage'),
innerLandMineDamage: this.extractValue(content, 'Inner Land Mine Damage'),
chainLightningDamage: this.extractValue(content, 'Chain Lightning Damage'),
deathWaveDamage: this.extractValue(content, 'Death Wave Damage'),
swampDamage: this.extractValue(content, 'Swamp Damage'),
blackHoleDamage: this.extractValue(content, 'Black Hole Damage'),
flameBotDamage: this.extractValue(content, 'Flame bot damage'),

// Combat stats
projectilesCount: this.extractValue(content, 'Projectiles Count'),
orbHits: this.extractValue(content, 'Orb Hits'),
landMinesSpawned: this.extractValue(content, 'Land Mines Spawned'),
lifesteal: this.extractValue(content, 'Lifesteal'),
```

### 3. Update Backend Save Logic
File: `server/supabase-config.js` in the `saveTowerRun()` method

Add these fields to the database insert:

```javascript
projectiles_damage: runData.projectilesDamage,
rend_armor_damage: runData.rendArmorDamage,
thorn_damage: runData.thornDamage,
orb_damage: runData.orbDamage,
land_mine_damage: runData.landMineDamage,
death_ray_damage: runData.deathRayDamage,
smart_missile_damage: runData.smartMissileDamage,
inner_land_mine_damage: runData.innerLandMineDamage,
chain_lightning_damage: runData.chainLightningDamage,
death_wave_damage: runData.deathWaveDamage,
swamp_damage: runData.swampDamage,
black_hole_damage: runData.blackHoleDamage,
flame_bot_damage: runData.flameBotDamage,
projectiles_count: runData.projectilesCount,
orb_hits: runData.orbHits,
land_mines_spawned: runData.landMinesSpawned,
lifesteal: runData.lifesteal,
```

### 4. Update Frontend Display
File: `public/js/components/runs-display.js`

Add a new "Damage Breakdown" section to the run details modal showing all damage sources in a table or chart.

## Benefits
- See which damage source is most effective
- Compare orb damage vs projectile damage vs mines
- Optimize build based on damage distribution
- Better tournament analysis
- Track damage meta over time

## Testing
After implementation, upload a new run and verify all damage fields are captured correctly in the database.
