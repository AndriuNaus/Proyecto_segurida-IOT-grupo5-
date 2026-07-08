import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Si es un error de validación de Zod
  if (err instanceof ZodError) {
    // Retornamos un 422 con los detalles de cada campo inválido
    const details = err.issues.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }));
    
    res.status(422).json({
      error: 'Datos de entrada inválidos',
      details
    });
    return;
  }

  // Otros errores no controlados
  console.error('Error no controlado:', err.stack || err);
  res.status(500).json({ error: 'Error interno en el servidor' });
}
