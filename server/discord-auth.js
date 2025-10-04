// Discord OAuth Authentication
require('dotenv').config();
const jwt = require('jsonwebtoken');
const axios = require('axios');
const SupabaseManager = require('./supabase-config');

class DiscordAuth {
    constructor() {
        this.clientId = process.env.DISCORD_CLIENT_ID;
        this.clientSecret = process.env.DISCORD_CLIENT_SECRET;
        this.redirectUri = `${process.env.DASHBOARD_URL}/auth/discord/callback`;
        this.jwtSecret = process.env.JWT_SECRET || 'fallback-jwt-secret-change-this';
        this.supabase = new SupabaseManager();
    }

    // Generate Discord OAuth URL
    getAuthUrl(state = null) {
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            response_type: 'code',
            scope: 'identify email',
        });

        if (state) {
            params.append('state', state);
        }

        return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
    }

    // Exchange code for access token
    async exchangeCode(code) {
        try {
            const tokenResponse = await axios.post('https://discord.com/api/oauth2/token',
                new URLSearchParams({
                    client_id: this.clientId,
                    client_secret: this.clientSecret,
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: this.redirectUri,
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );

            return tokenResponse.data;
        } catch (error) {
            console.error('❌ Discord token exchange error:', error.response?.data || error.message);
            throw new Error('Failed to exchange Discord code for token');
        }
    }

    // Get Discord user info
    async getDiscordUser(accessToken) {
        try {
            const userResponse = await axios.get('https://discord.com/api/users/@me', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            return userResponse.data;
        } catch (error) {
            console.error('❌ Discord user fetch error:', error.response?.data || error.message);
            throw new Error('Failed to fetch Discord user data');
        }
    }

    // Create/update user in database and generate JWT
    async loginUser(discordUser) {
        try {
            // Create/update user in Supabase
            const userResult = await this.supabase.getUserByDiscordId(discordUser.id);

            let user;
            if (!userResult.success || !userResult.data) {
                // Create new user
                const createResult = await this.supabase.createUser(
                    discordUser.id,
                    discordUser.username,
                    discordUser.discriminator || '0000'
                );

                if (!createResult.success) {
                    throw new Error('Failed to create user in database');
                }

                user = createResult.data;
            } else {
                // Update existing user info
                user = userResult.data;
                // Could update username/discriminator here if needed
            }

            // Generate JWT token
            const token = jwt.sign(
                {
                    userId: user.id,
                    discordId: discordUser.id,
                    username: discordUser.username,
                    avatar: discordUser.avatar,
                    email: discordUser.email,
                    isLinked: user.is_linked
                },
                this.jwtSecret,
                { expiresIn: '7d' }
            );

            return {
                success: true,
                token,
                user: {
                    id: user.id,
                    discordId: discordUser.id,
                    username: discordUser.username,
                    avatar: discordUser.avatar,
                    email: discordUser.email,
                    isLinked: user.is_linked,
                    createdAt: user.created_at
                }
            };
        } catch (error) {
            console.error('❌ Login error:', error);
            return { success: false, error: error.message };
        }
    }

    // Verify JWT token
    verifyToken(token) {
        try {
            const decoded = jwt.verify(token, this.jwtSecret);
            return { success: true, user: decoded };
        } catch (error) {
            return { success: false, error: 'Invalid or expired token' };
        }
    }

    // Middleware for protecting routes
    requireAuth(req, res, next) {
        const token = req.cookies.auth_token || req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'No authentication token provided' });
        }

        const verification = this.verifyToken(token);
        if (!verification.success) {
            return res.status(401).json({ error: verification.error });
        }

        req.user = verification.user;
        next();
    }

    // Get user's Discord avatar URL
    getAvatarUrl(discordId, avatarHash, size = 128) {
        if (!avatarHash) {
            // Default Discord avatar
            const discriminator = parseInt(discordId) % 5;
            return `https://cdn.discordapp.com/embed/avatars/${discriminator}.png?size=${size}`;
        }

        const format = avatarHash.startsWith('a_') ? 'gif' : 'png';
        return `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.${format}?size=${size}`;
    }
}

module.exports = DiscordAuth;