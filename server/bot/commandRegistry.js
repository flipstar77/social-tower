/**
 * Command Registry Module
 * Manages loading and registration of all Discord bot commands
 */

const SubmitCommand = require('./commands/submitCommand');
const LinkCommand = require('./commands/linkCommand');
const StatsCommand = require('./commands/statsCommand');
const LeaderboardCommand = require('./commands/leaderboardCommand');
const HelpCommand = require('./commands/helpCommand');

class CommandRegistry {
    constructor() {
        this.commands = new Map();
        this.commandInstances = new Map();
        this.loadCommands();
    }

    /**
     * Load all command instances and register them
     */
    loadCommands() {
        console.log('📚 Loading Discord bot commands...');

        // Initialize all command instances
        const commandClasses = [
            SubmitCommand,
            LinkCommand,
            StatsCommand,
            LeaderboardCommand,
            HelpCommand
        ];

        commandClasses.forEach(CommandClass => {
            try {
                const commandInstance = new CommandClass();
                const commandName = commandInstance.command.name;

                // Store both the command builder and the instance
                this.commands.set(commandName, commandInstance.command);
                this.commandInstances.set(commandName, commandInstance);

                console.log(`✅ Loaded command: /${commandName}`);
            } catch (error) {
                console.error(`❌ Failed to load command ${CommandClass.name}:`, error);
            }
        });

        console.log(`📊 Successfully loaded ${this.commands.size} commands`);
    }

    /**
     * Get all registered commands for Discord API registration
     * @returns {Array} Array of command data for Discord API
     */
    getCommandsForRegistration() {
        return Array.from(this.commands.values()).map(cmd => cmd.toJSON());
    }

    /**
     * Get command instance by name
     * @param {string} commandName - The name of the command
     * @returns {Object|null} Command instance or null if not found
     */
    getCommand(commandName) {
        return this.commandInstances.get(commandName) || null;
    }

    /**
     * Execute a command by name
     * @param {string} commandName - The name of the command to execute
     * @param {Object} interaction - Discord interaction object
     * @param {Object} bot - Bot instance
     * @returns {Promise<void>}
     */
    async executeCommand(commandName, interaction, bot) {
        const command = this.getCommand(commandName);

        if (!command) {
            console.error(`❌ Unknown command: ${commandName}`);
            await interaction.reply({
                content: 'Unknown command!',
                ephemeral: true
            });
            return;
        }

        try {
            await command.execute(interaction, bot);
        } catch (error) {
            console.error(`💥 Error executing command ${commandName}:`, error);

            // Try to respond to the user if the interaction hasn't been replied to yet
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
                console.error('Failed to send error message to user:', replyError);
            }
        }
    }

    /**
     * Get all available command names
     * @returns {Array<string>} Array of command names
     */
    getCommandNames() {
        return Array.from(this.commands.keys());
    }

    /**
     * Get command count
     * @returns {number} Number of registered commands
     */
    getCommandCount() {
        return this.commands.size;
    }

    /**
     * Check if a command exists
     * @param {string} commandName - The name of the command to check
     * @returns {boolean} True if command exists, false otherwise
     */
    hasCommand(commandName) {
        return this.commands.has(commandName);
    }
}

module.exports = CommandRegistry;