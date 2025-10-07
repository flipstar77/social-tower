require('dotenv').config({ path: __dirname + '/server/.env' });
const SupabaseManager = require('./server/supabase-config');
const sb = new SupabaseManager();

async function checkRuns() {
    const { data, error } = await sb.supabase
        .from('tower_runs')
        .select('*')
        .eq('discord_username', 'mrflipstar')
        .order('submitted_at', { ascending: false });

    if (error) {
        console.error('Error:', error);
        process.exit(1);
    }

    console.log('Total runs for mrflipstar:', data.length);
    console.log('');

    data.forEach((run, i) => {
        console.log(`${i+1}. T${run.tier} W${run.wave} - ${new Date(run.submitted_at).toLocaleString()}`);
        console.log(`   ID: ${run.id}`);
        console.log(`   Coins: ${run.coins_earned}`);
        console.log('');
    });

    process.exit(0);
}

checkRuns();
