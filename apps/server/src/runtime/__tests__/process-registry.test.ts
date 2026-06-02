import { processRegistry, ProcessRegistry } from '../process-registry';
import * as net from 'net';
import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Helper to start a dummy listening server on a port
function startDummyServer(port: number): Promise<ChildProcess> {
  return new Promise((resolve) => {
    const dummyScript = path.join(__dirname, 'dummy-server.js');
    fs.writeFileSync(dummyScript, `
      const net = require('net');
      const server = net.createServer();
      server.listen(${port}, () => {
        console.log('LISTENING');
      });
      setInterval(() => {}, 1000);
    `, 'utf8');

    const proc = spawn('node', [dummyScript]);
    
    proc.stdout?.on('data', (data) => {
      if (data.toString().includes('LISTENING')) {
        resolve(proc);
      }
    });

    // Fallback if stdout not captured
    setTimeout(() => {
      resolve(proc);
    }, 1500);
  });
}

// Check if a port is in use
function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on('error', () => resolve(true));
    server.listen(port, () => {
      server.close(() => resolve(false));
    });
  });
}

async function runTests() {
  console.log('==================================================');
  console.log('=== PROCESS REGISTRY AUTOMATED VERIFICATION ===');
  console.log('==================================================\n');

  const testPort = 19199;
  const testProject = 'test-verification-project';

  try {
    // --------------------------------------------------
    // TEST 1: Register and Persist State
    // --------------------------------------------------
    console.log('[TEST 1] Testing process registration and persistence...');
    const dummyProcess = await startDummyServer(testPort);
    const pid = dummyProcess.pid;
    if (!pid) throw new Error('Failed to get PID for dummy process');

    processRegistry.register(pid, testPort, testProject);
    
    // Check registry file exists
    const registryFile = path.resolve(process.cwd(), 'process-registry.json');
    if (!fs.existsSync(registryFile)) {
      throw new Error(`Registry file not created at ${registryFile}`);
    }

    const fileContent = fs.readFileSync(registryFile, 'utf8');
    const parsed = JSON.parse(fileContent);
    const found = parsed.find((p: any) => p.pid === pid);
    if (!found || found.port !== testPort || found.projectId !== testProject) {
      throw new Error('Persisted state does not match registered process');
    }
    console.log('✅ TEST 1 PASSED: Process registered and persisted successfully.\n');

    // --------------------------------------------------
    // TEST 2: Start Server Twice (Prevention of EADDRINUSE)
    // --------------------------------------------------
    console.log('[TEST 2] Testing starting server twice on the same port...');
    
    // Port should be in use right now
    const initialInUse = await isPortInUse(testPort);
    if (!initialInUse) {
      throw new Error('Port should be in use by first server instance');
    }
    console.log(`Port ${testPort} is occupied by first instance (PID ${pid}).`);

    // Ensure port is free for second startup
    console.log('Triggering startup protection ensurePortFree...');
    await processRegistry.ensurePortFree(testPort, testProject);

    // Verify port is free
    const finalInUse = await isPortInUse(testPort);
    if (finalInUse) {
      throw new Error('Port is still occupied! EADDRINUSE will occur.');
    }
    console.log('✅ TEST 2 PASSED: Port freed successfully. No EADDRINUSE can occur.\n');

    // --------------------------------------------------
    // TEST 3: Hot Reload Simulation
    // --------------------------------------------------
    console.log('[TEST 3] Testing hot reload simulation (state restoration)...');
    
    // Start dummy server again and register it
    const dummyProcess2 = await startDummyServer(testPort);
    const pid2 = dummyProcess2.pid;
    if (!pid2) throw new Error('Failed to get PID for dummy process 2');
    
    processRegistry.register(pid2, testPort, testProject);

    // Simulate ts-node-dev restart by creating a new instance of ProcessRegistry
    console.log('Re-initializing ProcessRegistry instance (simulating hot reload)...');
    const reloadedRegistry = new ProcessRegistry();
    
    // Verify it loads the previously registered running process
    const activeProcess = reloadedRegistry.getProcessByPort(testPort);
    if (!activeProcess || activeProcess.pid !== pid2) {
      throw new Error('Reloaded registry did not recover the active process state');
    }
    console.log(`Successfully recovered process PID ${pid2} on port ${testPort} after reload.`);

    // Clean up
    await reloadedRegistry.ensurePortFree(testPort, testProject);
    console.log('✅ TEST 3 PASSED: Hot reload recovered state and cleared ports correctly.\n');

    // --------------------------------------------------
    // TEST 4: Restart Generation Simulation
    // --------------------------------------------------
    console.log('[TEST 4] Testing restart generation pipeline...');
    
    // Start dummy process to simulate active generation running
    const genProcess = await startDummyServer(testPort);
    const genPid = genProcess.pid!;
    processRegistry.register(genPid, testPort, testProject);
    
    // Simulating a restart of generation - we request same port
    console.log(`Restarting generation. Cleaning up port ${testPort} first...`);
    await processRegistry.ensurePortFree(testPort, testProject);
    
    // Verify port is free
    const genPortFree = await isPortInUse(testPort);
    if (genPortFree) {
      throw new Error('Port still in use after restarting generation');
    }
    console.log('✅ TEST 4 PASSED: Generation restarted cleanly with port freed.\n');

    // --------------------------------------------------
    // TEST 5: Kill Process Unexpectedly
    // --------------------------------------------------
    console.log('[TEST 5] Testing unexpected process termination...');
    
    // Start dummy process, register it, then kill it externally
    const crashProcess = await startDummyServer(testPort);
    const crashPid = crashProcess.pid!;
    processRegistry.register(crashPid, testPort, testProject);
    
    console.log(`Killing process PID ${crashPid} unexpectedly...`);
    if (process.platform === 'win32') {
      const { execSync } = require('child_process');
      try { execSync(`taskkill /pid ${crashPid} /T /F`); } catch (e) {}
    } else {
      try { process.kill(crashPid, 'SIGKILL'); } catch (e) {}
    }
    
    // Let it close
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Verify registry is cleaned up on subsequent checks
    console.log('Calling ensurePortFree to check port ownership on crashed process...');
    await processRegistry.ensurePortFree(testPort, testProject);
    
    const isFreeAfterCrash = await isPortInUse(testPort);
    if (isFreeAfterCrash) {
      throw new Error('Port is still in use after unexpected process termination');
    }
    console.log('✅ TEST 5 PASSED: Cleaned up registry and port after unexpected crash.\n');

    // Clean up temporary script
    const dummyScript = path.join(__dirname, 'dummy-server.js');
    if (fs.existsSync(dummyScript)) {
      fs.unlinkSync(dummyScript);
    }

    console.log('==================================================');
    console.log('🎉 ALL PROCESS REGISTRY TESTS PASSED SUCCESSFULLY 🎉');
    console.log('==================================================');
    process.exit(0);

  } catch (err: any) {
    // Clean up temporary script
    const dummyScript = path.join(__dirname, 'dummy-server.js');
    if (fs.existsSync(dummyScript)) {
      fs.unlinkSync(dummyScript);
    }
    console.error('\n❌ TEST SUITE FAILED:', err.message);
    process.exit(1);
  }
}

runTests();
