import type { Request, Response, NextFunction } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET ?? 'secreto-super-seguro-clase-iot';

function base64urlDecode(str: string): string {
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}

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

  const parts = token.split('.');
  if (parts.length !== 3) {
    res.status(401).json({ error: 'Token malformado' });
    return;
  }

  const [headerB64, payloadB64, sigB64] = parts as [string, string, string];

  try {
    const header = JSON.parse(base64urlDecode(headerB64));
    if (header.alg !== 'HS256') {
      res.status(401).json({ error: 'Algoritmo no permitido' });
      return;
    }

    const expectedSig = createHmac('sha256', JWT_SECRET)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    // Comparamos usando timingSafeEqual para evitar ataques de temporización
    const sigBuf = Buffer.from(sigB64);
    const expectedSigBuf = Buffer.from(expectedSig);

    if (sigBuf.length !== expectedSigBuf.length || !timingSafeEqual(sigBuf, expectedSigBuf)) {
      res.status(401).json({ error: 'Firma inválida' });
      return;
    }

    const claims = JSON.parse(base64urlDecode(payloadB64));

    const now = Math.floor(Date.now() / 1000);
    if (claims.exp && claims.exp < now) {
      res.status(401).json({ error: 'Token expirado' });
      return;
    }
    if (!claims.sub) {
      res.status(401).json({ error: 'Claim sub ausente' });
      return;
    }

    (req as AuthenticatedRequest).user = { 
      sub: claims.sub, 
      role: claims.role ?? 'guest' 
    };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
}
