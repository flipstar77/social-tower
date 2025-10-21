/**
 * IMMEDIATE Auth Check - Run this in console to see what's happening
 */

console.log('🔍 CHECKING AUTH STATUS NOW');
console.log('='.repeat(70));

// 1. Check localStorage for Supabase session
console.log('\n1️⃣ Checking localStorage for Supabase session...');
const allKeys = Object.keys(localStorage);
console.log(`Total localStorage items: ${allKeys.length}`);

const supabaseKeys = allKeys.filter(k => k.includes('sb-') || k.includes('supabase'));
console.log(`Supabase-related keys:`, supabaseKeys);

const authTokenKey = allKeys.find(k => k.startsWith('sb-') && k.includes('auth-token'));
if (authTokenKey) {
    console.log(`✅ Found auth token key: ${authTokenKey}`);
    try {
        const sessionData = JSON.parse(localStorage.getItem(authTokenKey));
        console.log('Session data structure:', {
            hasAccessToken: !!sessionData?.access_token,
            hasUser: !!sessionData?.user,
            userId: sessionData?.user?.id,
            providerId: sessionData?.user?.user_metadata?.provider_id,
            expiresAt: sessionData?.expires_at ? new Date(sessionData.expires_at * 1000).toLocaleString() : 'unknown'
        });

        if (sessionData?.access_token) {
            console.log('✅ Access token exists, length:', sessionData.access_token.length);
        } else {
            console.log('❌ NO ACCESS TOKEN!');
        }
    } catch (e) {
        console.error('❌ Error parsing session:', e);
    }
} else {
    console.log('❌ No Supabase auth token found in localStorage!');
}

// 2. Check window.supabaseClient
console.log('\n2️⃣ Checking window.supabaseClient...');
if (window.supabaseClient) {
    console.log('✅ window.supabaseClient exists');

    // Try to get session using the v2 API
    window.supabaseClient.auth.getSession().then(({ data, error }) => {
        console.log('\nGetSession result:');
        if (error) {
            console.error('❌ Error:', error);
        } else if (data?.session) {
            console.log('✅ Session from getSession():', {
                userId: data.session.user?.id,
                providerId: data.session.user?.user_metadata?.provider_id,
                hasToken: !!data.session.access_token,
                tokenLength: data.session.access_token?.length
            });
        } else {
            console.log('❌ No session from getSession()');
        }
    });
} else {
    console.log('❌ window.supabaseClient NOT FOUND');
}

// 3. Make a test API call and log everything
console.log('\n3️⃣ Making test API call...');
const apiBase = '/api/tower';

// Manually build headers like the fixed code does
const headers = { 'Content-Type': 'application/json' };
const authKeys = Object.keys(localStorage).filter(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
if (authKeys.length > 0) {
    try {
        const sessionData = JSON.parse(localStorage.getItem(authKeys[0]));
        if (sessionData?.access_token) {
            headers['Authorization'] = `Bearer ${sessionData.access_token}`;
            console.log('✅ Added Authorization header to request');
            console.log('   Token preview:', sessionData.access_token.substring(0, 50) + '...');
        }
    } catch (e) {
        console.error('❌ Error building headers:', e);
    }
}

console.log('Request headers:', Object.keys(headers));

fetch(`${apiBase}/runs?limit=5`, { headers })
    .then(async response => {
        console.log('\n4️⃣ API Response:');
        console.log('Status:', response.status, response.statusText);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const text = await response.text();
            console.error('❌ Response body:', text);
            return null;
        }

        return response.json();
    })
    .then(data => {
        if (data) {
            console.log('\n5️⃣ Response data:');
            console.log('Success:', data.success);
            console.log('Run count:', data.runs?.length || 0);

            if (data.runs && data.runs.length > 0) {
                console.log('\nFirst run details:');
                console.log('  - ID:', data.runs[0].id);
                console.log('  - discord_user_id:', data.runs[0].discord_user_id);
                console.log('  - Tier/Wave:', `${data.runs[0].tier}/${data.runs[0].wave}`);

                // Check all unique user IDs
                const uniqueUserIds = [...new Set(data.runs.map(r => r.discord_user_id))];
                console.log('\nUnique discord_user_ids in response:', uniqueUserIds);

                // Get current user ID
                if (authKeys.length > 0) {
                    const sessionData = JSON.parse(localStorage.getItem(authKeys[0]));
                    const currentUserId = sessionData?.user?.user_metadata?.provider_id || sessionData?.user?.id;
                    console.log('Current logged-in user ID:', currentUserId);

                    if (uniqueUserIds.length === 1 && uniqueUserIds[0] === currentUserId) {
                        console.log('✅✅✅ CORRECT! All runs belong to current user');
                    } else {
                        console.log('❌❌❌ WRONG! Runs belong to different user(s)');
                        console.log('Expected user ID:', currentUserId);
                        console.log('Got user IDs:', uniqueUserIds);
                    }
                }
            } else {
                console.log('ℹ️ No runs returned (expected for new users)');
            }
        }
    })
    .catch(err => {
        console.error('❌ Fetch error:', err);
    });

console.log('\n' + '='.repeat(70));
console.log('⏳ Waiting for async results above...\n');
