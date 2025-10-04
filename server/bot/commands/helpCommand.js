const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

/**
 * Help Command Module
 * Handles displaying help information for Tower Bot
 */
class HelpCommand {
    constructor() {
        this.command = new SlashCommandBuilder()
            .setName('help')
            .setDescription('Show help information for Tower Bot');
    }

    /**
     * Execute the help command
     * @param {Object} interaction - Discord interaction object
     * @param {Object} bot - Bot instance containing supabase and other utilities
     */
    async execute(interaction, bot) {
        try {
            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('🤖 Tower Bot Help')
                .setDescription('Tower Bot helps you track and share your Tower game progress!')
                .addFields(
                    {
                        name: '📥 Submit Runs',
                        value: '`/submit stats:[paste full game stats]`\nPaste your complete stats from the game to submit your run'
                    },
                    {
                        name: '🔗 Link Account',
                        value: '`/link`\nLink your Discord to the Tower Dashboard'
                    },
                    {
                        name: '📊 View Stats',
                        value: '`/stats`\nSee your recent runs and statistics'
                    },
                    {
                        name: '🏆 Leaderboards',
                        value: '`/leaderboard` - Server leaderboard\n`/leaderboard global:true` - Global leaderboard'
                    },
                    {
                        name: '🎯 Invite Bot',
                        value: '[Invite to your server](https://discord.com/api/oauth2/authorize?client_id=YOUR_BOT_ID&permissions=2048&scope=bot%20applications.commands)'
                    }
                )
                .setTimestamp()
                .setFooter({ text: 'Tower Bot' });

            await interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error('💥 Error in helpCommand:', error);

            try {
                await interaction.reply({
                    content: '❌ An error occurred while displaying help information.',
                    ephemeral: true
                });
            } catch (replyError) {
                console.error('Failed to send error message to user:', replyError);
            }
        }
    }
}

module.exports = HelpCommand;