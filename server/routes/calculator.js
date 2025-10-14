const express = require('express');
const router = express.Router();

// Import calculator modules
const { calculateAllStats, calculateLabPriorities } = require('../services/tower-calculator/roi-calculator');
const { calculateEDamage } = require('../services/tower-calculator/edmg-calculator');
const { calculateEHP } = require('../services/tower-calculator/ehp-calculator');
const { calculateEEcon } = require('../services/tower-calculator/eecon-calculator');
const { CARD_MASTERY } = require('../services/tower-calculator/constants');

/**
 * Calculator Routes
 * Provides endpoints for calculating eDamage, eHP, eEcon, and lab priorities
 */

function createCalculatorRouter(supabase) {
    /**
     * POST /api/calculator/stats
     * Calculate all stats (eDamage, eHP, eEcon) for a user
     */
    router.post('/stats', async (req, res) => {
        try {
            const { discord_user_id } = req.body;

            if (!discord_user_id) {
                return res.status(400).json({
                    success: false,
                    error: 'discord_user_id is required'
                });
            }

            // Fetch user's labs and card mastery from database
            const { data: userData, error } = await supabase.supabase
                .from('user_labs')
                .select('*')
                .eq('discord_user_id', discord_user_id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching user data:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to fetch user data'
                });
            }

            if (!userData || !userData.labs) {
                return res.status(404).json({
                    success: false,
                    error: 'No lab data found for user. Please save your labs first.'
                });
            }

            // Extract labs and card mastery
            const labs = userData.labs || {};
            const cardMastery = {
                [CARD_MASTERY.DAMAGE]: userData.damage_mastery || 0,
                [CARD_MASTERY.ATTACK_SPEED]: userData.attack_speed_mastery || 0,
                [CARD_MASTERY.CRITICAL_CHANCE]: userData.critical_chance_mastery || 0,
                [CARD_MASTERY.RANGE]: userData.range_mastery || 0,
                [CARD_MASTERY.SUPER_TOWER]: userData.super_tower_mastery || 0,
                [CARD_MASTERY.ULTIMATE_CRIT]: userData.ultimate_crit_mastery || 0,
                [CARD_MASTERY.DEMON_MODE]: userData.demon_mode_mastery || 0
            };

            // Calculate all stats
            const stats = calculateAllStats(labs, cardMastery);

            res.json({
                success: true,
                data: stats
            });

        } catch (error) {
            console.error('Error in /api/calculator/stats:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * POST /api/calculator/priorities
     * Calculate lab upgrade priorities (ROI rankings)
     */
    router.post('/priorities', async (req, res) => {
        try {
            const { discord_user_id, focus = 'damage', limit = 10 } = req.body;

            if (!discord_user_id) {
                return res.status(400).json({
                    success: false,
                    error: 'discord_user_id is required'
                });
            }

            // Fetch user's labs and card mastery
            const { data: userData, error } = await supabase.supabase
                .from('user_labs')
                .select('*')
                .eq('discord_user_id', discord_user_id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching user data:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to fetch user data'
                });
            }

            if (!userData || !userData.labs) {
                return res.status(404).json({
                    success: false,
                    error: 'No lab data found for user. Please save your labs first.'
                });
            }

            // Extract labs and card mastery
            const labs = userData.labs || {};
            const cardMastery = {
                [CARD_MASTERY.DAMAGE]: userData.damage_mastery || 0,
                [CARD_MASTERY.ATTACK_SPEED]: userData.attack_speed_mastery || 0,
                [CARD_MASTERY.CRITICAL_CHANCE]: userData.critical_chance_mastery || 0,
                [CARD_MASTERY.RANGE]: userData.range_mastery || 0,
                [CARD_MASTERY.SUPER_TOWER]: userData.super_tower_mastery || 0,
                [CARD_MASTERY.ULTIMATE_CRIT]: userData.ultimate_crit_mastery || 0,
                [CARD_MASTERY.DEMON_MODE]: userData.demon_mode_mastery || 0
            };

            // Calculate priorities
            const priorities = calculateLabPriorities(labs, cardMastery, focus);

            // Calculate current stats for context
            const currentStats = calculateAllStats(labs, cardMastery);

            res.json({
                success: true,
                data: {
                    currentStats,
                    priorities: priorities.slice(0, limit),
                    focus
                }
            });

        } catch (error) {
            console.error('Error in /api/calculator/priorities:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * POST /api/calculator/edmg
     * Calculate eDamage only
     */
    router.post('/edmg', async (req, res) => {
        try {
            const { discord_user_id } = req.body;

            if (!discord_user_id) {
                return res.status(400).json({
                    success: false,
                    error: 'discord_user_id is required'
                });
            }

            // Fetch user data
            const { data: userData, error } = await supabase.supabase
                .from('user_labs')
                .select('*')
                .eq('discord_user_id', discord_user_id)
                .single();

            if (error || !userData || !userData.labs) {
                return res.status(404).json({
                    success: false,
                    error: 'No lab data found'
                });
            }

            const labs = userData.labs || {};
            const cardMastery = {
                [CARD_MASTERY.DAMAGE]: userData.damage_mastery || 0,
                [CARD_MASTERY.ATTACK_SPEED]: userData.attack_speed_mastery || 0,
                [CARD_MASTERY.CRITICAL_CHANCE]: userData.critical_chance_mastery || 0,
                [CARD_MASTERY.RANGE]: userData.range_mastery || 0,
                [CARD_MASTERY.SUPER_TOWER]: userData.super_tower_mastery || 0,
                [CARD_MASTERY.ULTIMATE_CRIT]: userData.ultimate_crit_mastery || 0,
                [CARD_MASTERY.DEMON_MODE]: userData.demon_mode_mastery || 0
            };

            const edmg = calculateEDamage(labs, cardMastery);

            res.json({
                success: true,
                data: edmg
            });

        } catch (error) {
            console.error('Error in /api/calculator/edmg:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    return router;
}

module.exports = createCalculatorRouter;
