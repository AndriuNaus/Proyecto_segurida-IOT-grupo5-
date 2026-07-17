import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../middlewares/auth.js';
import { ConfigureCameraSchema } from '../schemas/camera.schema.js';
import { CameraService, streamClients } from '../services/camera.service.js';

export const CameraController = {
  /**
   * Obtiene el estado actual y la configuración de la cámara.
   */
  getStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    try {
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
   * Transmite el stream MJPEG directamente desde la ESP32-CAM al cliente.
   */
  async stream(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    res.setHeader('Content-Type', 'multipart/x-mixed-replace;boundary=123456789000000000000987654321');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, pre-check=0, post-check=0, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Registrar el cliente HTTP para recibir los chunks de video del stream principal
    streamClients.add(res);

    req.on('close', () => {
      streamClients.delete(res);
    });
  }
};
