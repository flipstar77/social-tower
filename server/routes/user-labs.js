const express = require('express');
const router = express.Router();

/**
 * User Labs Routes
 * Handles storage and retrieval of user research lab levels
 */

function createUserLabsRouter(supabase) {
    // GET /api/user-labs/:discordUserId - Get user's lab levels
    router.get('/:discordUserId', async (req, res) => {
        try {
            const { discordUserId } = req.params;

            const { data, error } = await supabase.supabase
                .from('user_labs')
                .select('labs')
                .eq('discord_user_id', discordUserId)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
                console.error('Error fetching user labs:', error);
                return res.status(500).json({ success: false, error: error.message });
            }

            if (!data) {
                // No labs found for this user yet
                return res.json({ success: true, labs: {} });
            }

            res.json({ success: true, labs: data.labs });
        } catch (error) {
            console.error('Error in GET /api/user-labs:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // POST /api/user-labs/:discordUserId - Save/update user's lab levels
    router.post('/:discordUserId', async (req, res) => {
        try {
            const { discordUserId } = req.params;
            const { labs } = req.body;

            if (!labs || typeof labs !== 'object') {
                return res.status(400).json({ success: false, error: 'Invalid labs data' });
            }

            // Upsert (insert or update)
            const { data, error } = await supabase.supabase
                .from('user_labs')
                .upsert({
                    discord_user_id: discordUserId,
                    labs: labs,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'discord_user_id'
                })
                .select();

            if (error) {
                console.error('Error saving user labs:', error);
                return res.status(500).json({ success: false, error: error.message });
            }

            res.json({ success: true, data });
        } catch (error) {
            console.error('Error in POST /api/user-labs:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    return router;
}

module.exports = createUserLabsRouter;
