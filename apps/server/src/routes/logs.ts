import { Router } from 'express';
import { EventEmitter } from 'events';

const router = Router();

// Global event emitter for generation logs
export const logEmitter = new EventEmitter();

router.get('/:id/logs', (req, res) => {
  const projectId = req.params.id;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const listener = (data: any) => {
    if (data.projectId === projectId) {
      res.write(`data: ${JSON.stringify(data.event)}\n\n`);
      if (data.event.status === 'completed' || data.event.status === 'error') {
        res.end();
        logEmitter.off('log', listener);
      }
    }
  };

  logEmitter.on('log', listener);

  req.on('close', () => {
    logEmitter.off('log', listener);
  });
});

export default router;
