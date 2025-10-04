#!/usr/bin/env node

/**
 * Social Tower Process Manager & Init Script
 *
 * This script manages all Social Tower processes to prevent duplicates
 * and provide centralized control over the entire application stack.
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

class SocialTowerInit {
    constructor() {
        this.processes = new Map();
        this.pidFile = path.join(__dirname, '.social-tower-pids');
        this.logDir = path.join(__dirname, 'logs');
        this.isShuttingDown = false;

        // Ensure logs directory exists
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }

        // Service definitions
        this.services = {
            'main-server': {
                name: 'Main Server',
                command: 'node',
                args: ['server/server.js'],
                cwd: __dirname,
                env: { PORT: 6078, ...process.env },
                restart: true,
                maxRestarts: 5,
                description: 'Main Express server with API endpoints'
            },
            'discord-bot': {
                name: 'Discord Bot',
                command: 'node',
                args: ['server/bot-launcher.js'],
                cwd: __dirname,
                env: process.env,
                restart: true,
                maxRestarts: 3,
                description: 'Discord bot for Tower stats submission'
            },
            'wiki-indexer': {
                name: 'Wiki Indexer',
                command: 'node',
                args: ['server/wiki-indexer.js'],
                cwd: __dirname,
                env: process.env,
                restart: false,
                description: 'One-time wiki content indexing (optional)'
            }
        };

        this.setupSignalHandlers();
        this.loadExistingPids();
    }

    /**
     * Setup graceful shutdown handlers
     */
    setupSignalHandlers() {
        process.on('SIGINT', () => this.shutdown('SIGINT'));
        process.on('SIGTERM', () => this.shutdown('SIGTERM'));
        process.on('exit', () => this.cleanup());

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error('🚨 Uncaught Exception:', error);
            this.shutdown('UNCAUGHT_EXCEPTION');
        });
    }

    /**
     * Load existing PIDs from previous runs
     */
    loadExistingPids() {
        try {
            if (fs.existsSync(this.pidFile)) {
                const data = fs.readFileSync(this.pidFile, 'utf8');
                const pids = JSON.parse(data);

                console.log('📋 Checking for existing processes...');
                Object.entries(pids).forEach(([serviceName, pid]) => {
                    try {
                        // Check if process still exists
                        process.kill(pid, 0);
                        console.log(`⚠️  Found running ${serviceName} process: PID ${pid}`);
                    } catch (e) {
                        console.log(`✅ ${serviceName} process (PID ${pid}) already stopped`);
                    }
                });
            }
        } catch (error) {
            console.warn('⚠️  Could not load existing PIDs:', error.message);
        }
    }

    /**
     * Save current PIDs to file
     */
    savePids() {
        const pids = {};
        this.processes.forEach((proc, name) => {
            if (proc.pid) {
                pids[name] = proc.pid;
            }
        });

        try {
            fs.writeFileSync(this.pidFile, JSON.stringify(pids, null, 2));
        } catch (error) {
            console.warn('⚠️  Could not save PIDs:', error.message);
        }
    }

    /**
     * Kill any existing Social Tower processes
     */
    async killExistingProcesses() {
        console.log('🧹 Cleaning up existing Social Tower processes...');

        return new Promise((resolve) => {
            // Kill by process name patterns
            const killCommands = [
                'taskkill /f /im node.exe /fi "WINDOWTITLE eq *server.js*" 2>nul',
                'taskkill /f /im node.exe /fi "WINDOWTITLE eq *bot-launcher.js*" 2>nul',
                'taskkill /f /im node.exe /fi "WINDOWTITLE eq *social tower*" 2>nul'
            ];

            let completed = 0;
            killCommands.forEach(cmd => {
                exec(cmd, (error) => {
                    completed++;
                    if (completed === killCommands.length) {
                        console.log('✅ Process cleanup completed');
                        setTimeout(resolve, 1000); // Give time for cleanup
                    }
                });
            });
        });
    }

    /**
     * Start a specific service
     */
    startService(serviceName) {
        const service = this.services[serviceName];
        if (!service) {
            console.error(`❌ Unknown service: ${serviceName}`);
            return false;
        }

        if (this.processes.has(serviceName)) {
            console.log(`⚠️  ${service.name} is already running`);
            return true;
        }

        console.log(`🚀 Starting ${service.name}...`);
        console.log(`   Description: ${service.description}`);
        console.log(`   Command: ${service.command} ${service.args.join(' ')}`);

        const logFile = path.join(this.logDir, `${serviceName}.log`);
        const errorLogFile = path.join(this.logDir, `${serviceName}.error.log`);

        const proc = spawn(service.command, service.args, {
            cwd: service.cwd,
            env: service.env,
            stdio: ['ignore', 'pipe', 'pipe'],
            detached: false
        });

        // Setup logging
        const logStream = fs.createWriteStream(logFile, { flags: 'a' });
        const errorLogStream = fs.createWriteStream(errorLogFile, { flags: 'a' });

        proc.stdout.pipe(logStream);
        proc.stderr.pipe(errorLogStream);

        // Also pipe to console for immediate feedback
        proc.stdout.on('data', (data) => {
            const message = data.toString().trim();
            if (message) {
                console.log(`[${service.name}] ${message}`);
            }
        });

        proc.stderr.on('data', (data) => {
            const message = data.toString().trim();
            if (message) {
                console.error(`[${service.name}] ERROR: ${message}`);
            }
        });

        proc.on('close', (code) => {
            console.log(`📴 ${service.name} exited with code ${code}`);
            this.processes.delete(serviceName);

            if (!this.isShuttingDown && service.restart && code !== 0) {
                console.log(`🔄 Restarting ${service.name}...`);
                setTimeout(() => this.startService(serviceName), 2000);
            }
        });

        proc.on('error', (error) => {
            console.error(`❌ Failed to start ${service.name}:`, error.message);
            this.processes.delete(serviceName);
        });

        // Add restart count
        proc.restartCount = 0;

        this.processes.set(serviceName, proc);
        this.savePids();

        console.log(`✅ ${service.name} started (PID: ${proc.pid})`);
        return true;
    }

    /**
     * Stop a specific service
     */
    stopService(serviceName) {
        const proc = this.processes.get(serviceName);
        if (!proc) {
            console.log(`⚠️  Service ${serviceName} is not running`);
            return;
        }

        const service = this.services[serviceName];
        console.log(`📴 Stopping ${service.name}...`);

        try {
            proc.kill('SIGTERM');
            setTimeout(() => {
                if (!proc.killed) {
                    console.log(`🔨 Force killing ${service.name}...`);
                    proc.kill('SIGKILL');
                }
            }, 5000);
        } catch (error) {
            console.error(`❌ Error stopping ${service.name}:`, error.message);
        }
    }

    /**
     * Start all services
     */
    async startAll() {
        console.log('🎯 Social Tower Init - Starting All Services\n');

        // Clean up any existing processes first
        await this.killExistingProcesses();

        // Start core services
        const coreServices = ['main-server', 'discord-bot'];

        for (const serviceName of coreServices) {
            this.startService(serviceName);
            // Small delay between service starts
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('\n✅ All core services started successfully!');
        console.log('📊 Service Status:');
        this.status();

        // Keep the process alive
        console.log('\n🔄 Process manager running. Press Ctrl+C to stop all services.');
    }

    /**
     * Stop all services
     */
    stopAll() {
        console.log('📴 Stopping all services...');

        this.processes.forEach((proc, serviceName) => {
            this.stopService(serviceName);
        });
    }

    /**
     * Show service status
     */
    status() {
        console.log('\n📊 Service Status:');
        Object.keys(this.services).forEach(serviceName => {
            const proc = this.processes.get(serviceName);
            const service = this.services[serviceName];

            if (proc && proc.pid) {
                console.log(`  ✅ ${service.name}: Running (PID: ${proc.pid})`);
            } else {
                console.log(`  ❌ ${service.name}: Stopped`);
            }
        });

        console.log(`\n📁 Logs directory: ${this.logDir}`);
        console.log(`📋 PID file: ${this.pidFile}`);
    }

    /**
     * Graceful shutdown
     */
    async shutdown(signal) {
        if (this.isShuttingDown) return;

        this.isShuttingDown = true;
        console.log(`\n🛑 Received ${signal} - Shutting down Social Tower services...`);

        this.stopAll();

        // Wait for processes to stop
        setTimeout(() => {
            this.cleanup();
            process.exit(0);
        }, 6000);
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        try {
            if (fs.existsSync(this.pidFile)) {
                fs.unlinkSync(this.pidFile);
            }
        } catch (error) {
            // Ignore cleanup errors
        }
    }

    /**
     * Show help
     */
    showHelp() {
        console.log(`
🏗️  Social Tower Process Manager

Usage: node init.js [command]

Commands:
  start              Start all services (default)
  stop               Stop all services
  restart            Restart all services
  status             Show service status
  kill-all           Force kill all Node.js processes
  logs [service]     Show logs for a service
  help               Show this help

Services:
${Object.entries(this.services).map(([key, service]) =>
    `  ${key.padEnd(15)} ${service.description}`
).join('\n')}

Examples:
  node init.js                    # Start all services
  node init.js status             # Check status
  node init.js logs main-server   # View server logs
  node init.js kill-all           # Emergency stop
        `);
    }
}

// CLI Interface
async function main() {
    const command = process.argv[2] || 'start';
    const manager = new SocialTowerInit();

    switch (command) {
        case 'start':
        case 'run':
            await manager.startAll();
            break;

        case 'stop':
            manager.stopAll();
            setTimeout(() => process.exit(0), 3000);
            break;

        case 'restart':
            manager.stopAll();
            setTimeout(async () => {
                await manager.startAll();
            }, 3000);
            break;

        case 'status':
            manager.status();
            process.exit(0);
            break;

        case 'kill-all':
            await manager.killExistingProcesses();
            process.exit(0);
            break;

        case 'logs':
            const serviceName = process.argv[3];
            if (serviceName) {
                const logFile = path.join(manager.logDir, `${serviceName}.log`);
                if (fs.existsSync(logFile)) {
                    console.log(fs.readFileSync(logFile, 'utf8'));
                } else {
                    console.error(`❌ Log file not found: ${logFile}`);
                }
            } else {
                console.log('📁 Available logs:');
                fs.readdirSync(manager.logDir).forEach(file => {
                    console.log(`  ${file}`);
                });
            }
            process.exit(0);
            break;

        case 'help':
        default:
            manager.showHelp();
            process.exit(0);
            break;
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = SocialTowerInit;