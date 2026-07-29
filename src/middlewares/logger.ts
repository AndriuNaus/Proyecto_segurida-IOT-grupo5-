import type { Request, Response, NextFunction } from 'express';
import { BackendRegistroRepository } from '../repositories/backend_registro.repository.js';

// Rutas que NO se loguean en BD (para no saturar con pings internos)
const RUTAS_IGNORADAS = ['/health', '/favicon.ico'];

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  // Capturamos el body antes de que Express lo consuma
  const payloadSnapshot = req.body ? JSON.stringify(req.body) : null;

  // Interceptamos el método json() para capturar la respuesta
  const originalJson = res.json.bind(res);
  let respuestaCapturada: string | null = null;

  res.json = (body: any) => {
    respuestaCapturada = JSON.stringify(body);
    return originalJson(body);
  };

  res.on('finish', () => {
    const duracion = Date.now() - start;
    const statusCode = res.statusCode;

    // Log en consola (siempre)
    console.log(`${req.method} ${req.path} -> ${statusCode} (${duracion}ms)`);

    // No guardamos rutas ignoradas ni assets estáticos
    const esRutaIgnorada = RUTAS_IGNORADAS.includes(req.path) || req.path.startsWith('/assets');
    if (esRutaIgnorada) return;

    // Guardar en Supabase de forma asíncrona (sin await para no bloquear)
    BackendRegistroRepository.registrar({
      endpoint: req.path,
      metodo: req.method,
      payload: payloadSnapshot,
      respuesta_backend: respuestaCapturada,
      codigo_estado: statusCode,
    }).catch(() => {
      // Silencioso: no rompemos nada si falla el log
    });
  });

  next();
}
