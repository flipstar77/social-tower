/**
 * Debug Auth - Check if authentication is working
 * This will print diagnostic information to the console
 */

(function() {
    console.log('🔍 AUTH DEBUG STARTED');
    console.log('========================');

    // Check 1: Is cache service initialized?
    if (window.cacheService) {
        console.log('✅ CacheService is available');
        console.log('   User ID Prefix:', window.cacheService.userIdPrefix || 'NOT SET (BAD!)');
    } else {
        console.log('❌ CacheService NOT FOUND');
    }

    // Check 2: Is Supabase client available?
    if (window.supabaseClient) {
        console.log('✅ Supabase client is available');

        // Try to get session
        window.supabaseClient.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                console.log('✅ Session exists');
                console.log('   User ID:', session.user.id);
                console.log('   Provider ID:', session.user.user_metadata?.provider_id);
                console.log('   Access Token:', session.access_token ? 'Present' : 'MISSING');
            } else {
                console.log('❌ No active session');
            }
        });
    } else {
        console.log('❌ Supabase client NOT FOUND');
    }

    // Check 3: Is discord auth available?
    if (window.discordAuth) {
        console.log('✅ Discord auth is available');
        console.log('   Is Authenticated:', window.discordAuth.isAuthenticated);
        console.log('   User:', window.discordAuth.user ? 'Present' : 'None');
    } else {
        console.log('❌ Discord auth NOT FOUND');
    }

    // Check 4: Check localStorage keys
    const keys = Object.keys(localStorage);
    console.log(`📦 LocalStorage has ${keys.length} items`);
    const towerKeys = keys.filter(k => k.includes('tower') || k.includes('user_'));
    if (towerKeys.length > 0) {
        console.log('   Tower-related keys:');
        towerKeys.forEach(key => console.log('   -', key));
    }

    // Check 5: Try to fetch data and check headers
    setTimeout(() => {
        console.log('\n🔍 Testing API call with auth headers...');

        const apiBase = window.API_CONFIG ? window.API_CONFIG.getBaseUrl() + '/api/tower' : '/api/tower';

        // Get headers
        let headers = { 'Content-Type': 'application/json' };
        if (window.supabaseClient) {
            window.supabaseClient.auth.getSession().then(({ data: { session } }) => {
                if (session?.access_token) {
                    headers['Authorization'] = `Bearer ${session.access_token}`;
                    console.log('✅ Authorization header will be sent');
                } else {
                    console.log('❌ NO Authorization header (session missing)');
                }

                console.log('   Headers:', Object.keys(headers));

                // Make test request
                fetch(`${apiBase}/runs?limit=1`, { headers })
                    .then(res => res.json())
                    .then(data => {
                        console.log('📥 API Response:', data);
                        console.log('   Runs count:', data.runs?.length || 0);
                    })
                    .catch(err => {
                        console.error('❌ API Error:', err);
                    });
            });
        }
    }, 2000);

    console.log('========================');
    console.log('🔍 AUTH DEBUG COMPLETE (check above)');
})();
