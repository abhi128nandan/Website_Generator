import { Request, Response, NextFunction } from 'express';

export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers['x-api-key'];
  const expected = process.env.INTERNAL_API_KEY;

  if (!expected) {
    if (process.env.NODE_ENV === 'production') {
      res.status(500).json({ error: 'Server misconfiguration: INTERNAL_API_KEY not set' });
      return;
    }
    next();
    return;
  }

  if (!key || key !== expected) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
}
