import { GenerationRouter } from '../src/router/generation-router';
import { NormalizedRequirements } from '@website-generator/shared';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import net from 'net';

const BENCHMARKS = [
  {
    appName: 'Calculator App',
    appType: 'calculator',
    features: ['basic math operations', 'addition', 'subtraction', 'multiplication', 'division'],
    classifiedMode: 'frontend-app', // No backend needed for calculator
    testFile: 'tests/playwright/calculator-smoke.spec.ts'
  },
  {
    appName: 'Todo App',
    appType: 'todo list',
    features: ['add tasks', 'remove tasks', 'mark as completed'],
    classifiedMode: 'hybrid-fullstack',
    testFile: 'tests/playwright/todo-smoke.spec.ts'
  },
  {
    appName: 'Inventory App',
    appType: 'inventory management',
    features: ['add products', 'update stock', 'view catalog', 'delete products'],
    classifiedMode: 'crud-admin',
    testFile: 'tests/playwright/crud-smoke.spec.ts'
  },
  {
    appName: 'CRM App',
    appType: 'crm',
    features: ['manage contacts', 'update statuses', 'add leads', 'delete leads'],
    classifiedMode: 'crud-admin',
    testFile: 'tests/playwright/crud-smoke.spec.ts'
  },
  {
    appName: 'Student Management App',
    appType: 'student portal',
    features: ['add students', 'update grades', 'view roster', 'delete students'],
    classifiedMode: 'crud-admin',
    testFile: 'tests/playwright/crud-smoke.spec.ts'
  }
];

async function waitForPort(port: number, timeout = 30000): Promise<void> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryConnect = () => {
      const socket = new net.Socket();
      socket.setTimeout(1000);
      socket.on('connect', () => {
        socket.destroy();
        resolve();
      });
      socket.on('timeout', () => {
        socket.destroy();
        if (Date.now() - start > timeout) reject(new Error(`Timeout waiting for port ${port}`));
        else setTimeout(tryConnect, 1000);
      });
      socket.on('error', () => {
        socket.destroy();
        if (Date.now() - start > timeout) reject(new Error(`Timeout waiting for port ${port}`));
        else setTimeout(tryConnect, 1000);
      });
      socket.connect(port, '127.0.0.1');
    };
    tryConnect();
  });
}

async function runBenchmark(benchmark: any): Promise<boolean> {
  console.log(`\n======================================================`);
  console.log(`🌟 Starting Benchmark: ${benchmark.appName}`);
  console.log(`======================================================\n`);
  
  const targetDir = await fs.mkdtemp(path.join(os.tmpdir(), `website-generator-benchmark-`));
  console.log(`📂 Target Directory: ${targetDir}`);
  
  let backendProcess: any = null;
  let frontendProcess: any = null;

  try {
    // 1. Generate App
    console.log(`⏳ Generating ${benchmark.appName}...`);
    await GenerationRouter.generate(
      benchmark as NormalizedRequirements,
      targetDir,
      (step, msg) => {
        // Suppress very verbose logging in the orchestrator, just show errors or major steps
        if (msg.includes('FATAL') || msg.includes('Failed')) {
          console.error(`[GEN] ${msg}`);
        } else if (step % 20 === 0) {
          console.log(`[GEN] ${msg}`);
        }
      }
    );
    console.log(`✅ Generation & Build Successful.`);

    // 2. Start Servers
    console.log(`🚀 Starting servers...`);
    
    frontendProcess = spawn('pnpm', ['run', 'dev'], { cwd: path.join(targetDir, 'frontend'), stdio: 'pipe', shell: true });
    
    const waitForPorts = [waitForPort(5173, 30000)];

    if (benchmark.classifiedMode !== 'frontend-app') {
      backendProcess = spawn('pnpm', ['run', 'dev'], { cwd: path.join(targetDir, 'backend'), stdio: 'pipe', shell: true });
      waitForPorts.push(waitForPort(3001, 30000));
    }

    // Wait for ports
    console.log(`📡 Waiting for ports to be ready...`);
    await Promise.all(waitForPorts);
    console.log(`✅ Servers are up and running.`);

    // 3. Run Playwright Smoke Test
    console.log(`🎭 Running Playwright test: ${benchmark.testFile}...`);
    const playwright = spawn('npx', ['playwright', 'test', benchmark.testFile, '--workers=1'], {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
      shell: true
    });

    const testPassed = await new Promise((resolve) => {
      playwright.on('close', (code) => {
        resolve(code === 0);
      });
    });

    if (!testPassed) {
      console.error(`💥 Playwright smoke test failed for ${benchmark.appName}.`);
      return false;
    } else {
      console.log(`🎉 Benchmark PASSED: ${benchmark.appName}`);
      return true;
    }

  } catch (e: any) {
    console.error(`❌ Failed to generate or run ${benchmark.appName}!`);
    console.error(e.message);
    return false;
  } finally {
    // Teardown
    console.log(`🛑 Tearing down servers for ${benchmark.appName}...`);
    if (backendProcess) backendProcess.kill();
    if (frontendProcess) frontendProcess.kill();
  }
}

async function runAllBenchmarks() {
  const results = [];
  for (const b of BENCHMARKS) {
    const success = await runBenchmark(b);
    results.push({ name: b.appName, success });
  }

  console.log(`\n\n======================================================`);
  console.log(`🏆 GOLDEN BENCHMARKS REPORT`);
  console.log(`======================================================`);
  let allPassed = true;
  for (const r of results) {
    console.log(`- ${r.name}: ${r.success ? '✅ PASSED' : '❌ FAILED'}`);
    if (!r.success) allPassed = false;
  }
  
  if (!allPassed) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

if (require.main === module) {
  runAllBenchmarks().catch(e => {
    console.error(e);
    process.exit(1);
  });
}
