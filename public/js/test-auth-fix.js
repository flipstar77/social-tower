/**
 * Test Script: Verify Auth Headers Fix
 *
 * This script tests that authentication headers are being sent correctly
 * Run this in the browser console after logging in
 */

(async function() {
    console.log('🧪 TESTING AUTH FIX');
    console.log('='.repeat(60));

    const apiBase = window.API_CONFIG ? window.API_CONFIG.getBaseUrl() + '/api/tower' : '/api/tower';

    // Test 1: Check localStorage for Supabase session
    console.log('\n📋 Test 1: Check Supabase Session in localStorage');
    const storageKeys = Object.keys(localStorage).filter(key =>
        key.startsWith('sb-') && key.endsWith('-auth-token')
    );

    if (storageKeys.length > 0) {
        console.log('✅ Found Supabase session key:', storageKeys[0]);
        try {
            const sessionData = JSON.parse(localStorage.getItem(storageKeys[0]));
            console.log('✅ Session data exists');
            console.log('   - Has access_token:', !!sessionData?.access_token);
            console.log('   - User ID:', sessionData?.user?.id);
            console.log('   - Provider ID:', sessionData?.user?.user_metadata?.provider_id);
        } catch (error) {
            console.error('❌ Error parsing session:', error);
        }
    } else {
        console.error('❌ No Supabase session found in localStorage');
        console.log('   This means you are not logged in!');
        return;
    }

    // Test 2: Check if auth headers are generated correctly
    console.log('\n📋 Test 2: Check Auth Header Generation');
    const headers = { 'Content-Type': 'application/json' };

    try {
        const storageKey = storageKeys[0];
        const sessionData = JSON.parse(localStorage.getItem(storageKey));
        if (sessionData?.access_token) {
            headers['Authorization'] = `Bearer ${sessionData.access_token}`;
            console.log('✅ Authorization header generated');
            console.log('   - Token preview:', sessionData.access_token.substring(0, 30) + '...');
        } else {
            console.error('❌ No access token in session data');
            return;
        }
    } catch (error) {
        console.error('❌ Error generating auth headers:', error);
        return;
    }

    // Test 3: Make API request and verify it uses auth
    console.log('\n📋 Test 3: Test API Request with Auth Headers');
    console.log('   Making request to:', `${apiBase}/runs?limit=5`);

    try {
        const response = await fetch(`${apiBase}/runs?limit=5`, {
            headers: headers
        });

        console.log('   Response status:', response.status);

        if (!response.ok) {
            console.error('❌ API request failed:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('   Error details:', errorText);
            return;
        }

        const data = await response.json();
        console.log('✅ API request successful');
        console.log('   - Success:', data.success);
        console.log('   - Runs returned:', data.runs?.length || 0);

        if (data.runs && data.runs.length > 0) {
            const discordUserIds = [...new Set(data.runs.map(r => r.discord_user_id))];
            console.log('   - Unique discord_user_ids:', discordUserIds);

            // Check if all runs belong to the current user
            const sessionData = JSON.parse(localStorage.getItem(storageKeys[0]));
            const currentUserId = sessionData?.user?.user_metadata?.provider_id || sessionData?.user?.id;

            if (discordUserIds.length === 1 && discordUserIds[0] === currentUserId) {
                console.log('✅ PERFECT! All runs belong to current user');
            } else if (discordUserIds.length > 1) {
                console.error('❌ SECURITY ISSUE! Runs belong to multiple users:', discordUserIds);
                console.error('   Current user ID:', currentUserId);
                console.error('   This means the auth fix is NOT working!');
            } else if (discordUserIds[0] !== currentUserId) {
                console.error('❌ SECURITY ISSUE! Runs belong to different user');
                console.error('   Current user ID:', currentUserId);
                console.error('   Runs belong to:', discordUserIds[0]);
            }
        } else {
            console.log('ℹ️  No runs found for this user (expected for new accounts)');
        }

    } catch (error) {
        console.error('❌ API request error:', error);
    }

    // Test 4: Check DashboardDataService
    console.log('\n📋 Test 4: Test DashboardDataService');
    if (window.DashboardDataService) {
        console.log('✅ DashboardDataService is available');

        const service = new window.DashboardDataService();
        const headers = service._getAuthHeaders();

        console.log('   - Has Authorization header:', !!headers.Authorization);
        if (headers.Authorization) {
            console.log('   - Token preview:', headers.Authorization.substring(0, 30) + '...');
        } else {
            console.error('❌ DashboardDataService NOT generating auth headers!');
        }
    } else {
        console.log('⚠️  DashboardDataService not loaded');
    }

    // Test 5: Check RunManager
    console.log('\n📋 Test 5: Test RunManager (Analytics)');
    if (window.RunManager) {
        console.log('✅ RunManager is available');

        const manager = new window.RunManager(apiBase);
        const headers = manager._getAuthHeaders();

        console.log('   - Has Authorization header:', !!headers.Authorization);
        if (headers.Authorization) {
            console.log('   - Token preview:', headers.Authorization.substring(0, 30) + '...');
        } else {
            console.error('❌ RunManager NOT generating auth headers!');
        }
    } else {
        console.log('⚠️  RunManager not loaded');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎯 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log('If all tests show ✅, the auth fix is working correctly!');
    console.log('If you see ❌, please check the console output above for details.');
    console.log('\nTo test user isolation:');
    console.log('1. Log out');
    console.log('2. Log in with a different Discord account');
    console.log('3. Run this test again');
    console.log('4. You should see 0 runs (or only runs from the new account)');

})();
