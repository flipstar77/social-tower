/**
 * Service Registry
 * Centralized service definitions
 */

class ServiceRegistry {
    constructor(baseDir) {
        this.baseDir = baseDir;
        this.services = this.defineServices();
    }

    /**
     * Define all available services
     */
    defineServices() {
        return {
            'main-server': {
                name: 'Main Server',
                command: 'node',
                args: ['server/server.js'],
                cwd: this.baseDir,
                env: { PORT: 6078, ...process.env },
                restart: true,
                maxRestarts: 5,
                description: 'Main Express server with API endpoints',
                priority: 1
            },
            'discord-bot': {
                name: 'Discord Bot',
                command: 'node',
                args: ['server/bot-launcher.js'],
                cwd: this.baseDir,
                env: process.env,
                restart: true,
                maxRestarts: 3,
                description: 'Discord bot for Tower stats submission',
                priority: 2
            },
            'wiki-indexer': {
                name: 'Wiki Indexer',
                command: 'node',
                args: ['server/wiki-indexer.js'],
                cwd: this.baseDir,
                env: process.env,
                restart: false,
                description: 'One-time wiki content indexing (optional)',
                priority: 3
            }
        };
    }

    /**
     * Get service definition
     */
    getService(serviceName) {
        return this.services[serviceName];
    }

    /**
     * Get all services
     */
    getAllServices() {
        return this.services;
    }

    /**
     * Get core services (auto-start)
     */
    getCoreServices() {
        return Object.entries(this.services)
            .filter(([_, service]) => service.priority <= 2)
            .sort((a, b) => a[1].priority - b[1].priority)
            .map(([name, _]) => name);
    }

    /**
     * Add custom service
     */
    addService(name, definition) {
        this.services[name] = {
            cwd: this.baseDir,
            env: process.env,
            restart: false,
            ...definition
        };
    }

    /**
     * Remove service
     */
    removeService(name) {
        delete this.services[name];
    }

    /**
     * List all service names
     */
    listServices() {
        return Object.keys(this.services);
    }
}

module.exports = ServiceRegistry;
