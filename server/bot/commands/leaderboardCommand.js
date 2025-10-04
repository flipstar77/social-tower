const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

/**
 * Leaderboard Command Module
 * Handles viewing server and global leaderboards
 */
class LeaderboardCommand {
    constructor() {
        this.command = new SlashCommandBuilder()
            .setName('leaderboard')
            .setDescription('View server leaderboard')
            .addBooleanOption(option =>
                option.setName('global')
                    .setDescription('Show global leaderboard instead of server')
                    .setRequired(false));
    }

    /**
     * Execute the leaderboard command
     * @param {Object} interaction - Discord interaction object
     * @param {Object} bot - Bot instance containing supabase and other utilities
     */
    async execute(interaction, bot) {
        await interaction.deferReply();

        try {
            if (!bot.supabase) {
                return await interaction.editReply({
                    content: '🏆 Leaderboards are not available in test mode. Please configure Supabase to enable this feature.',
                    ephemeral: true
                });
            }

            const isGlobal = interaction.options.getBoolean('global') || false;

            let leaderboard;
            if (isGlobal) {
                leaderboard = await bot.supabase.getGlobalLeaderboard(10);
            } else {
                if (!interaction.guild) {
                    return await interaction.editReply({
                        content: '❌ Server leaderboard can only be viewed in a Discord server. Use `global:true` for global leaderboard.',
                        ephemeral: true
                    });
                }
                leaderboard = await bot.supabase.getServerLeaderboard(interaction.guild.id, 10);
            }

            if (!leaderboard.success || leaderboard.data.length === 0) {
                return await interaction.editReply({
                    content: '📊 No leaderboard data available yet.',
                    ephemeral: true
                });
            }

            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle(`🏆 ${isGlobal ? 'Global' : interaction.guild.name} Leaderboard`)
                .setTimestamp()
                .setFooter({ text: 'Tower Bot' });

            leaderboard.data.forEach((entry, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                const username = entry.users?.discord_username || entry.discord_username || 'Unknown';

                embed.addFields({
                    name: `${medal} ${username}`,
                    value: `🏰 Tier ${entry.tier} 🌊 Wave ${entry.wave}`,
                    inline: true
                });
            });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('💥 Error in leaderboardCommand:', error);

            try {
                await interaction.editReply({
                    content: '❌ An error occurred while retrieving the leaderboard. Please try again.',
                    ephemeral: true
                });
            } catch (replyError) {
                console.error('Failed to send error message to user:', replyError);
            }
        }
    }
}

module.exports = LeaderboardCommand;