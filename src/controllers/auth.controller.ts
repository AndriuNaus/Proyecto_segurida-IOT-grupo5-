import type { Request, Response, NextFunction } from 'express';
import { LoginSchema, RegisterSchema } from '../schemas/auth.schema.js';
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
    } catch (error: any) {
      if (error.message === 'NOT_VERIFIED') {
        res.status(403).json({ error: 'Por favor, verifica tu correo electrónico antes de iniciar sesión.' });
        return;
      }
      next(error); // Permite al errorHandler global procesar los errores de validación de Zod
    }
  },

  /**
   * Registra un nuevo usuario en la base de datos.
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 1. Validar datos de entrada con Zod
      const validatedData = RegisterSchema.parse(req.body);

      // 2. Ejecutar lógica de negocio
      await AuthService.register(validatedData);

      // 3. Responder
      res.status(201).json({
        message: 'Usuario registrado exitosamente'
      });
    } catch (error) {
      if (error instanceof Error && (error.message.includes('ya se encuentra registrado') || error.message.includes('ya está registrado'))) {
        res.status(400).json({ error: error.message });
        return;
      }
      next(error);
    }
  },

  /**
   * Verifica el correo del usuario mediante el token
   */
  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;
      
      if (!token) {
        res.status(400).json({ error: 'Token no proporcionado.' });
        return;
      }

      const tokenStr = Array.isArray(token) ? token[0] : token;
      const success = await AuthService.verifyEmail(tokenStr as string);

      if (!success) {
        res.status(400).json({ error: 'Token inválido o expirado.' });
        return;
      }

      res.status(200).json({ message: 'Correo verificado con éxito. Ya puedes iniciar sesión.' });
    } catch (error) {
      next(error);
    }
  }
};

