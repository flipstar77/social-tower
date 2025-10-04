const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

/**
 * Stats Command Module
 * Handles viewing user's recent runs and statistics
 */
class StatsCommand {
    constructor() {
        this.command = new SlashCommandBuilder()
            .setName('stats')
            .setDescription('View your recent runs and statistics');
    }

    /**
     * Execute the stats command
     * @param {Object} interaction - Discord interaction object
     * @param {Object} bot - Bot instance containing supabase and other utilities
     */
    async execute(interaction, bot) {
        await interaction.deferReply();

        try {
            if (!bot.supabase) {
                return await interaction.editReply({
                    content: '📊 Stats viewing is not available in test mode. Please configure Supabase to enable this feature.',
                    ephemeral: true
                });
            }

            const runs = await bot.supabase.getUserRuns(interaction.user.id, 5);

            if (!runs.success || runs.data.length === 0) {
                return await interaction.editReply({
                    content: '📊 No runs found. Use `/submit` to add your first run!',
                    ephemeral: true
                });
            }

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`📊 ${interaction.user.username}'s Recent Runs`)
                .setTimestamp()
                .setFooter({ text: 'Tower Bot' });

            runs.data.forEach((run, index) => {
                const date = new Date(run.submitted_at).toLocaleDateString();
                embed.addFields({
                    name: `#${index + 1} - ${date}`,
                    value: `🏰 Tier ${run.tier} 🌊 Wave ${run.wave}${run.damage_dealt ? `\n💥 ${this.formatNumber(run.damage_dealt)}` : ''}${run.coins_earned ? `\n🪙 ${this.formatNumber(run.coins_earned)}` : ''}`,
                    inline: true
                });
            });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('💥 Error in statsCommand:', error);

            try {
                await interaction.editReply({
                    content: '❌ An error occurred while retrieving your stats. Please try again.',
                    ephemeral: true
                });
            } catch (replyError) {
                console.error('Failed to send error message to user:', replyError);
            }
        }
    }

    /**
     * Format number for display (copied from main bot class)
     */
    formatNumber(num) {
        if (num >= 1e15) return (num / 1e15).toFixed(2) + 'Q';
        if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
        if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
        return num.toString();
    }
}

module.exports = StatsCommand;