"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const generation_router_1 = require("../src/router/generation-router");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const child_process_1 = require("child_process");
const net_1 = __importDefault(require("net"));
const TODO_TEMPLATE = {
    appName: 'Todo App',
    appType: 'todo app',
    features: ['add tasks', 'remove tasks', 'persist tasks'],
    classifiedMode: 'hybrid-fullstack' // We want the full stack for this test!
};
async function waitForPort(port, timeout = 30000) {
    const start = Date.now();
    return new Promise((resolve, reject) => {
        const tryConnect = () => {
            const socket = new net_1.default.Socket();
            socket.setTimeout(1000);
            socket.on('connect', () => {
                socket.destroy();
                resolve();
            });
            socket.on('timeout', () => {
                socket.destroy();
                if (Date.now() - start > timeout)
                    reject(new Error(`Timeout waiting for port ${port}`));
                else
                    setTimeout(tryConnect, 1000);
            });
            socket.on('error', () => {
                socket.destroy();
                if (Date.now() - start > timeout)
                    reject(new Error(`Timeout waiting for port ${port}`));
                else
                    setTimeout(tryConnect, 1000);
            });
            socket.connect(port, '127.0.0.1');
        };
        tryConnect();
    });
}
async function runGoldenTodo() {
    console.log('🌟 Starting Golden Todo Benchmark...');
    const targetDir = await promises_1.default.mkdtemp(path_1.default.join(os_1.default.tmpdir(), `website-generator-golden-todo-`));
    console.log(`\n📂 Target Directory: ${targetDir}`);
    try {
        // 1. Generate Todo app
        console.log(`\n⏳ Generating Todo App...`);
        await generation_router_1.GenerationRouter.generate(TODO_TEMPLATE, targetDir, (step, msg) => {
            if (msg.includes('FATAL') || msg.includes('Failed') || msg.includes('Entity:') || msg.includes('Missing:')) {
                console.error(`[GEN] ${msg}`);
            }
            else if (step % 10 === 0) {
                console.log(`[GEN] Step ${step}: ${msg}`);
            }
        });
        console.log(`✅ Generation & Build Successful.`);
        // 2. Start Servers
        console.log(`\n🚀 Starting servers...`);
        const backendProcess = (0, child_process_1.spawn)('pnpm', ['run', 'dev'], { cwd: path_1.default.join(targetDir, 'backend'), stdio: 'pipe', shell: true });
        const frontendProcess = (0, child_process_1.spawn)('pnpm', ['run', 'dev'], { cwd: path_1.default.join(targetDir, 'frontend'), stdio: 'pipe', shell: true });
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
        const playwright = (0, child_process_1.spawn)('npx', ['playwright', 'test', 'tests/playwright/todo-smoke.spec.ts', '--workers=1'], {
            cwd: path_1.default.resolve(__dirname, '..'),
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
        }
        else {
            console.log('\n🎉 Golden Todo Benchmark PASSED!');
            process.exit(0);
        }
    }
    catch (e) {
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
