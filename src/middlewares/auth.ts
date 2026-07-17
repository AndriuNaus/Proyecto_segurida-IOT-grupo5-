import type { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    role: string;
  };
}

export function requireJwt(req: Request, res: Response, next: NextFunction) {
  let token = '';
  const authHeader = req.headers['authorization'] ?? '';
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else if (req.query && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    res.status(401).json({ error: 'Token ausente o malformado' });
    return;
  }

  const claims = AuthService.verifyToken(token);
  if (!claims) {
    res.status(401).json({ error: 'Token inválido o expirado' });
    return;
  }

  (req as AuthenticatedRequest).user = claims;
  next();
}
