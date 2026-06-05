import { GenerationRouter } from '../src/router/generation-router';
import { NormalizedRequirements } from '@paperclip/shared';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import net from 'net';

const TODO_TEMPLATE = {
  appName: 'Todo App',
  appType: 'todo app',
  features: ['add tasks', 'remove tasks', 'persist tasks'],
  classifiedMode: 'hybrid-fullstack' // We want the full stack for this test!
};

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

async function runGoldenTodo() {
  console.log('🌟 Starting Golden Todo Benchmark...');
  
  const targetDir = await fs.mkdtemp(path.join(os.tmpdir(), `paperclip-golden-todo-`));
  console.log(`\n📂 Target Directory: ${targetDir}`);
  
  try {
    // 1. Generate Todo app
    console.log(`\n⏳ Generating Todo App...`);
    await GenerationRouter.generate(
      TODO_TEMPLATE as NormalizedRequirements,
      targetDir,
      (step, msg) => {
        if (msg.includes('FATAL') || msg.includes('Failed') || msg.includes('Entity:') || msg.includes('Missing:')) {
          console.error(`[GEN] ${msg}`);
        } else if (step % 10 === 0) {
          console.log(`[GEN] Step ${step}: ${msg}`);
        }
      }
    );
    console.log(`✅ Generation & Build Successful.`);

    // 2. Start Servers
    console.log(`\n🚀 Starting servers...`);
    const backendProcess = spawn('pnpm', ['run', 'dev'], { cwd: path.join(targetDir, 'backend'), stdio: 'pipe', shell: true });
    const frontendProcess = spawn('pnpm', ['run', 'dev'], { cwd: path.join(targetDir, 'frontend'), stdio: 'pipe', shell: true });

    backendProcess.stderr.on('data', (d) => console.log(`[backend] ${d.toString().trim()}`));
    frontendProcess.stderr.on('data', (d) => console.log(`[frontend] ${d.toString().trim()}`));

    // Wait for ports
    console.log(`\n📡 Waiting for ports 3001 and 5173...`);
    await Promise.all([
      waitForPort(3001, 30000),
      waitForPort(5173, 30000)
    ]);
    console.log(`✅ Servers are up and running.`);

    // 3. Run Playwright Smoke Test
    console.log(`\n🎭 Running Playwright test...`);
    const playwright = spawn('npx', ['playwright', 'test', 'tests/playwright/todo-smoke.spec.ts', '--workers=1'], {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
      shell: true
    });

    const testPassed = await new Promise((resolve) => {
      playwright.on('close', (code) => {
        resolve(code === 0);
      });
    });

    // Teardown
    console.log(`\n🛑 Tearing down servers...`);
    backendProcess.kill();
    frontendProcess.kill();

    if (!testPassed) {
      console.error('\n💥 Playwright smoke test failed.');
      process.exit(1);
    } else {
      console.log('\n🎉 Golden Todo Benchmark PASSED!');
      process.exit(0);
    }

  } catch (e: any) {
    console.error(`\n❌ Failed to generate or run Todo App!`);
    console.error(e.message);
    process.exit(1);
  }
}

if (require.main === module) {
  runGoldenTodo().catch(e => {
    console.error(e);
    process.exit(1);
  });
}
