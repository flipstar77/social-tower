const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

/**
 * Link Command Module
 * Handles linking Discord accounts to the Tower Dashboard
 */
class LinkCommand {
    constructor() {
        this.command = new SlashCommandBuilder()
            .setName('link')
            .setDescription('Link your Discord account to the Tower Dashboard');
    }

    /**
     * Execute the link command
     * @param {Object} interaction - Discord interaction object
     * @param {Object} bot - Bot instance containing supabase and other utilities
     */
    async execute(interaction, bot) {
        await interaction.deferReply({ ephemeral: true });

        try {
            await bot.ensureUserExists(interaction.user);

            if (!bot.supabase) {
                return await interaction.editReply({
                    content: '❌ Dashboard linking is not available in test mode. Please configure Supabase to enable this feature.'
                });
            }

            const result = await bot.supabase.createLinkCode(interaction.user.id);

            if (result.success) {
                const embed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle('🔗 Link Your Account')
                    .setDescription(`To link your Discord account to the Tower Dashboard:

                    1. Go to the [Tower Dashboard](http://localhost:6078)
                    2. Click "Link Discord Account"
                    3. Enter this code: **${result.code}**

                    ⏰ This code expires in 15 minutes.`)
                    .setTimestamp()
                    .setFooter({ text: 'Tower Bot' });

                await interaction.editReply({ embeds: [embed] });
            } else {
                await interaction.editReply({
                    content: '❌ Failed to generate link code. Please try again.'
                });
            }
        } catch (error) {
            console.error('💥 Error in linkCommand:', error);

            try {
                await interaction.editReply({
                    content: '❌ An error occurred while generating the link code. Please try again.'
                });
            } catch (replyError) {
                console.error('Failed to send error message to user:', replyError);
            }
        }
    }
}

module.exports = LinkCommand;