#!/usr/bin/env node

/**
 * Social Tower Process Manager & Init Script - Refactored
 * Modular process management using separated concerns
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Import modular components
const ProcessManager = require('./server/core/process-manager');
const ServiceRegistry = require('./server/core/service-registry');
const Logger = require('./server/core/logger');

class SocialTowerInit {
    constructor() {
        this.baseDir = __dirname;
        this.pidFile = path.join(this.baseDir, '.social-tower-pids');
        this.logDir = path.join(this.baseDir, 'logs');

        // Initialize modules
        this.logger = new Logger(this.logDir);
        this.processManager = new ProcessManager(this.logDir);
        this.serviceRegistry = new ServiceRegistry(this.baseDir);

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

        process.on('uncaughtException', (error) => {
            this.logger.error(`Uncaught Exception: ${error.message}`, 'system');
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

                this.logger.info('Checking for existing processes...');
                Object.entries(pids).forEach(([serviceName, pid]) => {
                    try {
                        process.kill(pid, 0);
                        this.logger.warn(`Found running ${serviceName} process: PID ${pid}`);
                    } catch (e) {
                        this.logger.info(`${serviceName} process (PID ${pid}) already stopped`);
                    }
                });
            }
        } catch (error) {
            this.logger.warn(`Could not load existing PIDs: ${error.message}`);
        }
    }

    /**
     * Save current PIDs to file
     */
    savePids() {
        const pids = {};
        const processes = this.processManager.getAllProcesses();

        processes.forEach((proc, name) => {
            if (proc.pid) {
                pids[name] = proc.pid;
            }
        });

        try {
            fs.writeFileSync(this.pidFile, JSON.stringify(pids, null, 2));
        } catch (error) {
            this.logger.warn(`Could not save PIDs: ${error.message}`);
        }
    }

    /**
     * Kill any existing Social Tower processes
     */
    async killExistingProcesses() {
        this.logger.info('Cleaning up existing Social Tower processes...');

        return new Promise((resolve) => {
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
                        this.logger.info('Process cleanup completed');
                        setTimeout(resolve, 1000);
                    }
                });
            });
        });
    }

    /**
     * Start a specific service
     */
    startService(serviceName) {
        const service = this.serviceRegistry.getService(serviceName);
        if (!service) {
            this.logger.error(`Unknown service: ${serviceName}`);
            return false;
        }

        const proc = this.processManager.startProcess(serviceName, service);
        if (proc) {
            this.savePids();
            return true;
        }

        return false;
    }

    /**
     * Stop a specific service
     */
    stopService(serviceName) {
        const service = this.serviceRegistry.getService(serviceName);
        if (!service) {
            this.logger.error(`Unknown service: ${serviceName}`);
            return;
        }

        this.processManager.stopProcess(serviceName, service);
    }

    /**
     * Start all core services
     */
    async startAll() {
        console.log('🎯 Social Tower Init - Starting All Services\n');

        // Clean up existing processes
        await this.killExistingProcesses();

        // Get core services from registry
        const coreServices = this.serviceRegistry.getCoreServices();

        // Start each service with delay
        for (const serviceName of coreServices) {
            this.startService(serviceName);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('\n✅ All core services started successfully!');
        this.status();
        console.log('\n🔄 Process manager running. Press Ctrl+C to stop all services.');
    }

    /**
     * Stop all services
     */
    stopAll() {
        const services = this.serviceRegistry.getAllServices();
        this.processManager.stopAll(services);
    }

    /**
     * Show service status
     */
    status() {
        console.log('\n📊 Service Status:');

        const services = this.serviceRegistry.getAllServices();
        Object.entries(services).forEach(([serviceName, service]) => {
            const status = this.processManager.getStatus(serviceName);

            if (status.running) {
                console.log(`  ✅ ${service.name}: Running (PID: ${status.pid})`);
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
        if (this.processManager.isShuttingDown) return;

        this.logger.info(`Received ${signal} - Shutting down services...`);
        console.log(`\n🛑 Received ${signal} - Shutting down Social Tower services...`);

        this.stopAll();

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
        const services = this.serviceRegistry.getAllServices();

        console.log(`
🏗️  Social Tower Process Manager (Refactored)

Usage: node init-refactored.js [command]

Commands:
  start              Start all services (default)
  stop               Stop all services
  restart            Restart all services
  status             Show service status
  kill-all           Force kill all Node.js processes
  logs [service]     Show logs for a service
  help               Show this help

Services:
${Object.entries(services).map(([key, service]) =>
    `  ${key.padEnd(15)} ${service.description}`
).join('\n')}

Examples:
  node init-refactored.js                    # Start all services
  node init-refactored.js status             # Check status
  node init-refactored.js logs main-server   # View server logs
  node init-refactored.js kill-all           # Emergency stop
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
                const logs = manager.logger.readLog(`${serviceName}.log`);
                if (logs) {
                    console.log(logs);
                } else {
                    console.error(`❌ No logs found for ${serviceName}`);
                }
            } else {
                console.log('📁 Available logs:');
                manager.logger.listLogs().forEach(file => {
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
