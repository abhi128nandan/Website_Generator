import { spawn, ChildProcess } from 'child_process';
import path from 'path';

export interface SafeExecOptions {
  cwd: string;
  env?: Record<string, string>;
  timeoutMs?: number;
  retries?: number;
}

export interface SafeExecResult {
  exitCode: number | null;
  stdout: string;
  stderr: string;
  duration: number;
  timedOut: boolean;
  retryCount: number;
}

export class SafeExecutor {
  // ALLOWLIST approach — only commands in this set can execute
  private static ALLOWED_COMMANDS = new Set([
    'pnpm', 'npm', 'npx', 'node', 'tsc', 'prisma', 'vite',
  ]);

  private activeProcesses: Set<ChildProcess> = new Set();

  constructor() {
    // Cleanup on process exit
    process.on('exit', () => this.cleanup());
  }

  private isCommandSafe(command: string): boolean {
    // Extract just the binary name, ignoring path prefix
    const binary = path.basename(command).split('.')[0].toLowerCase();
    return SafeExecutor.ALLOWED_COMMANDS.has(binary);
  }

  async execute(command: string, args: string[], options: SafeExecOptions): Promise<SafeExecResult> {
    const fullCommand = `${command} ${args.join(' ')}`;
    
    if (!this.isCommandSafe(fullCommand)) {
      throw new Error(`Command blocked by SafeExec policies: ${fullCommand}`);
    }

    const maxRetries = options.retries ?? 0;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        return await this.executeOnce(command, args, options, attempt);
      } catch (error: any) {
        if (attempt === maxRetries) throw error;
        // Exponential backoff: 500ms, 1000ms, 2000ms...
        await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt)));
        attempt++;
      }
    }
    
    throw new Error('Unreachable');
  }

  private executeOnce(command: string, args: string[], options: SafeExecOptions, retryCount: number): Promise<SafeExecResult> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const timeoutMs = options.timeoutMs ?? 120000; // 2 min default
      
      let stdout = '';
      let stderr = '';
      let timedOut = false;
      
      const env = options.env ? { ...process.env, ...options.env } : process.env;
      
      const proc = spawn(command, args, { 
        cwd: options.cwd, 
        env,
        shell: false
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
        
        const result: SafeExecResult = {
          exitCode: code,
          stdout,
          stderr,
          duration: Date.now() - startTime,
          timedOut,
          retryCount
        };

        if (code !== 0 && !timedOut) {
          reject(new Error(`Command exited with code ${code}. Stderr: ${stderr}`));
        } else {
          resolve(result);
        }
      });
    });
  }

  private killProcess(proc: ChildProcess) {
    if (proc.pid) {
      try {
        if (process.platform === 'win32') {
          const { execSync } = require('child_process');
          execSync(`taskkill /pid ${proc.pid} /T /F`);
        } else {
          process.kill(-proc.pid);
        }
      } catch (e) {
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
