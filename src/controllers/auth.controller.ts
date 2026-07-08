import type { Request, Response, NextFunction } from 'express';
import { LoginSchema } from '../schemas/auth.schema.js';
import { AuthService } from '../services/auth.service.js';

export const AuthController = {
  /**
   * Inicia sesión y genera un JWT para el usuario.
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 1. Validar datos de entrada con Zod
      const { username, password } = LoginSchema.parse(req.body);

      // 2. Ejecutar lógica de negocio
      const token = await AuthService.login(username, password);

      if (!token) {
        res.status(401).json({ error: 'Credenciales inválidas' });
        return;
      }

      // 3. Responder
      res.status(200).json({
        message: 'Autenticación exitosa',
        token
      });
    } catch (error) {
      next(error); // Permite al errorHandler global procesar los errores de validación de Zod
    }
  }
};
