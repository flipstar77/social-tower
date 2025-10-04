const express = require('express');
const router = express.Router();

function createDiscordAuthRouter(discordAuth, supabase) {
    // Discord OAuth login endpoint
    router.get('/discord', (req, res) => {
        const state = Math.random().toString(36).substring(2, 15);
        const authUrl = discordAuth.getAuthUrl(state);

        console.log('🔐 Discord OAuth login requested');
        console.log('🔗 Generated auth URL:', authUrl);

        // Store state in session/cookie for verification
        res.cookie('oauth_state', state, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 10 * 60 * 1000 // 10 minutes
        });

        res.redirect(authUrl);
    });

    // Discord OAuth callback
    router.get('/discord/callback', async (req, res) => {
        console.log('🔙 Discord OAuth callback received');
        console.log('🔍 Query params:', req.query);

        const { code, state } = req.query;
        const storedState = req.cookies.oauth_state;

        console.log('🔐 State verification - received:', state, 'stored:', storedState);

        // Verify state parameter
        if (!state || !storedState || state !== storedState) {
            console.log('❌ State verification failed');
            return res.status(400).send('Invalid OAuth state parameter');
        }

        // Clear state cookie
        res.clearCookie('oauth_state');

        try {
            // Exchange code for token
            const tokenData = await discordAuth.exchangeCode(code);

            // Get Discord user info
            const discordUser = await discordAuth.getDiscordUser(tokenData.access_token);

            // Login/create user and get JWT
            const loginResult = await discordAuth.loginUser(discordUser);

            if (!loginResult.success) {
                throw new Error(loginResult.error);
            }

            // Set JWT cookie
            res.cookie('auth_token', loginResult.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            // Redirect to dashboard
            res.redirect('/?login=success');

        } catch (error) {
            console.error('❌ Discord OAuth error:', error);
            res.redirect('/?login=error');
        }
    });

    // Get current user info
    router.get('/me', discordAuth.requireAuth.bind(discordAuth), (req, res) => {
        res.json({
            success: true,
            user: req.user
        });
    });

    // Logout endpoint
    router.post('/logout', (req, res) => {
        res.clearCookie('auth_token');
        res.json({ success: true, message: 'Logged out successfully' });
    });

    // Get user's Discord runs (protected route)
    router.get('/runs', discordAuth.requireAuth.bind(discordAuth), async (req, res) => {
        try {
            const runs = await supabase.getUserRuns(req.user.discordId, 50);

            if (!runs.success) {
                throw new Error(runs.error);
            }

            res.json({
                success: true,
                runs: runs.data
            });

        } catch (error) {
            console.error('❌ Error fetching user runs:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch runs'
            });
        }
    });

    // Link Discord account with link code
    router.post('/link', discordAuth.requireAuth.bind(discordAuth), async (req, res) => {
        const { linkCode } = req.body;

        if (!linkCode) {
            return res.status(400).json({
                success: false,
                error: 'Link code is required'
            });
        }

        try {
            // Validate and use the link code
            const validateResult = await supabase.validateLinkCode(linkCode);

            if (!validateResult.success || !validateResult.data) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid or expired link code'
                });
            }

            const linkData = validateResult.data;

            // Verify the link code belongs to this user
            if (linkData.discord_id !== req.user.discordId) {
                return res.status(400).json({
                    success: false,
                    error: 'Link code does not belong to this Discord account'
                });
            }

            // Mark the code as used
            await supabase.useLinkCode(linkCode);

            // Update user as linked
            const linkResult = await supabase.linkUserToDashboard(req.user.discordId, linkCode);

            if (!linkResult.success) {
                throw new Error(linkResult.error);
            }

            res.json({
                success: true,
                message: 'Discord account linked successfully!'
            });

        } catch (error) {
            console.error('❌ Error linking account:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to link account'
            });
        }
    });

    return router;
}

module.exports = createDiscordAuthRouter;