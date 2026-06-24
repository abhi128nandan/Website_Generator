"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SafeExecutor = void 0;
const child_process_1 = require("child_process");
class SafeExecutor {
    // Danger patterns - these can NEVER execute
    static DANGER_PATTERNS = [
        /rm\s+-rf/,
        /format/,
        /shutdown/,
        /del\s+\/s/i,
        /rmdir\s+\/s/i,
        /npm\s+publish/,
        /git\s+push/
    ];
    activeProcesses = new Set();
    constructor() {
        // Cleanup on process exit
        process.on('exit', () => this.cleanup());
    }
    isCommandSafe(command) {
        return !SafeExecutor.DANGER_PATTERNS.some(pattern => pattern.test(command));
    }
    async execute(command, args, options) {
        const fullCommand = `${command} ${args.join(' ')}`;
        if (!this.isCommandSafe(fullCommand)) {
            throw new Error(`Command blocked by SafeExec policies: ${fullCommand}`);
        }
        const maxRetries = options.retries ?? 0;
        let attempt = 0;
        while (attempt <= maxRetries) {
            try {
                return await this.executeOnce(command, args, options, attempt);
            }
            catch (error) {
                if (attempt === maxRetries)
                    throw error;
                // Exponential backoff: 500ms, 1000ms, 2000ms...
                await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt)));
                attempt++;
            }
        }
        throw new Error('Unreachable');
    }
    executeOnce(command, args, options, retryCount) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const timeoutMs = options.timeoutMs ?? 120000; // 2 min default
            let stdout = '';
            let stderr = '';
            let timedOut = false;
            const env = options.env ? { ...process.env, ...options.env } : process.env;
            const proc = (0, child_process_1.spawn)(command, args, {
                cwd: options.cwd,
                env,
                shell: true // needed for pnpm/npm on windows sometimes, but careful with shell injections
            });
            this.activeProcesses.add(proc);
            const timeoutId = setTimeout(() => {
                timedOut = true;
                this.killProcess(proc);
            }, timeoutMs);
            proc.stdout?.on('data', data => stdout += data.toString());
            proc.stderr?.on('data', data => stderr += data.toString());
            proc.on('error', err => {
                clearTimeout(timeoutId);
                this.activeProcesses.delete(proc);
                reject(err);
            });
            proc.on('close', code => {
                clearTimeout(timeoutId);
                this.activeProcesses.delete(proc);
                const result = {
                    exitCode: code,
                    stdout,
                    stderr,
                    duration: Date.now() - startTime,
                    timedOut,
                    retryCount
                };
                if (code !== 0 && !timedOut) {
                    reject(new Error(`Command exited with code ${code}. Stderr: ${stderr}`));
                }
                else {
                    resolve(result);
                }
            });
        });
    }
    killProcess(proc) {
        if (proc.pid) {
            try {
                if (process.platform === 'win32') {
                    const { execSync } = require('child_process');
                    execSync(`taskkill /pid ${proc.pid} /T /F`);
                }
                else {
                    process.kill(-proc.pid);
                }
            }
            catch (e) {
                proc.kill('SIGKILL');
            }
        }
    }
    cleanup() {
        for (const proc of this.activeProcesses) {
            this.killProcess(proc);
        }
        this.activeProcesses.clear();
    }
}
exports.SafeExecutor = SafeExecutor;
