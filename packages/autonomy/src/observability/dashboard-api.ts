import { Router } from 'express';
import { AutonomyEventBus } from './event-bus';
import { ErrorRegistry } from '../errors/error-registry';

const router = Router();

// GET /api/autonomy/:projectId/status
router.get('/:projectId/status', (req, res) => {
  // In a real implementation this would fetch from a central state store
  res.json({ projectId: req.params.projectId, status: 'active' });
});

// GET /api/autonomy/:projectId/errors
router.get('/:projectId/errors', (req, res) => {
  const errors = ErrorRegistry.getTimeline(req.params.projectId);
  res.json({ errors });
});

// GET /api/autonomy/:projectId/repairs
router.get('/:projectId/repairs', (req, res) => {
  res.json({ repairs: [] }); // To be implemented with RepairHistory
});

// GET /api/autonomy/:projectId/timeline
router.get('/:projectId/timeline', (req, res) => {
  res.json({ timeline: [] }); // To be implemented with ExecutionTimeline
});

// SSE Streaming endpoint for real-time dashboard updates
router.get('/:projectId/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const projectId = req.params.projectId;

  const onEvent = (event: any) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  const unsubscribe = AutonomyEventBus.subscribeToProject(projectId, onEvent);

  req.on('close', () => {
    unsubscribe();
  });
});

export const autonomyRoutes: Router = router;
