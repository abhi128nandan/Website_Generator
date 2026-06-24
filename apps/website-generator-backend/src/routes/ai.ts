import { Router } from 'express';
import { HealthChecker } from '@website-generator/ai-engine';

import fs from 'fs/promises';
import path from 'path';

const router = Router();
const envPath = path.join(process.cwd(), '..', '..', '.env');

router.get('/status', async (req, res) => {
  const status = await HealthChecker.check();
  res.json(status);
});

router.get('/settings/provider', async (req, res) => {
  res.json({
    provider: process.env.AI_PROVIDER || 'groq',
    groqApiKey: process.env.GROQ_API_KEY ? '••••••••' : '',
    openRouterApiKey: process.env.OPENROUTER_API_KEY ? '••••••••' : '',
    ollamaUrl: process.env.OLLAMA_API_URL || 'http://localhost:11434',
  });
});

router.post('/settings/provider', async (req, res) => {
  try {
    const { provider, groqApiKey, openRouterApiKey, ollamaUrl } = req.body;

    // Update process.env in memory
    if (provider) process.env.AI_PROVIDER = provider;
    if (groqApiKey && groqApiKey !== '••••••••') process.env.GROQ_API_KEY = groqApiKey;
    if (openRouterApiKey && openRouterApiKey !== '••••••••') process.env.OPENROUTER_API_KEY = openRouterApiKey;
    if (ollamaUrl) process.env.OLLAMA_API_URL = ollamaUrl;

    // Write to .env file
    let envContent = '';
    try {
      envContent = await fs.readFile(envPath, 'utf-8');
    } catch (e) {
      // File might not exist
    }

    const envLines = envContent.split('\n');
    const updateEnv = (key: string, value: string) => {
      const idx = envLines.findIndex(l => l.startsWith(`${key}=`));
      if (idx >= 0) {
        envLines[idx] = `${key}=${value}`;
      } else {
        envLines.push(`${key}=${value}`);
      }
    };

    if (provider) updateEnv('AI_PROVIDER', provider);
    if (groqApiKey && groqApiKey !== '••••••••') updateEnv('GROQ_API_KEY', groqApiKey);
    if (openRouterApiKey && openRouterApiKey !== '••••••••') updateEnv('OPENROUTER_API_KEY', openRouterApiKey);
    if (ollamaUrl) updateEnv('OLLAMA_API_URL', ollamaUrl);

    await fs.writeFile(envPath, envLines.join('\n').trim() + '\n');

    // Force health check to run immediately bypassing cache
    const status = await HealthChecker.check(true);

    res.json({ success: true, status });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update provider settings', details: err.message });
  }
});

export default router;
