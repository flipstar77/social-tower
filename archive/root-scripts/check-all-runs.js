require('dotenv').config({ path: __dirname + '/server/.env' });
const SupabaseManager = require('./server/supabase-config');
const sb = new SupabaseManager();

async function checkRuns() {
    // Get all runs
    const { data, error } = await sb.supabase
        .from('tower_runs')
        .select('*')
        .order('submitted_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error:', error);
        process.exit(1);
    }

    console.log('Total runs (last 20):', data.length);
    console.log('');

    data.forEach((run, i) => {
        console.log(`${i+1}. T${run.tier} W${run.wave}`);
        console.log(`   User ID: ${run.discord_user_id}`);
        console.log(`   Submitted: ${new Date(run.submitted_at).toLocaleString()}`);
        console.log(`   ID: ${run.id}`);
        console.log('');
    });

    process.exit(0);
}

checkRuns();
