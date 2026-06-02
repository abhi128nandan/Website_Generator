import * as fs from 'fs';
import * as path from 'path';
import { exec, execSync } from 'child_process';

export interface RegisteredProcess {
  pid: number;
  port: number;
  projectId: string;
  startTime: number;
}

export class ProcessRegistry {
  private registryFile: string;
  private processes: Map<number, RegisteredProcess> = new Map();

  constructor() {
    this.registryFile = path.resolve(process.cwd(), 'process-registry.json');
    this.load();
    this.setupGracefulShutdown();
  }

  private load() {
    try {
      if (fs.existsSync(this.registryFile)) {
        const content = fs.readFileSync(this.registryFile, 'utf8');
        const list: RegisteredProcess[] = JSON.parse(content);
        this.processes.clear();
        for (const entry of list) {
          if (this.isProcessAlive(entry.pid)) {
            this.processes.set(entry.pid, entry);
          }
        }
      }
    } catch (e) {
      // Quiet fail if not accessible
    }
  }

  private save() {
    try {
      const list = Array.from(this.processes.values());
      fs.writeFileSync(this.registryFile, JSON.stringify(list, null, 2), 'utf8');
    } catch (e) {
      // Quiet fail
    }
  }

  isProcessAlive(pid: number): boolean {
    try {
      process.kill(pid, 0);
      return true;
    } catch (e: any) {
      return e.code === 'EPERM';
    }
  }

  register(pid: number, port: number, projectId: string) {
    const startTime = Date.now();
    const entry: RegisteredProcess = { pid, port, projectId, startTime };
    this.processes.set(pid, entry);
    this.save();

    console.log("[RUNTIME]\nProcess Registered");
    console.log(`[RUNTIME] Process Registered: pid=${pid}, port=${port}, projectId=${projectId}, startTime=${startTime}`);

    console.log("[RUNTIME]\nPort Reserved");
    console.log(`[RUNTIME] Port Reserved: ${port}`);
  }

  unregister(pid: number) {
    const entry = this.processes.get(pid);
    if (entry) {
      this.processes.delete(pid);
      this.save();

      console.log("[RUNTIME]\nPort Released");
      console.log(`[RUNTIME] Port Released: ${entry.port}`);

      console.log("[RUNTIME]\nProcess Terminated");
      console.log(`[RUNTIME] Process Terminated: pid=${pid}`);
    }
  }

  unregisterPort(port: number) {
    let found = false;
    for (const [pid, entry] of this.processes.entries()) {
      if (entry.port === port) {
        this.processes.delete(pid);
        found = true;
      }
    }
    if (found) {
      this.save();
      console.log("[RUNTIME]\nPort Released");
      console.log(`[RUNTIME] Port Released: ${port}`);
    }
  }

  getProcessByPort(port: number): RegisteredProcess | undefined {
    this.load();
    return Array.from(this.processes.values()).find(p => p.port === port);
  }

  getProcessesByProject(projectId: string): RegisteredProcess[] {
    this.load();
    return Array.from(this.processes.values()).filter(p => p.projectId === projectId);
  }

  getAllProcesses(): RegisteredProcess[] {
    this.load();
    return Array.from(this.processes.values());
  }

  getPidForPort(port: number): number | null {
    try {
      if (process.platform === 'win32') {
        const output = execSync(`netstat -aon | findstr :${port}`, { encoding: 'utf8' });
        const lines = output.trim().split('\n');
        for (const line of lines) {
          if (line.includes('LISTENING')) {
            const parts = line.trim().split(/\s+/);
            const pidStr = parts[parts.length - 1];
            const pid = parseInt(pidStr, 10);
            if (!isNaN(pid)) return pid;
          }
        }
      } else {
        const output = execSync(`lsof -t -i:${port}`, { encoding: 'utf8' });
        const pid = parseInt(output.trim(), 10);
        if (!isNaN(pid)) return pid;
      }
    } catch (e) {
      // Ignore if no process or port is free
    }
    return null;
  }

  async terminateProcessCleanly(pid: number, port?: number): Promise<void> {
    if (port) {
      this.unregisterPort(port);
    } else {
      this.unregister(pid);
    }

    console.log("[RUNTIME]\nProcess Terminated");
    console.log(`[RUNTIME] Process Terminated: pid=${pid}`);

    return new Promise((resolve) => {
      if (process.platform === 'win32') {
        exec(`taskkill /pid ${pid} /T /F`, () => resolve());
      } else {
        try {
          process.kill(pid, 'SIGTERM');
          setTimeout(() => {
            try {
              process.kill(pid, 'SIGKILL');
            } catch (e) {}
            resolve();
          }, 500);
        } catch (e) {
          resolve();
        }
      }
    });
  }

  async ensurePortFree(port: number, projectId: string): Promise<void> {
    const registryEntry = this.getProcessByPort(port);
    if (registryEntry) {
      console.log(`[RUNTIME] Port ${port} is registered to project ${registryEntry.projectId} with PID ${registryEntry.pid}`);
      if (this.isProcessAlive(registryEntry.pid)) {
        console.log(`[RUNTIME] Process PID ${registryEntry.pid} is still alive. Terminating cleanly...`);
        await this.terminateProcessCleanly(registryEntry.pid, port);
      } else {
        console.log(`[RUNTIME] Registered process PID ${registryEntry.pid} is dead. Cleaning up registry...`);
        this.unregister(registryEntry.pid);
      }
    }

    const activePid = this.getPidForPort(port);
    if (activePid) {
      console.log(`[RUNTIME] Port ${port} is physically occupied by PID ${activePid}. Terminating cleanly...`);
      await this.terminateProcessCleanly(activePid, port);
    }
  }

  private setupGracefulShutdown() {
    const shutdown = async (signal: string) => {
      console.log(`[RUNTIME] Received ${signal}. Shutting down all registered processes...`);
      const list = this.getAllProcesses();
      for (const entry of list) {
        if (this.isProcessAlive(entry.pid)) {
          console.log(`[RUNTIME] Terminating PID ${entry.pid} on port ${entry.port} before exit`);
          await this.terminateProcessCleanly(entry.pid, entry.port);
        }
      }
      process.exit(0);
    };

    if (!(process as any)._registryShutdownHandlersRegistered) {
      process.on('SIGINT', () => shutdown('SIGINT'));
      process.on('SIGTERM', () => shutdown('SIGTERM'));
      process.on('exit', () => {
        const list = this.getAllProcesses();
        for (const entry of list) {
          if (this.isProcessAlive(entry.pid)) {
            if (process.platform === 'win32') {
              try { execSync(`taskkill /pid ${entry.pid} /T /F`); } catch (e) {}
            } else {
              try { process.kill(entry.pid, 'SIGKILL'); } catch (e) {}
            }
          }
        }
      });
      (process as any)._registryShutdownHandlersRegistered = true;
    }
  }
}

export const processRegistry = new ProcessRegistry();
