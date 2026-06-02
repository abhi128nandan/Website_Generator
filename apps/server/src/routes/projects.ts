import { Router } from 'express';
import { ProjectRegistry } from '../registry';
import { processManager } from '../processManager';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const projects = await ProjectRegistry.getProjects();
    res.json(projects);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const project = await ProjectRegistry.getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

import { exec } from 'child_process';
import os from 'os';

router.delete('/:id', async (req, res) => {
  try {
    await ProjectRegistry.deleteProject(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/open', async (req, res) => {
  try {
    const project = await ProjectRegistry.getProject(req.params.id);
    const targetPath = project?.rootPath || project?.path;
    
    if (!project || !targetPath) {
      return res.status(404).json({ error: 'Project or path not found' });
    }

    const command = os.platform() === 'win32' 
      ? `start "" "${targetPath}"`
      : os.platform() === 'darwin' 
        ? `open "${targetPath}"` 
        : `xdg-open "${targetPath}"`;

    exec(command, (err) => {
      if (err) {
        console.error('Failed to open folder:', err);
        return res.status(500).json({ error: 'Failed to open folder' });
      }
      res.json({ success: true });
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

import fs from 'fs/promises';
import path from 'path';

// Helper for building file tree recursively
async function buildFileTree(dirPath: string, rootPath: string): Promise<any> {
  const result: any[] = [];
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(rootPath, fullPath);
      
      if (entry.isDirectory()) {
        result.push({
          name: entry.name,
          type: 'directory',
          path: relativePath,
          children: await buildFileTree(fullPath, rootPath)
        });
      } else {
        result.push({
          name: entry.name,
          type: 'file',
          path: relativePath
        });
      }
    }
  } catch (e) {
    console.error('Error building file tree:', e);
  }
  return result;
}

router.get('/:id/files', async (req, res) => {
  try {
    const project = await ProjectRegistry.getProject(req.params.id);
    const rootPath = project?.rootPath || project?.path;
    
    if (!rootPath) {
      return res.status(404).json({ error: 'Project path not found' });
    }
    
    const tree = await buildFileTree(rootPath, rootPath);
    res.json({ files: tree });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/file', async (req, res) => {
  try {
    const project = await ProjectRegistry.getProject(req.params.id);
    const rootPath = project?.rootPath || project?.path;
    
    if (!rootPath) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const relativePath = req.query.path as string;
    if (!relativePath) {
      return res.status(400).json({ error: 'Path is required' });
    }
    
    const absolutePath = path.resolve(rootPath, relativePath);
    if (!absolutePath.startsWith(path.resolve(rootPath))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const content = await fs.readFile(absolutePath, 'utf-8');
    res.json({ content });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

import archiver from 'archiver';

router.get('/:id/download', async (req, res) => {
  try {
    const project = await ProjectRegistry.getProject(req.params.id);
    const rootPath = project?.rootPath || project?.path;
    if (!project || !rootPath) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.attachment(`${project.name || 'project'}.zip`);
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    archive.on('error', (err: any) => {
      res.status(500).send({ error: err.message });
    });

    archive.pipe(res);
    archive.directory(rootPath, false);
    archive.finalize();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Runner endpoints
router.post('/:id/run', async (req, res) => {
  try {
    const project = await ProjectRegistry.getProject(req.params.id);
    const rootPath = project?.rootPath || project?.path;
    if (!project || !rootPath) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Start asynchronously
    processManager.start(req.params.id, rootPath).catch(err => {
      console.error('Runner error:', err);
    });
    
    res.json({ success: true, status: 'starting' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/stop', async (req, res) => {
  try {
    processManager.stop(req.params.id, true);
    res.json({ success: true, status: 'stopped' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/status', async (req, res) => {
  try {
    const state = processManager.getStatus(req.params.id);
    res.json({ status: state.status, logs: state.logs, ports: state.ports });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/runtime', async (req, res) => {
  try {
    const project = await ProjectRegistry.getProject(req.params.id);
    const rootPath = project?.rootPath || project?.path;
    if (!project || !rootPath) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const diagnostics = await processManager.getDiagnostics(rootPath);
    res.json(diagnostics);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
