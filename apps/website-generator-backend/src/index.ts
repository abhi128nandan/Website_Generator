import './env';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { Logger } from '@website-generator/shared';
import healthRoutes from './routes/health';
import aiRoutes from './routes/ai';
import projectRoutes from './routes/projects';
import generateRoutes from './routes/generate';
import logsRoutes from './routes/logs';
import editRoutes from './routes/edit';
import { autonomyRoutes } from '@website-generator/autonomy';
import { HealthChecker } from '@website-generator/ai-engine';

// Shadow File Startup Guard
function checkShadowFiles(dir: string): string[] {
  let results: string[] = [];
  try {
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat && stat.isDirectory()) {
        results = results.concat(checkShadowFiles(fullPath));
      } else if (file.endsWith('.js')) {
        results.push(fullPath);
      }
    }
  } catch (e) {
    // Ignore read errors
  }
  return results;
}

const shadowFiles = checkShadowFiles(__dirname);
if (shadowFiles.length > 0) {
  Logger.error('[FATAL] Stale compiled JavaScript shadow files detected in src directory:');
  shadowFiles.forEach(file => Logger.error(`  - ${file}`));
  Logger.error('[FATAL] This causes module resolution drift. Delete these files and rebuild. Aborting startup.');
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  Logger.info(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/edit', editRoutes);
app.use('/api/projects', logsRoutes);
app.use('/api/autonomy', autonomyRoutes);

import { processRegistry } from './runtime/process-registry';

const startServer = async () => {
  await processRegistry.ensurePortFree(Number(port), 'main-server');

  const server = app.listen(port, async () => {
    Logger.info(`Server is running on port ${port}`);
    processRegistry.register(process.pid, Number(port), 'main-server');
    
    // LLM Provider Startup Diagnostics
    const status = await HealthChecker.check();
    Logger.info(`[LLM] Provider: ${status.provider}`);
    Logger.info(`[LLM] Model: ${status.model}`);
    Logger.info(`[LLM] Connectivity: ${status.aiStatus === 'ok' ? 'healthy' : 'unhealthy - ' + status.message}`);
  });
};

startServer().catch(err => {
  Logger.error('Failed to start server', err);
});
