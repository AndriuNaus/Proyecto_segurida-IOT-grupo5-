import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../middlewares/auth.js';
import { ConfigureCameraSchema } from '../schemas/camera.schema.js';
import { CameraService } from '../services/camera.service.js';

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
  }
};
