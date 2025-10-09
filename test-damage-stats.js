require('dotenv').config();
const SupabaseManager = require('./server/supabase-config');

(async () => {
  const supabase = new SupabaseManager();
  const { data, error } = await supabase.supabase
    .from('tower_runs')
    .select('id, tier, wave, projectiles_damage, rend_armor_damage, thorn_damage, orb_damage, land_mine_damage, death_ray_damage, smart_missile_damage, inner_land_mine_damage, chain_lightning_damage, death_wave_damage, swamp_damage, black_hole_damage, flame_bot_damage, projectiles_count, orb_hits, land_mines_spawned, lifesteal')
    .order('submitted_at', { ascending: false })
    .limit(1);

  if (error) {
    console.log('Error:', error.message);
  } else {
    console.log('✅ All 17 damage statistics from recent run:\n');
    data.forEach(run => {
      console.log(`Run ${run.id} (T${run.tier}W${run.wave}):\n`);
      console.log('DAMAGE SOURCES:');
      console.log('  Projectiles:', run.projectiles_damage || 'NULL');
      console.log('  Rend Armor:', run.rend_armor_damage || 'NULL');
      console.log('  Thorn:', run.thorn_damage || 'NULL');
      console.log('  Orb:', run.orb_damage || 'NULL');
      console.log('  Land Mine:', run.land_mine_damage || 'NULL');
      console.log('  Death Ray:', run.death_ray_damage || 'NULL');
      console.log('  Smart Missile:', run.smart_missile_damage || 'NULL');
      console.log('  Inner Land Mine:', run.inner_land_mine_damage || 'NULL');
      console.log('  Chain Lightning:', run.chain_lightning_damage || 'NULL');
      console.log('  Death Wave:', run.death_wave_damage || 'NULL');
      console.log('  Swamp:', run.swamp_damage || 'NULL');
      console.log('  Black Hole:', run.black_hole_damage || 'NULL');
      console.log('  Flame Bot:', run.flame_bot_damage || 'NULL');
      console.log('\nCOUNTS & STATS:');
      console.log('  Projectiles Count:', run.projectiles_count || 'NULL');
      console.log('  Orb Hits:', run.orb_hits || 'NULL');
      console.log('  Land Mines Spawned:', run.land_mines_spawned || 'NULL');
      console.log('  Lifesteal:', run.lifesteal || 'NULL');
      console.log('');
    });
  }
  process.exit(0);
})();
