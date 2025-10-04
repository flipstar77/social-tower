// Tower Discord Bot
const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const unifiedDb = require('./database/unifiedDatabase'); // Import singleton instance
const CommandRegistry = require('./bot/commandRegistry');

class TowerDiscordBot {
    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds
            ]
        });

        // Database will be initialized in start() method
        this.db = null;
        this.supabase = null;

        // Initialize command registry
        this.commandRegistry = new CommandRegistry();

        this.setupEventHandlers();
    }

    async initializeDatabase() {
        try {
            console.log('🔧 Initializing bot database...');
            console.log('   SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'NOT SET');
            console.log('   SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'SET' : 'NOT SET');

            // Use the singleton instance
            this.db = unifiedDb;
            await this.db.initialize();
            this.supabase = this.db; // For backward compatibility
            console.log('✅ Bot database initialized');
        } catch (error) {
            console.log('⚠️  Database not configured, bot will run in test mode');
            console.log('   Error:', error.message);
            this.supabase = null;
            this.db = null;
        }
    }

    setupEventHandlers() {
        this.client.once('ready', () => {
            console.log(`🤖 Tower Bot is ready! Logged in as ${this.client.user.tag}`);
            this.client.user.setActivity('Tower runs | /submit', { type: 'WATCHING' });
        });

        this.client.on('guildCreate', async (guild) => {
            console.log(`📥 Joined new server: ${guild.name} (${guild.id})`);
            await this.registerServer(guild);
        });

        this.client.on('interactionCreate', async (interaction) => {
            if (interaction.isChatInputCommand()) {
                await this.handleSlashCommand(interaction);
            } else if (interaction.isButton()) {
                await this.handleButtonInteraction(interaction);
            }
        });
    }

    async registerServer(guild) {
        const result = await this.supabase.registerServer(
            guild.id,
            guild.name,
            guild.ownerId
        );

        if (result.success) {
            console.log(`✅ Server ${guild.name} registered successfully`);
        }
    }


    async handleSlashCommand(interaction) {
        const { commandName } = interaction;

        try {
            await this.commandRegistry.executeCommand(commandName, interaction, this);
        } catch (error) {
            console.error('Error handling command:', error);

            // Try to respond if we haven't already
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: '❌ An error occurred while processing your command.',
                        ephemeral: true
                    });
                } else if (interaction.deferred && !interaction.replied) {
                    await interaction.editReply({
                        content: '❌ An error occurred while processing your command.'
                    });
                }
            } catch (replyError) {
                console.error('Failed to send error message:', replyError);
            }
        }
    }

    async handleButtonInteraction(interaction) {
        // Handle button interactions if needed
        console.log('Button interaction received:', interaction.customId);
    }

    async ensureUserExists(discordUser) {
        const existingUser = await this.supabase.getUserByDiscordId(discordUser.id);

        if (!existingUser.success || !existingUser.data) {
            await this.supabase.createUser(
                discordUser.id,
                discordUser.username,
                discordUser.discriminator
            );
        }
    }

    async ensureServerExists(guild) {
        const existingServer = await this.supabase.getServerSettings(guild.id);

        if (!existingServer.success || !existingServer.data) {
            await this.supabase.registerServer(
                guild.id,
                guild.name,
                guild.ownerId
            );
        }
    }


    async registerSlashCommands() {
        try {
            const commandsData = this.commandRegistry.getCommandsForRegistration();

            // Register globally (takes up to 1 hour)
            await this.client.application.commands.set(commandsData);
            console.log(`✅ Slash commands registered globally (${commandsData.length} commands)`);
        } catch (error) {
            console.error('❌ Failed to register slash commands:', error);
        }
    }

    async start(token) {
        if (!token) {
            console.error('❌ Discord bot token not provided');
            return;
        }

        try {
            // Initialize database first
            await this.initializeDatabase();

            // Then login and register commands
            await this.client.login(token);
            await this.registerSlashCommands();
        } catch (error) {
            console.error('❌ Failed to start Discord bot:', error);
        }
    }
}

module.exports = TowerDiscordBot;