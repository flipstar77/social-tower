require('dotenv').config({ path: __dirname + '/server/.env' });
const SupabaseManager = require('./server/supabase-config');
const sb = new SupabaseManager();

async function deleteT18() {
    // Find the T18 run
    const { data: runs } = await sb.supabase
        .from('tower_runs')
        .select('*')
        .eq('tier', '18')
        .eq('wave', '8199');

    if (runs.length === 0) {
        console.log('❌ T18 W8199 run not found');
        process.exit(0);
    }

    console.log(`Found T18 run: ID ${runs[0].id}`);
    console.log(`Submitted: ${runs[0].submitted_at}`);
    console.log('');

    // Delete it
    const { error } = await sb.supabase
        .from('tower_runs')
        .delete()
        .eq('id', runs[0].id);

    if (error) {
        console.error('Error deleting:', error);
    } else {
        console.log('✅ Deleted T18 W8199 run');
    }

    process.exit(0);
}

deleteT18();
