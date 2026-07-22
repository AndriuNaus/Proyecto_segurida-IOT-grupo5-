import axios from 'axios';
import type { Response } from 'express';
import { CameraRepository, type CameraConfig } from '../repositories/camera.repository.js';

// Lista de clientes HTTP activos viendo el stream en vivo (compartido para evitar múltiples conexiones a la ESP32)
export const streamClients = new Set<Response>();

export function closeAllStreamClients() {
  for (const client of streamClients) {
    try {
      client.end();
    } catch (err) {}
  }
  streamClients.clear();
}

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
        const envUrl = process.env.ESP32_CAM_URL;
        if (envUrl && config.esp32CamUrl !== envUrl) {
          config.esp32CamUrl = envUrl;
          await CameraRepository.updateConfig(config);
          console.log(`URL de la cámara actualizada en la Base de Datos con el valor del .env: ${envUrl}`);
        }
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
    const now = Date.now();
    const last = cameraState.lastActivity ? new Date(cameraState.lastActivity).getTime() : 0;
    const isRecentlyActive = (now - last) < 15000; // Actividad en los últimos 15 segundos

    return {
      status: 'success',
      data: {
        isConnected: cameraState.isConnected || isRecentlyActive,
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
    }

    // Enviar los cambios de configuración en tiempo real a la placa física ESP32-CAM
    const camUrl = cameraState.config.esp32CamUrl;
    try {
      const urlObj = new URL(camUrl);
      const baseUrl = `${urlObj.protocol}//${urlObj.host}`;

      if (updates.resolution !== undefined) {
        const resMapping: Record<string, number> = {
          'QVGA': 8,
          'VGA': 11,
          'SVGA': 12,
          'UXGA': 16
        };
        const val = resMapping[updates.resolution];
        if (val !== undefined) {
          console.log(`Enviando comando de resolución a la ESP32-CAM: ${baseUrl}/control?var=framesize&val=${val}`);
          await axios.get(`${baseUrl}/control?var=framesize&val=${val}`, { timeout: 3000 });
        }
      }

      if (updates.streamQuality !== undefined) {
        console.log(`Enviando comando de calidad a la ESP32-CAM: ${baseUrl}/control?var=quality&val=${updates.streamQuality}`);
        await axios.get(`${baseUrl}/control?var=quality&val=${updates.streamQuality}`, { timeout: 3000 });
      }
    } catch (err: any) {
      console.warn("No se pudo aplicar la configuración en la ESP32-CAM física (¿está desconectada o no soporta /control?):", err.message);
    }

    cameraState.lastActivity = new Date();
    return cameraState.config;
  }
};
