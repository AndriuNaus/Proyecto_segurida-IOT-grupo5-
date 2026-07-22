import { cameraAPI } from './apiService';

/**
 * Modelo para la gestión de estado de la Cámara ESP32-CAM.
 * Delega las peticiones HTTP al servicio de API independiente (apiService).
 */
export const cameraModel = {
  /**
   * Obtiene el estado actual de la cámara (conectividad, configuración actual).
   * @param {string} token - Token JWT de autenticación.
   * @returns {Promise<object>} Estado de la cámara retornado por el backend.
   */
  getStatus: async (token) => {
    return cameraAPI.getStatus(token);
  },

  /**
   * Envía una nueva configuración a la cámara (resolución, calidad, detección de movimiento, URL del ESP32-Cam).
   * @param {string} token - Token JWT del usuario administrador.
   * @param {object} configData - Objeto con los parámetros de configuración.
   * @returns {Promise<object>} Respuesta del servidor tras actualizar la configuración.
   */
  configure: async (token, configData) => {
    return cameraAPI.configure(token, configData);
  },

  /**
   * Construye y retorna la URL del endpoint del stream de video HTTP/MJPEG proxy de la cámara.
   * @param {string} token - Token JWT de autenticación.
   * @returns {string} URL completa del stream.
   */
  getStreamUrl: (token) => {
    return cameraAPI.getStreamUrl(token);
  }
};

