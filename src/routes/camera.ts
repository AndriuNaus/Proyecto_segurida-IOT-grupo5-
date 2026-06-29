import { Router, type Response } from 'express';
import type { AuthenticatedRequest } from '../middlewares/auth.js';

const router = Router();

// Estado simulado en memoria para la cámara ESP32-CAM
export const cameraState = {
  isConnected: false,
  lastActivity: new Date(),
  config: {
    resolution: 'VGA',
    streamQuality: 30, // Calidad del stream JPEG (10-63, menor es mejor calidad en ESP32-CAM)
    motionDetection: false,
    esp32CamUrl: process.env.ESP32_CAM_URL ?? 'http://192.168.1.100:81/stream'
  }
};

const VALID_RESOLUTIONS = ['QVGA', 'VGA', 'SVGA', 'UXGA'];

/**
 * @route GET /api/camera/status
 * @desc Obtener el estado actual de la cámara
 * @access Privado (Requiere JWT)
 */
router.get('/status', (req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({
    status: 'success',
    data: {
      isConnected: cameraState.isConnected,
      lastActivity: cameraState.lastActivity,
      config: cameraState.config,
      userSession: req.user // Retorna info del JWT decodificado
    }
  });
});

/**
 * @route POST /api/camera/configure
 * @desc Modificar los parámetros de streaming y seguridad de la cámara
 * @access Privado (Requiere JWT, rol admin)
 */
router.post('/configure', (req: AuthenticatedRequest, res: Response) => {
  // Solo los administradores pueden cambiar la configuración
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Permisos insuficientes. Se requiere rol de administrador.' });
    return;
  }

  const { resolution, streamQuality, motionDetection, esp32CamUrl } = req.body;

  // 1. Validación de 'resolution'
  if (resolution !== undefined) {
    if (typeof resolution !== 'string' || !VALID_RESOLUTIONS.includes(resolution)) {
      res.status(400).json({ 
        error: `Resolución inválida. Debe ser una de las siguientes: ${VALID_RESOLUTIONS.join(', ')}` 
      });
      return;
    }
    cameraState.config.resolution = resolution;
  }

  // 2. Validación de 'streamQuality'
  if (streamQuality !== undefined) {
    if (typeof streamQuality !== 'number' || streamQuality < 10 || streamQuality > 63) {
      res.status(400).json({ 
        error: 'Calidad de stream inválida. Debe ser un número entre 10 y 63 (factor JPEG).' 
      });
      return;
    }
    cameraState.config.streamQuality = streamQuality;
  }

  // 3. Validación de 'motionDetection'
  if (motionDetection !== undefined) {
    if (typeof motionDetection !== 'boolean') {
      res.status(400).json({ 
        error: 'El parámetro "motionDetection" debe ser un valor booleano (true/false).' 
      });
      return;
    }
    cameraState.config.motionDetection = motionDetection;
  }

  // 4. Validación de 'esp32CamUrl'
  if (esp32CamUrl !== undefined) {
    try {
      new URL(esp32CamUrl); // Intenta parsearlo como URL
    } catch {
      res.status(400).json({ error: 'La URL proporcionada para la ESP32-CAM no es válida.' });
      return;
    }
    cameraState.config.esp32CamUrl = esp32CamUrl;
  }

  cameraState.lastActivity = new Date();
  
  res.status(200).json({
    message: 'Configuración actualizada exitosamente',
    config: cameraState.config
  });
});

export default router;
