import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../middlewares/auth.js';
import { ConfigureCameraSchema } from '../schemas/camera.schema.js';
import { CameraService, streamClients, streamClients2 } from '../services/camera.service.js';
import { UserRepository } from '../repositories/user.repository.js';
import { companionSupabase } from '../config/supabase.js';
import { AuthService } from '../services/auth.service.js';

export const CameraController = {
  /**
   * Obtiene el estado actual y la configuración de la cámara.
   */
  async getStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Autorización removida para permitir acceso como microservicio
      const statusData = CameraService.getCameraStatus(req.user);
      res.status(200).json(statusData);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Modifica los parámetros de configuración de la cámara (Solo Admin).
   */
  async configure(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // 1. Control de Rol (Autorización en Capa de Control)
      if (req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Permisos insuficientes. Se requiere rol de administrador.' });
        return;
      }

      // 2. Validar esquema de entrada con Zod
      const updates = ConfigureCameraSchema.parse(req.body);

      // 3. Ejecutar actualización a través del servicio
      const updatedConfig = await CameraService.configureCamera(updates);

      // 4. Retornar respuesta de éxito
      res.status(200).json({
        message: 'Configuración actualizada exitosamente',
        config: updatedConfig
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Valida el token de Supabase del compañero y entrega un token temporal
   * de 10 minutos para acceder al stream MJPEG desde el frontend.
   */
  async getStreamToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!companionSupabase) {
        res.status(503).json({
          error: 'Servicio no disponible. Configura COMPANION_SUPABASE_URL y COMPANION_SUPABASE_ANON_KEY en el .env'
        });
        return;
      }

      const supabaseToken = req.headers['authorization']?.replace('Bearer ', '') ||
                            (req.body as any)?.supabaseToken as string | undefined;

      if (!supabaseToken) {
        res.status(401).json({ error: 'Se requiere el token de Supabase del compañero.' });
        return;
      }

      // Verificar el token contra el Supabase del compañero
      const { data, error } = await companionSupabase.auth.getUser(supabaseToken);

      if (error || !data?.user) {
        res.status(401).json({ error: 'Token de Supabase inválido o expirado.' });
        return;
      }

      // Generar token temporal de 10 minutos para el stream
      const streamToken = AuthService.generateStreamToken(
        data.user.email ?? data.user.id
      );

      res.status(200).json({
        streamToken,
        expiresIn: 600,
        message: 'Token válido por 10 minutos. Úsalo como ?token=<streamToken> en el stream.'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Transmite el stream MJPEG directamente desde la ESP32-CAM al cliente.
   * Requiere un token temporal válido obtenido desde /api/camera/stream-token
   */
  async stream(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    // IMPORTANTE: El boundary debe coincidir EXACTAMENTE con el que usa la ESP32-CAM (frame)
    res.setHeader('Content-Type', 'multipart/x-mixed-replace;boundary=frame');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, pre-check=0, post-check=0, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Registrar el cliente HTTP para recibir los chunks de video del stream principal
    streamClients.add(res);

    req.on('close', () => {
      streamClients.delete(res);
    });
  },

  async stream2(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    res.setHeader('Content-Type', 'multipart/x-mixed-replace;boundary=frame');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, pre-check=0, post-check=0, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    streamClients2.add(res);

    req.on('close', () => {
      streamClients2.delete(res);
    });
  }
};
