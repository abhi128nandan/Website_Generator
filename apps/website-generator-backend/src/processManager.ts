import { spawn, ChildProcess, exec } from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import fsSync from 'fs';
import { processRegistry } from './runtime/process-registry';
import which from 'which';

export type ProjectStatus = 'stopped' | 'starting' | 'running' | 'error';

export interface ProjectProcessState {
  status: ProjectStatus;
  logs: string[];
  processes: ChildProcess[];
  ports?: { frontend: number, backend: number };
}

export interface RuntimeDiagnostics {
  cwd: string;
  workspaceRoot: string;
  prismaDetected: boolean;
  nodeModulesDetected: boolean;
  packageManager: string;
  osPlatform: string;
  databaseUrlPresent: boolean;
  pnpmWorkspaceDetected: boolean;
  npmrcDetected: boolean;
  parentWorkspaceContamination: boolean;
  parentWorkspacePath: string | null;
}

function killProcessTree(pid: number) {
  if (!Number.isInteger(pid) || pid <= 0) return;

  if (os.platform() === 'win32') {
    spawn('taskkill', ['/pid', String(pid), '/T', '/F'], { shell: false });
  } else {
    try {
      process.kill(-pid);
    } catch (e) {
      try { process.kill(pid); } catch (e2) {}
    }
  }
}

/**
 * Walk upward from `startDir` looking for a pnpm-workspace.yaml that is NOT 
 * the one in `startDir` itself. If found, a parent monorepo is contaminating 
 * the generated project's workspace.
 */
function detectParentWorkspace(startDir: string): string | null {
  let dir = path.dirname(startDir); // skip the project's own root
  const root = path.parse(dir).root;
  while (dir !== root) {
    const candidate = path.join(dir, 'pnpm-workspace.yaml');
    if (fsSync.existsSync(candidate)) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  return null;
}

class ProjectRunnerManager {
  private runners: Map<string, ProjectProcessState> = new Map();

  getStatus(projectId: string): ProjectProcessState {
    return this.runners.get(projectId) || { status: 'stopped', logs: [], processes: [] };
  }

  async getDiagnostics(rootPath: string): Promise<RuntimeDiagnostics> {
    const nodeModulesExists = fsSync.existsSync(path.join(rootPath, 'node_modules'));
    const pnpmWorkspaceExists = fsSync.existsSync(path.join(rootPath, 'pnpm-workspace.yaml'));
    const npmrcExists = fsSync.existsSync(path.join(rootPath, '.npmrc'));
    
    let prismaDetected = false;
    const prismaBinPaths = [
      path.join(rootPath, 'node_modules', '.bin', 'prisma'),
      path.join(rootPath, 'node_modules', '.bin', 'prisma.cmd'),
      path.join(rootPath, 'node_modules', 'prisma'),
    ];
    for (const p of prismaBinPaths) {
      if (fsSync.existsSync(p)) {
        prismaDetected = true;
        break;
      }
    }

    let databaseUrlPresent = false;
    try {
      const envPath = path.join(rootPath, '.env');
      if (fsSync.existsSync(envPath)) {
        const envContent = await fs.readFile(envPath, 'utf-8');
        databaseUrlPresent = envContent.includes('DATABASE_URL=');
      }
    } catch (e) {}

    const parentPath = detectParentWorkspace(rootPath);

    return {
      cwd: rootPath,
      workspaceRoot: rootPath,
      prismaDetected,
      nodeModulesDetected: nodeModulesExists,
      packageManager: 'pnpm',
      osPlatform: os.platform(),
      databaseUrlPresent,
      pnpmWorkspaceDetected: pnpmWorkspaceExists,
      npmrcDetected: npmrcExists,
      parentWorkspaceContamination: parentPath !== null,
      parentWorkspacePath: parentPath,
    };
  }

  async start(projectId: string, rootPath: string) {
    if (this.runners.has(projectId)) {
      const current = this.runners.get(projectId)!;
      if (current.status !== 'stopped' && current.status !== 'error') {
        throw new Error('Project is already running or starting.');
      }
    }

    const state: ProjectProcessState = {
      status: 'starting',
      logs: [],
      processes: []
    };
    this.runners.set(projectId, state);

    let backendPort = 0;
    let frontendPort = 0;

    const log = (msg: string) => {
      const ts = new Date().toISOString().split('T')[1].slice(0, -1);
      state.logs.push(`[${ts}] ${msg}`);
      if (state.logs.length > 1000) state.logs.shift();
    };

    const runCommand = (cmd: string, args: string[], name: string, customEnv?: Record<string, string>): Promise<void> => {
      return new Promise(async (resolve, reject) => {
        log(`>>> [${name}] cwd: ${rootPath}`);
        log(`>>> [${name}] Running: ${cmd} ${args.join(' ')}`);
        
        const env = customEnv ? { ...process.env, ...customEnv } : process.env;
        const resolvedCmd = await which(cmd).catch(() => null);
        if (!resolvedCmd) return reject(new Error(`Command not found: ${cmd}`));

        const proc = spawn(resolvedCmd, args, { cwd: rootPath, shell: false, env });
        log(`[process-manager] Registering child process ${proc.pid} (${name})`);
        if (proc.pid) {
          processRegistry.register(proc.pid, 0, projectId);
        }
        
        let prismaSuccess = false;

        proc.stdout?.on('data', (data) => {
          const text = data.toString().trim();
          log(`[${name}] ${text}`);
          if (text.includes('✔ Generated Prisma Client')) {
            prismaSuccess = true;
          }
        });
        proc.stderr?.on('data', (data) => {
          log(`[${name} ERR] ${data.toString().trim()}`);
        });
        
        proc.on('close', (code) => {
          if (proc.pid) {
            processRegistry.unregister(proc.pid);
          }
          if (state.status === 'stopped') {
            log(`[process-manager] Child terminated externally`);
            return resolve(); // Ignored because we already stopped
          }

          if (code === 0 || (name === 'db:generate' && prismaSuccess)) {
            log(`[process-manager] Child exited normally`);
            log(`<<< [${name}] Finished successfully.`);
            resolve();
          } else {
            log(`<<< [${name}] Exited with code ${code}.`);
            reject(new Error(`[${name}] ${cmd} ${args.join(' ')} exited with code ${code}`));
          }
        });
        
        state.processes.push(proc);
      });
    };
    
    const runService = async (cmd: string, args: string[], name: string, customEnv?: Record<string, string>) => {
      log(`>>> [${name}] Starting background service from: ${rootPath}`);
      log(`>>> [${name}] Running: ${cmd} ${args.join(' ')}`);
      
      const env = customEnv ? { ...process.env, ...customEnv } : process.env;
      const resolvedCmd = await which(cmd).catch(() => null);
      if (!resolvedCmd) throw new Error(`Command not found: ${cmd}`);

      const proc = spawn(resolvedCmd, args, { cwd: rootPath, shell: false, env });
      
      if (proc.pid) {
        const port = name === 'api:dev' ? backendPort : frontendPort;
        processRegistry.register(proc.pid, port, projectId);
      }
      
      proc.stdout?.on('data', (data) => {
        const text = data.toString().trim();
        log(`[${name}] ${text}`);
        
        if (name === 'web:dev') {
          const match = text.match(/Local:\s+http:\/\/localhost:(\d+)/);
          if (match) {
            const actualPort = parseInt(match[1]);
            const requestedPort = env.VITE_PORT || 'unknown';
            
            log(`[runtime]`);
            log(`Frontend requested: ${requestedPort}`);
            log(`Frontend actual: ${actualPort}`);
            
            if (state.ports) {
              state.ports.frontend = actualPort;
            } else {
              // Should not happen, but avoid hardcoding 3000 if it does
              state.ports = { frontend: actualPort, backend: env.PORT ? parseInt(env.PORT) : 0 };
            }
            
            fs.readFile(path.join(rootPath, 'runtime.json'), 'utf-8')
              .then(content => {
                const manifest = JSON.parse(content);
                manifest.frontendPort = actualPort;
                return fs.writeFile(path.join(rootPath, 'runtime.json'), JSON.stringify(manifest, null, 2));
              })
              .catch(e => log(`[WARN] Failed to sync actual port to runtime.json: ${e}`));
          }
        }
      });
      proc.stderr?.on('data', (data) => {
        log(`[${name} ERR] ${data.toString().trim()}`);
      });
      
      proc.on('close', (code) => {
        log(`<<< [${name}] Service exited with code ${code}.`);
        if (proc.pid) {
          processRegistry.unregister(proc.pid);
        }
      });
      
      state.processes.push(proc);
    };

    try {
      log('============================================');
      log('=== WEBSITE_GENERATOR PROJECT RUNNER — STARTUP ===');
      log('============================================');
      log(`Platform: ${os.platform()}`);
      log(`Workspace root: ${rootPath}`);
      
      // === MODE DETECTION ===
      let projectMode = 'crud-admin';
      try {
        const metaContent = await fs.readFile(path.join(rootPath, 'metadata.json'), 'utf-8');
        const meta = JSON.parse(metaContent);
        projectMode = meta?.classifiedMode || meta?.generatorMode || 'crud-admin';
      } catch (e) {
        log('[mode] Could not read metadata.json for mode detection, defaulting to crud-admin');
      }
      log(`[mode] Detected project mode: ${projectMode}`);
      
      const needsBackend = projectMode !== 'frontend-app';
      const needsDatabase = projectMode === 'crud-admin' || 
        (projectMode === 'hybrid-fullstack' && fsSync.existsSync(path.join(rootPath, 'database', 'package.json')));
      
      // === ISOLATION CHECK ===
      log('>>> [isolation] Checking for parent workspace contamination...');
      const parentWorkspace = detectParentWorkspace(rootPath);
      if (parentWorkspace) {
        log(`[FATAL] Parent workspace detected at: ${parentWorkspace}`);
        log(`[FATAL] Generated project at ${rootPath} is inside another pnpm workspace.`);
        log(`[FATAL] This will cause pnpm to resolve the parent workspace instead of this project.`);
        log(`[FATAL] Move the project outside of ${parentWorkspace} or abort.`);
        throw new Error(`Parent workspace contamination detected: ${parentWorkspace}`);
      }
      log('<<< [isolation] No parent workspace contamination detected. Project is isolated.');
      
      // === WORKSPACE VALIDATION ===
      log('>>> [workspace] Checking generated root files...');
      const rootFiles = [
        'package.json',
        'pnpm-workspace.yaml',
        '.npmrc',
        '.gitignore',
        '.env.example',
        'README.md',
        'metadata.json',
      ];
      // Sub-files vary by mode
      const subFiles: string[] = ['frontend/package.json'];
      if (needsBackend) subFiles.push('backend/package.json');
      if (needsDatabase) {
        subFiles.push('database/package.json');
        subFiles.push('database/prisma/schema.prisma');
      }

      log('[workspace] Root files:');
      let rootMissing = 0;
      for (const file of rootFiles) {
        const exists = fsSync.existsSync(path.join(rootPath, file));
        log(`  ${exists ? '✓' : '✗'} ${file}`);
        if (!exists) rootMissing++;
      }

      log('[workspace] Sub-package files:');
      let subMissing = 0;
      for (const file of subFiles) {
        const exists = fsSync.existsSync(path.join(rootPath, file));
        log(`  ${exists ? '✓' : '✗'} ${file}`);
        if (!exists) subMissing++;
      }
      
      if (rootMissing > 0) {
        log(`[FATAL] ${rootMissing} root workspace file(s) missing. Cannot proceed.`);
        throw new Error('Invalid workspace structure — missing root files');
      }
      if (subMissing > 0) {
        log(`[WARN] ${subMissing} sub-package file(s) missing. Some services may not start.`);
      }
      log('<<< [workspace] Workspace structure validated.');
      
      // === ENV SETUP ===
      log('>>> [env] Copying .env.example to .env (cross-platform fs.copyFile)');
      const envExamplePath = path.join(rootPath, '.env.example');
      const envPath = path.join(rootPath, '.env');
      try {
        await fs.copyFile(envExamplePath, envPath);
        log('<<< [env] .env created successfully.');
      } catch (e: any) {
        log(`[FATAL] Could not copy .env.example to .env: ${e.message}`);
        throw new Error('Failed to create .env file.');
      }
      
      // === DATABASE_URL VALIDATION (skip for frontend-only) ===
      let envContent = await fs.readFile(envPath, 'utf-8');
      let dbUrl = '';
      let parsedUrl: URL | null = null;
      let databaseConnected = false;
      
      if (needsDatabase) {
        log('>>> [validate] Checking DATABASE_URL...');
        const dotenv = require('dotenv');
        const parsedEnv = dotenv.parse(envContent);
        dbUrl = parsedEnv.DATABASE_URL || '';

        if (!dbUrl) {
          log(`[WARN] DATABASE_URL is missing or empty in .env. Injecting default WebsiteGenerator Core database...`);
          dbUrl = 'postgresql://postgres:postgres@localhost:5432/website_generator_core';
          envContent += `\nDATABASE_URL=${dbUrl}\n`;
          await fs.writeFile(envPath, envContent, 'utf-8');
        }

        if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
          const maskedUrl = dbUrl.length > 5 ? `${dbUrl.substring(0, 5)}...` : '[EMPTY]';
          log(`[FATAL] Invalid DATABASE_URL format: ${maskedUrl}`);
          log(`[FATAL] The .env file must contain a valid DATABASE_URL starting with postgresql:// or postgres://`);
          throw new Error('Invalid DATABASE_URL format');
        }
        
        try {
          parsedUrl = new URL(dbUrl);
          log(`[database] DATABASE_URL protocol: ${parsedUrl.protocol.replace(':', '')}`);
          log(`[database] DATABASE_URL host: ${parsedUrl.hostname}`);
          log(`[database] DATABASE_URL port: ${parsedUrl.port || '5432'}`);
        } catch (e) {
          log(`[WARN] Could not parse DATABASE_URL for diagnostics, but protocol looks valid.`);
        }
        log('<<< [validate] DATABASE_URL validated.');
      } else {
        log('[validate] Skipping DATABASE_URL validation (not required for this mode)');
      }

      // === SYNC ENV TO SUB-PACKAGES ===
      log('>>> [env] Synchronizing .env to sub-packages...');
      if (needsDatabase) {
        const dbEnvPath = path.join(rootPath, 'database', '.env');
        try {
          await fs.mkdir(path.dirname(dbEnvPath), { recursive: true });
          await fs.writeFile(dbEnvPath, envContent, 'utf-8');
          log(`  ✓ Synced database/.env`);
        } catch (e: any) {
          log(`[WARN] Failed to sync database/.env: ${e.message}`);
        }
      }
      if (needsBackend) {
        const backendEnvPath = path.join(rootPath, 'backend', '.env');
        try {
          await fs.mkdir(path.dirname(backendEnvPath), { recursive: true });
          await fs.writeFile(backendEnvPath, envContent, 'utf-8');
          log(`  ✓ Synced backend/.env`);
        } catch (e: any) {
          log(`[WARN] Failed to sync backend/.env: ${e.message}`);
        }
      }
      log('<<< [env] Synchronization complete.');
      
      // === INSTALL ===
      log('>>> [install] Installing all workspace dependencies from root...');
      await runCommand('pnpm', ['install'], 'install');
      log('<<< [install] All dependencies installed.');
      
      // === POST-INSTALL VALIDATION ===
      log('>>> [validate] Post-install checks...');
      const nodeModulesExists = fsSync.existsSync(path.join(rootPath, 'node_modules'));
      if (!nodeModulesExists) {
        log(`[FATAL] node_modules not found at workspace root after install.`);
        throw new Error('node_modules missing after pnpm install');
      }
      log(`  node_modules: FOUND at ${path.join(rootPath, 'node_modules')}`);
      
      if (needsDatabase) {
        const prismaCmd = os.platform() === 'win32' ? 'prisma.cmd' : 'prisma';
        const prismaBinPath = path.join(rootPath, 'node_modules', '.bin', prismaCmd);
        const prismaExists = fsSync.existsSync(prismaBinPath);
        log(`  prisma binary: ${prismaExists ? 'FOUND' : 'NOT FOUND'} at ${prismaBinPath}`);

        const prismaClientExists = fsSync.existsSync(path.join(rootPath, 'node_modules', '@prisma', 'client'));
        log(`  @prisma/client: ${prismaClientExists ? 'FOUND' : 'NOT FOUND'}`);
      } else {
        log('  [skip] Prisma checks skipped (not required for this mode)');
      }
      log('<<< [validate] Post-install checks complete.');
      
      // === PRISMA DIAGNOSTICS & EXECUTION (skip for frontend-only) ===
      if (needsDatabase) {
        log('>>> [prisma] Preparing Prisma execution environment...');
        log(`  cwd: ${path.join(rootPath, 'database')}`);
        log(`  DATABASE_URL detected: true`);
        log(`  DATABASE_URL protocol: ${dbUrl.split(':')[0]}`);
        log(`  DATABASE_URL source: root .env & injected env`);
        
        const prismaEnv = { DATABASE_URL: dbUrl };
        
        log('>>> [db:generate] Running prisma generate via pnpm --filter...');
        await runCommand('pnpm', ['--filter', 'database', 'run', 'generate'], 'db:generate', prismaEnv);
        
        log('>>> [db:push] Running prisma db push via pnpm --filter...');
        try {
          await runCommand('pnpm', ['--filter', 'database', 'run', 'push'], 'db:push', prismaEnv);
          databaseConnected = true;
          log(`[database] DatabaseConnected=true`);
        } catch (e: any) {
          log(`[WARN] Prisma db push failed: ${e.message}`);
          log(`[WARN] This usually means the DATABASE_URL is incorrect or PostgreSQL is not running.`);
          log(`[WARN] Check that your central WebsiteGenerator Core database is accessible.`);
          log(`[WARN] Continuing startup without database connection.`);
          log(`[database] DatabaseConnected=false`);
          databaseConnected = false;
        }
      } else {
        log('[prisma] Skipping Prisma execution (not required for this mode)');
      }
      
      // === PORT ALLOCATION ===
      log('>>> [network] Allocating dynamic ports...');
      const { portManager } = require('./runtime/port-manager');
      
      if (needsBackend) {
        log('[network] Checking backend port availability...');
        backendPort = await portManager.findAvailablePort(3001, 15, (port: number, status: string) => {
          if (status === 'testing') log(`[network] Testing port ${port}...`);
          else if (status === 'occupied') log(`[network] Port occupied`);
          else if (status === 'available') log(`[network] Port available`);
        });
        log(`[network] Allocated backend port: ${backendPort}`);
      } else {
        log('[network] Skipping backend port allocation (frontend-only mode)');
      }

      log('[network] Checking frontend port availability...');
      frontendPort = await portManager.findAvailablePort(5175, 15, (port: number, status: string) => {
        if (status === 'testing') log(`[network] Testing port ${port}...`);
        else if (status === 'occupied') log(`[network] Port occupied`);
        else if (status === 'available') log(`[network] Port available`);
      });
      log(`[network] Allocated frontend port: ${frontendPort}`);
      
      state.ports = { frontend: frontendPort, backend: backendPort };

      // === RUNTIME DIAGNOSTICS & MANIFEST ===
      log('>>> [runtime] Initializing network topology...');
      const backendUrlStr = `http://localhost:${backendPort}`;
      const frontendUrlStr = `http://localhost:${frontendPort}`;
      const parsedBackendUrl = new URL(backendUrlStr);

      const runtimeManifest = {
        backendPort,
        frontendPort,
        frontendUrl: frontendUrlStr,
        databasePort: parsedUrl?.port ? parseInt(parsedUrl.port) : 5432,
        databaseConnected,
      };
      await fs.writeFile(path.join(rootPath, 'runtime.json'), JSON.stringify(runtimeManifest, null, 2));
      log('<<< [network] runtime.json created.');

      log(`[runtime] Backend URL: ${backendUrlStr}`);
      log(`[runtime] Frontend URL: ${frontendUrlStr}`);
      log(`[runtime] Parsed backend hostname: ${parsedBackendUrl.hostname}`);
      log(`[runtime] Parsed backend port: ${parsedBackendUrl.port}`);

      // === START SERVICES ===
      if (needsBackend) {
        log('>>> [api:dev] Starting backend server...');
        await processRegistry.ensurePortFree(backendPort, projectId);
        await runService('pnpm', ['--filter', 'backend', 'run', 'dev'], 'api:dev', { PORT: backendPort.toString() });
      } else {
        log('[api:dev] Skipping backend startup (frontend-only mode)');
      }
      
      log('>>> [web:dev] Starting frontend dev server...');
      await processRegistry.ensurePortFree(frontendPort, projectId);
      
      const startFrontendWithRetry = async (initialPort: number) => {
        let currentPort = initialPort;
        let success = false;
        
        while (!success) {
          log(`[web:dev] Attempting frontend startup on port ${currentPort}`);
          
          await new Promise<void>(async (resolve) => {
            const env = { 
              ...process.env, 
              PORT: currentPort.toString(), 
              VITE_PORT: currentPort.toString(), 
              VITE_API_URL: `http://localhost:${backendPort}` 
            };
            
            const args = ['--filter', 'frontend', 'run', 'dev', '--port', currentPort.toString(), '--strictPort'];
            const resolvedCmd = await which('pnpm').catch(() => null);
            if (!resolvedCmd) {
              log('[FATAL] Command not found: pnpm');
              return resolve();
            }
            const proc = spawn(resolvedCmd, args, { cwd: rootPath, shell: false, env });
            
            if (proc.pid) {
              processRegistry.register(proc.pid, currentPort, projectId);
            }
            
            let failedWithPortInUse = false;
            let startedSuccessfully = false;
            
            proc.stdout?.on('data', (data) => {
              const text = data.toString().trim();
              if (text) {
                text.split('\n').forEach((line: string) => {
                  const t = line.trim();
                  if (t) log(`[web:dev] ${t}`);
                  
                  if (t.includes('is already in use') || t.includes('EADDRINUSE')) {
                    failedWithPortInUse = true;
                  }
                  
                  const match = t.match(/Local:\s+http:\/\/localhost:(\d+)/);
                  if (match && !startedSuccessfully) {
                    startedSuccessfully = true;
                    const actualPort = parseInt(match[1]);
                    log(`[web:dev] Frontend started successfully`);
                    
                    if (state.ports) {
                      state.ports.frontend = actualPort;
                    }
                    if (typeof portManager.reservePort === 'function') {
                      portManager.reservePort(actualPort);
                    }
                    
                    fs.readFile(path.join(rootPath, 'runtime.json'), 'utf-8')
                      .then(content => {
                        const manifest = JSON.parse(content);
                        manifest.frontendPort = actualPort;
                        manifest.frontendUrl = `http://localhost:${actualPort}`;
                        return fs.writeFile(path.join(rootPath, 'runtime.json'), JSON.stringify(manifest, null, 2));
                      })
                      .catch(e => log(`[WARN] Failed to sync actual port to runtime.json: ${e}`));
                    
                    success = true;
                    resolve();
                  }
                });
              }
            });
            
            proc.stderr?.on('data', (data) => {
              const text = data.toString().trim();
              if (text) {
                text.split('\n').forEach((line: string) => {
                  const t = line.trim();
                  if (t) log(`[web:dev ERR] ${t}`);
                  if (t.includes('is already in use') || t.includes('EADDRINUSE')) {
                    failedWithPortInUse = true;
                  }
                });
              }
            });
            
            proc.on('close', (code) => {
              log(`<<< [web:dev] Service exited with code ${code}.`);
              if (proc.pid) {
                processRegistry.unregister(proc.pid);
              }
              if (failedWithPortInUse) {
                log(`[web:dev] Port occupied`);
                if (typeof portManager.releasePort === 'function') {
                  portManager.releasePort(currentPort);
                }
                currentPort++;
                log(`[web:dev] Retrying on port ${currentPort}`);
                resolve();
              } else if (!startedSuccessfully) {
                log(`[web:dev] Exited without starting successfully.`);
                success = true;
                resolve();
              }
            });
            
            state.processes.push(proc);
          });
        }
      };

      await startFrontendWithRetry(frontendPort);
      
      state.status = 'running';
      state.ports = { frontend: state.ports?.frontend || frontendPort, backend: backendPort };
      log('============================================');
      log('=== ALL SERVICES STARTED SUCCESSFULLY ===');
      log('============================================');
      log(`Backend:  http://localhost:${backendPort}`);
      log(`Frontend: http://localhost:${state.ports.frontend}`);
      log('Wait a few seconds for servers to bind.');
    } catch (err: any) {
      log(`[FATAL] Failed to start project: ${err.message}`);
      state.status = 'error';
    }
  }

  stop(projectId: string, force: boolean = false) {
    const state = this.runners.get(projectId);
    if (!state) return;

    if (state.status === 'starting' && !force) {
      state.logs.push(`[process-manager] Startup phase active`);
      state.logs.push(`[process-manager] Cleanup skipped during startup`);
      return;
    }

    state.logs.push(`[system] Stopping all processes...`);
    
    for (const proc of state.processes) {
      if (proc.pid) {
        killProcessTree(proc.pid);
        processRegistry.unregister(proc.pid);
      }
    }
    state.processes = [];
    
    if (state.ports) {
      const { portManager } = require('./runtime/port-manager');
      
      // Forcibly kill any orphaned Vite/Node processes holding these ports
      portManager.killProcessOnPort(state.ports.frontend).catch(() => {});
      portManager.killProcessOnPort(state.ports.backend).catch(() => {});
      
      portManager.releasePort(state.ports.frontend);
      portManager.releasePort(state.ports.backend);

      processRegistry.unregisterPort(state.ports.frontend);
      processRegistry.unregisterPort(state.ports.backend);
    }
    
    state.status = 'stopped';
    state.logs.push(`[system] Stopped.`);
  }
}

export const processManager = new ProjectRunnerManager();
