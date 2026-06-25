import { Router } from 'express';
import { ConversationalEditor } from '@website-generator/generators';
import path from 'path';
import os from 'os';
import { validateUUID } from '../middleware/validateInput';

const router = Router();
const WEBSITE_GENERATOR_PROJECTS_ROOT = path.join(os.homedir(), 'WebsiteGeneratorProjects', 'projects');

router.post('/', async (req, res) => {
  const { projectId, prompt } = req.body;
  if (!projectId || !prompt) {
    return res.status(400).json({ error: 'Missing projectId or prompt' });
  }

  if (!validateUUID(projectId)) {
    return res.status(400).json({ error: 'Invalid projectId format' });
  }

  const targetDir = path.resolve(WEBSITE_GENERATOR_PROJECTS_ROOT, projectId);

  if (!targetDir.startsWith(path.resolve(WEBSITE_GENERATOR_PROJECTS_ROOT) + path.sep)) {
    return res.status(400).json({ error: 'Invalid project path' });
  }
  
  // Quick validation
  const fs = require('fs/promises');
  try {
    await fs.access(targetDir);
  } catch {
    return res.status(404).json({ error: 'Project not found' });
  }

  // Fire off the edit process in the background
  res.json({ message: 'Edit started', projectId });

  try {
    await ConversationalEditor.edit(targetDir, prompt, (msg) => {
      // In a real app we'd emit via SSE or WebSockets to the frontend
      console.log(`[EDIT-${projectId}] ${msg}`);
    });
  } catch (err: any) {
    console.error(`[EDIT-${projectId}] Failed: ${err.message}`);
  }
});

export default router;
