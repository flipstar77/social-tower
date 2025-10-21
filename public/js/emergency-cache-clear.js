/**
 * EMERGENCY CACHE CLEAR
 * This script runs ONCE to clear all old cached data
 * After all users have logged in once, this file can be removed
 */

(function() {
    const CLEAR_VERSION = '2025-10-21-security-fix';
    const CLEAR_FLAG = 'cache_cleared_version';

    // Check if we've already cleared for this version
    const clearedVersion = localStorage.getItem(CLEAR_FLAG);

    if (clearedVersion !== CLEAR_VERSION) {
        console.log('🧹 EMERGENCY: Clearing all cached data due to security fix...');

        // Get all keys before clearing
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            keys.push(localStorage.key(i));
        }

        // Clear everything
        localStorage.clear();

        // Set the flag so we don't clear again
        localStorage.setItem(CLEAR_FLAG, CLEAR_VERSION);

        console.log(`✅ Cleared ${keys.length} cache items for security`);
        console.log('   Reason: User data isolation fix');
        console.log('   Date: 2025-10-21');
    }
})();
