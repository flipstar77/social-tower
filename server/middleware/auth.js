/**
 * Supabase Authentication Middleware
 * Verifies JWT tokens and extracts user information
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://kktvmpwxfyevkgotppah.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
if (supabaseServiceKey && supabaseServiceKey !== 'your-service-role-key') {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('✅ Auth middleware: Supabase initialized');
} else {
    console.warn('⚠️ Auth middleware: Supabase not configured, auth will not work');
}

/**
 * Middleware to verify Supabase JWT and extract user
 */
async function authenticateUser(req, res, next) {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        console.log('🔐 Auth Check:', {
            path: req.path,
            hasAuth: !!authHeader,
            authPreview: authHeader ? authHeader.substring(0, 30) + '...' : 'none',
            supabaseReady: !!supabase
        });

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('⚠️ No auth token, proceeding as anonymous');
            req.user = null;
            req.discordUserId = null;
            return next();
        }

        if (!supabase) {
            console.error('❌ Supabase not initialized! Check SUPABASE_SERVICE_KEY env var');
            req.user = null;
            req.discordUserId = null;
            return next();
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify the JWT token
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error) {
            console.error('❌ Auth verification failed:', error.message);
            req.user = null;
            req.discordUserId = null;
            return next();
        }

        if (user) {
            req.user = user;
            // Extract Discord user ID from user metadata
            req.discordUserId = user.user_metadata?.provider_id || user.id;
            console.log(`✅ User authenticated: ${user.user_metadata?.full_name || 'Unknown'}`);
            console.log(`   Discord ID: ${req.discordUserId}`);
            console.log(`   Metadata:`, JSON.stringify(user.user_metadata, null, 2));
        } else {
            req.user = null;
            req.discordUserId = null;
        }

        next();
    } catch (error) {
        console.error('❌ Auth middleware exception:', error.message);
        req.user = null;
        req.discordUserId = null;
        next();
    }
}

/**
 * Middleware to require authentication
 */
function requireAuth(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }
    next();
}

module.exports = {
    authenticateUser,
    requireAuth
};
