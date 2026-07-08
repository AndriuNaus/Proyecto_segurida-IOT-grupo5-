import type { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    role: string;
  };
}

export function requireJwt(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'] ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

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
