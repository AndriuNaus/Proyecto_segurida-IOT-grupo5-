import { CameraRepository, type CameraConfig } from '../repositories/camera.repository.js';

// Estado simulado en memoria para la cámara ESP32-CAM (sincronizado con la base de datos)
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

export const CameraService = {
  /**
   * Carga la configuración de la cámara de la base de datos al estado en memoria.
   */
  async loadCameraConfigFromDb(): Promise<void> {
    try {
      const config = await CameraRepository.getConfig();
      if (config) {
        cameraState.config = config;
        console.log("Configuración de cámara cargada desde la base de datos:", cameraState.config);
      }
    } catch (err: any) {
      console.error("Error en CameraService al cargar configuración:", err.message);
    }
  },

  /**
   * Obtiene el estado consolidado de la cámara.
   */
  getCameraStatus(userSession?: any) {
    return {
      status: 'success',
      data: {
        isConnected: cameraState.isConnected,
        lastActivity: cameraState.lastActivity,
        config: cameraState.config,
        userSession
      }
    };
  },

  /**
   * Actualiza parcialmente la configuración en memoria y la persiste en la base de datos.
   */
  async configureCamera(updates: Partial<CameraConfig>): Promise<CameraConfig> {
    // Aplicar las actualizaciones al estado en memoria
    if (updates.resolution !== undefined) {
      cameraState.config.resolution = updates.resolution;
    }
    if (updates.streamQuality !== undefined) {
      cameraState.config.streamQuality = updates.streamQuality;
    }
    if (updates.motionDetection !== undefined) {
      cameraState.config.motionDetection = updates.motionDetection;
    }
    if (updates.esp32CamUrl !== undefined) {
      cameraState.config.esp32CamUrl = updates.esp32CamUrl;
    }

    try {
      // Guardar en la base de datos a través del repositorio
      await CameraRepository.updateConfig(cameraState.config);
      console.log("Configuración de cámara guardada en la base de datos desde CameraService.");
    } catch (err: any) {
      console.error("Error al persistir la configuración en la base de datos desde CameraService:", err.message);
      // No bloqueamos el flujo para tolerar caídas temporales de base de datos
    }

    cameraState.lastActivity = new Date();
    return cameraState.config;
  }
};
