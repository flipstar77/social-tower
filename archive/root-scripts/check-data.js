require('dotenv').config({ path: __dirname + '/server/.env' });
const SupabaseManager = require('./server/supabase-config');
const sb = new SupabaseManager();

async function check() {
    const { data } = await sb.supabase.from('tournament_brackets').select('bracket_id');
    const unique = [...new Set(data.map(d => d.bracket_id))];
    console.log('Total brackets:', unique.length);
    console.log('Bracket IDs:', unique.join('\n'));

    const player = await sb.supabase.from('tournament_brackets').select('*').eq('player_id', '188EAC641A3EBC7A');
    console.log('\n🎯 Your player found:', player.data.length > 0 ? 'YES ✅' : 'NO ❌');
    if(player.data.length > 0) {
        console.log(JSON.stringify(player.data[0], null, 2));
    }

    process.exit(0);
}

check();
