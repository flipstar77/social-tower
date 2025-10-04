/**
 * Process Manager
 * Manages process lifecycle and monitoring
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class ProcessManager {
    constructor(logDir) {
        this.processes = new Map();
        this.isShuttingDown = false;
        this.logDir = logDir;

        // Ensure log directory exists
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    /**
     * Start a service process
     */
    startProcess(serviceName, service) {
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

        // Console output
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

        // Handle process exit
        proc.on('close', (code) => {
            console.log(`📴 ${service.name} exited with code ${code}`);
            this.processes.delete(serviceName);

            // Auto-restart if configured
            if (!this.isShuttingDown && service.restart && code !== 0) {
                const restartCount = proc.restartCount || 0;
                if (restartCount < (service.maxRestarts || 5)) {
                    console.log(`🔄 Restarting ${service.name} (attempt ${restartCount + 1})...`);
                    setTimeout(() => {
                        const newProc = this.startProcess(serviceName, service);
                        if (newProc) {
                            newProc.restartCount = restartCount + 1;
                        }
                    }, 2000);
                } else {
                    console.error(`❌ ${service.name} exceeded max restart attempts`);
                }
            }
        });

        proc.on('error', (error) => {
            console.error(`❌ Failed to start ${service.name}:`, error.message);
            this.processes.delete(serviceName);
        });

        proc.restartCount = 0;
        this.processes.set(serviceName, proc);

        console.log(`✅ ${service.name} started (PID: ${proc.pid})`);
        return proc;
    }

    /**
     * Stop a specific process
     */
    stopProcess(serviceName, service) {
        const proc = this.processes.get(serviceName);
        if (!proc) {
            console.log(`⚠️  Service ${serviceName} is not running`);
            return;
        }

        console.log(`📴 Stopping ${service.name}...`);

        try {
            proc.kill('SIGTERM');

            // Force kill after timeout
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
     * Stop all processes
     */
    stopAll(services) {
        this.isShuttingDown = true;
        console.log('📴 Stopping all processes...');

        this.processes.forEach((proc, serviceName) => {
            const service = services[serviceName];
            if (service) {
                this.stopProcess(serviceName, service);
            }
        });
    }

    /**
     * Get process status
     */
    getStatus(serviceName) {
        const proc = this.processes.get(serviceName);
        return proc ? { running: true, pid: proc.pid } : { running: false };
    }

    /**
     * Get all processes
     */
    getAllProcesses() {
        return this.processes;
    }
}

module.exports = ProcessManager;
