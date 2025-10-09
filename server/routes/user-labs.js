/**
 * User Labs API - Save and fetch user lab levels
 */

const express = require('express');
const router = express.Router();

module.exports = function createUserLabsRouter(supabase) {
    /**
     * GET /api/user-labs/:discordId
     * Fetch user's lab levels
     */
    router.get('/:discordId', async (req, res) => {
        try {
            const { discordId } = req.params;

            const { data, error } = await supabase.supabase
                .from('user_labs')
                .select('*')
                .eq('discord_id', discordId)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = not found
                throw error;
            }

            if (!data) {
                return res.json({
                    success: true,
                    exists: false,
                    labs: {},
                    message: 'No lab data found for this user'
                });
            }

            res.json({
                success: true,
                exists: true,
                labs: data.labs || {},
                quickStats: {
                    damage: data.damage_lab,
                    critFactor: data.crit_factor_lab,
                    attackSpeed: data.attack_speed_lab,
                    critChance: data.critical_chance_percent,
                    range: data.range_lab,
                    superCritMultiplier: data.super_crit_multiplier_lab,
                    superCritChance: data.super_crit_chance_lab,
                    superTower: data.super_tower_lab,
                    health: data.health_lab
                },
                progress: {
                    tier: data.current_tier,
                    wave: data.current_wave
                },
                updatedAt: data.updated_at
            });

        } catch (error) {
            console.error('❌ Error fetching user labs:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * POST /api/user-labs/:discordId
     * Save/update user's lab levels
     *
     * Body: {
     *   labs: { damage: 36, crit_factor: 30, ... },
     *   tier: 15,
     *   wave: 1250
     * }
     */
    router.post('/:discordId', async (req, res) => {
        try {
            const { discordId } = req.params;
            const { labs, tier, wave } = req.body;

            if (!labs || typeof labs !== 'object') {
                return res.status(400).json({
                    success: false,
                    error: 'Labs data is required and must be an object'
                });
            }

            // Ensure user exists first
            const { data: user } = await supabase.supabase
                .from('users')
                .select('discord_id')
                .eq('discord_id', discordId)
                .single();

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found. Please link your Discord account first.'
                });
            }

            // Extract quick-access stats from labs object
            const quickStats = {
                damage_lab: labs.damage || 0,
                crit_factor_lab: labs.crit_factor || 0,
                attack_speed_lab: labs.attack_speed || 0,
                critical_chance_percent: labs.critical_chance || 0,
                range_lab: labs.range || 0,
                super_crit_multiplier_lab: labs.super_crit_multiplier || 0,
                super_crit_chance_lab: labs.super_crit_chance || 0,
                super_tower_lab: labs.super_tower || 0,
                health_lab: labs.health || 0
            };

            // Upsert lab data
            const { data, error } = await supabase.supabase
                .from('user_labs')
                .upsert({
                    discord_id: discordId,
                    labs: labs,
                    ...quickStats,
                    current_tier: tier || 1,
                    current_wave: wave || 1,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'discord_id'
                })
                .select()
                .single();

            if (error) {
                throw error;
            }

            res.json({
                success: true,
                message: 'Lab data saved successfully',
                data: {
                    labsCount: Object.keys(labs).length,
                    updatedAt: data.updated_at
                }
            });

        } catch (error) {
            console.error('❌ Error saving user labs:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * PATCH /api/user-labs/:discordId/lab/:labName
     * Update a single lab level
     *
     * Body: { level: 37 }
     */
    router.patch('/:discordId/lab/:labName', async (req, res) => {
        try {
            const { discordId, labName } = req.params;
            const { level } = req.body;

            if (typeof level !== 'number' || level < 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Level must be a non-negative number'
                });
            }

            // Use the helper function to update single lab
            const { error } = await supabase.supabase
                .rpc('set_lab_level', {
                    user_discord_id: discordId,
                    lab_name: labName,
                    new_level: level
                });

            if (error) {
                throw error;
            }

            res.json({
                success: true,
                message: `Lab '${labName}' updated to level ${level}`
            });

        } catch (error) {
            console.error('❌ Error updating lab level:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * GET /api/user-labs/:discordId/lab/:labName
     * Get a single lab level
     */
    router.get('/:discordId/lab/:labName', async (req, res) => {
        try {
            const { discordId, labName } = req.params;

            const { data, error } = await supabase.supabase
                .rpc('get_lab_level', {
                    user_discord_id: discordId,
                    lab_name: labName
                });

            if (error) {
                throw error;
            }

            res.json({
                success: true,
                lab: labName,
                level: data || 0
            });

        } catch (error) {
            console.error('❌ Error fetching lab level:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    return router;
};
