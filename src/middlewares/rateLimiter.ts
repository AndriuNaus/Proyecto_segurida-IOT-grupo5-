import type { Request, Response, NextFunction } from 'express';

const WINDOW_MS = 60 * 1000; // 1 minuto
const MAX_REQUESTS = 60;     // Máximo 60 peticiones por minuto

interface ClientRequests {
  count: number;
  resetTime: number;
}

const clients = new Map<string, ClientRequests>();

// Limpieza periódica de memoria para evitar fugas (cada 5 minutos)
setInterval(() => {
  const now = Date.now();
  for (const [ip, client] of clients.entries()) {
    if (now > client.resetTime) {
      clients.delete(ip);
    }
  }
}, 5 * 60 * 1000).unref(); // unref evita que mantenga el proceso activo en tests

export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  // Excluir el stream de video del límite de peticiones
  if (req.path === '/api/camera/stream' || req.path === '/camera/stream') {
    return next();
  }

  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  const client = clients.get(ip);

  if (!client) {
    clients.set(ip, {
      count: 1,
      resetTime: now + WINDOW_MS,
    });
    return next();
  }

  // Si la ventana de tiempo ya expiró, reiniciamos el contador
  if (now > client.resetTime) {
    client.count = 1;
    client.resetTime = now + WINDOW_MS;
    return next();
  }

  client.count += 1;

  if (client.count > MAX_REQUESTS) {
    res.status(429).json({
      error: 'Demasiadas peticiones. Por favor intente más tarde.'
    });
    return;
  }

  next();
}
