/**
 * Servicio Centralizado de API HTTP (apiService)
 * Ubicado en models/ para mantener todas las APIs y modelos juntos.
 * Encapsula todas las peticiones fetch hacia los endpoints REST del backend Express.
 */

const BASE_URL = 'https://iot-security.pro/api';

/**
 * Helper para realizar peticiones HTTP de forma estandarizada y manejar respuestas/errores.
 */
async function httpRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  if (options.token) {
    defaultHeaders['Authorization'] = `Bearer ${options.token}`;
  }

  const config = {
    method: options.method || 'GET',
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || data.message || `Error HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`Error en petición API [${config.method} ${url}]:`, error.message);
    throw error;
  }
}

/**
 * APIs del Módulo de Autenticación
 */
export const authAPI = {
  /**
   * Inicia sesión en el servidor y retorna el token JWT.
   */
  login: async (username, password) => {
    return httpRequest('/auth/login', {
      method: 'POST',
      body: { username, password }
    });
  },

  /**
   * Registra un nuevo usuario en la base de datos MySQL/MariaDB del servidor.
   */
  register: async (userData) => {
    return httpRequest('/auth/register', {
      method: 'POST',
      body: userData
    });
  },

  /**
   * Verifica el correo usando el token enviado
   */
  verifyEmail: async (token) => {
    return httpRequest(`/auth/verify-email/${token}`, {
      method: 'GET'
    });
  }
};
/**
 * APIs del Módulo de la Cámara ESP32-CAM
 */
export const cameraAPI = {
  /**
   * Obtiene el estado actual de la cámara (conectividad, configuración actual).
   */
  getStatus: async (token) => {
    return httpRequest('/camera/status', {
      method: 'GET',
      token
    });
  },

  /**
   * Actualiza la configuración de la cámara (resolución, calidad, URL, detección de movimiento).
   */
  configure: async (token, configData) => {
    return httpRequest('/camera/configure', {
      method: 'POST',
      token,
      body: configData
    });
  },

  /**
   * Genera la URL para consumir el stream MJPEG proxy.
   */
  getStreamUrl: (token) => {
    if (!token) return '';
    return `${BASE_URL}/camera/stream?token=${encodeURIComponent(token)}`;
  },

  /**
   * Genera la URL para consumir el stream MJPEG de la Cámara 2.
   */
  getStreamUrl2: (token) => {
    if (!token) return '';
    return `${BASE_URL}/camera/stream2?token=${encodeURIComponent(token)}`;
  }
};

/**
 * APIs del Módulo de Alertas
 */
export const alertsAPI = {
  /**
   * Envía una alerta al backend para notificar al usuario vía Telegram
   */
  sendAlert: async (token, alertData) => {
    return httpRequest('/alerts', {
      method: 'POST',
      token,
      body: alertData
    });
  }
};

/**
 * APIs del Módulo de Usuarios (Admin)
 */
export const usersAPI = {
  getClients: async (token) => {
    return httpRequest('/users/clients', {
      method: 'GET',
      token
    });
  },

  updateCameraAccess: async (token, username, can_view_camera) => {
    return httpRequest(`/users/${username}/camera-access`, {
      method: 'PATCH',
      token,
      body: { can_view_camera }
    });
  }
};

/**
 * APIs del Módulo de Mascotas
 */
export const mascotasAPI = {
  getAll: async (token) => {
    return httpRequest('/mascotas', { method: 'GET', token });
  },
  create: async (token, mascotaData) => {
    return httpRequest('/mascotas', { method: 'POST', token, body: mascotaData });
  },
  delete: async (token, id) => {
    return httpRequest(`/mascotas/${id}`, { method: 'DELETE', token });
  }
};

export default {
  auth: authAPI,
  alerts: alertsAPI,
  users: usersAPI,
  mascotas: mascotasAPI
};
