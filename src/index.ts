import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import axios from 'axios';
import path from 'path';
import { requestLogger } from './middlewares/logger.js';
import { rateLimiter } from './middlewares/rateLimiter.js';
import mainRouter from './routes/index.js';
import { initializeDatabase } from './config/database.js';
import { cameraState, CameraService, streamClients, closeAllStreamClients } from './services/camera.service.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middlewares globales
app.use(express.json());
app.use(requestLogger);
app.use(rateLimiter);

// Archivos estáticos de la interfaz web
app.use(express.static('public'));

// Escuchar cambios de URL para reconectar el stream inmediatamente al actualizar configuración
app.post('/api/camera/configure', (_req, res, next) => {
  // Dejamos que Express ejecute la ruta de configuración primero, y después reiniciamos el stream.
  res.on('finish', () => {
    console.log('Configuración de cámara cambiada, reiniciando proxy de video...');
    iniciarProxyVideo();
  });
  next();
});

// Endpoint público para recibir el flujo de imágenes (frames) de la ESP32-CAM (Modo Push)
app.post('/api/camera/upload', (req, res) => {
  const chunks: Buffer[] = [];
  
  req.on('data', (chunk: Buffer) => {
    chunks.push(chunk);
  });

  req.on('end', () => {
    const buffer = Buffer.concat(chunks);
    
    if (buffer.length > 0) {
      // 1. Emitir frame a través de Socket.io (en formato Base64)
      const base64Data = buffer.toString('base64');
      io.emit('video_frame', base64Data);

      // 2. Retransmitir en vivo (MJPEG) a todos los clientes HTTP conectados (MJPEG stream)
      const boundary = '123456789000000000000987654321';
      const header = `\r\n--${boundary}\r\nContent-Type: image/jpeg\r\nContent-Length: ${buffer.length}\r\n\r\n`;
      
      for (const client of streamClients) {
        try {
          client.write(Buffer.from(header));
          client.write(buffer);
        } catch (err) {
          streamClients.delete(client);
        }
      }

      // 3. Actualizar estado de la cámara
      cameraState.isConnected = true;
      cameraState.lastActivity = new Date();
    }
    
    res.status(200).send('OK');
  });

  req.on('error', (err: any) => {
    console.error('Error al recibir frame subido por la ESP32-CAM:', err.message);
    res.status(500).send('Error');
  });
});

// Enrutador Principal de la API (unificado y ordenado)
app.use('/api', mainRouter);

// Fallback para React Router (SPA) - sirve index.html para rutas no-API
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.resolve('public', 'index.html'));
});

// Manejo de errores global (incluye formateador de Zod a 422)
app.use(errorHandler);

// Proxy de video ESP32-CAM a Socket.io (Modo Pull)
let streamAbortController: AbortController | null = null;

async function iniciarProxyVideo() {
  const url = cameraState.config.esp32CamUrl;
  
  // Si la configuración está en 'push', desactivar el proxy activo (esperando conexiones entrantes)
  if (!url || url.toLowerCase() === 'push' || url.toLowerCase() === 'none') {
    console.log('Modo de recepción PUSH activo (Servidor en espera de frames de la ESP32-CAM en /api/camera/upload).');
    cameraState.isConnected = false;
    if (streamAbortController) {
      streamAbortController.abort();
      streamAbortController = null;
    }
    return;
  }

  // Cancelar stream anterior si existe
  if (streamAbortController) {
    streamAbortController.abort();
  }
  streamAbortController = new AbortController();

  console.log(`Intentando conectar al stream de la ESP32-CAM en: ${url}`);

  try {
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'stream',
      signal: streamAbortController.signal,
      timeout: 10000
    });

    console.log('¡Conexión establecida con la ESP32-CAM!');
    cameraState.isConnected = true;
    cameraState.lastActivity = new Date();

    response.data.on('data', (chunk: Buffer) => {
      // Convertir el chunk a base64 (mantenemos compatibilidad)
      const base64Data = chunk.toString('base64');
      io.emit('video_frame', base64Data);

      // Transmitir el chunk directamente a todos los clientes HTTP conectados
      for (const client of streamClients) {
        try {
          client.write(chunk);
        } catch (err) {
          streamClients.delete(client);
        }
      }
    });

    response.data.on('close', () => {
      console.log('Stream de ESP32-CAM cerrado.');
      cameraState.isConnected = false;
      closeAllStreamClients();
      intentarReconexion();
    });

    response.data.on('error', (err: Error) => {
      console.error('Error en stream de datos de ESP32-CAM:', err.message);
      cameraState.isConnected = false;
      closeAllStreamClients();
      intentarReconexion();
    });

  } catch (error: any) {
    if (axios.isCancel(error)) {
      console.log('Conexión de stream cancelada por cambio de configuración.');
      closeAllStreamClients();
      return;
    }
    console.error('Error conectando con la ESP32-CAM:', error.message);
    cameraState.isConnected = false;
    closeAllStreamClients();
    intentarReconexion();
  }
}

function intentarReconexion() {
  setTimeout(() => {
    // Si la URL sigue siendo la misma o cambió, intentamos reconectar
    iniciarProxyVideo();
  }, 5000);
}

// Inicializar base de datos y luego arrancar servicios
initializeDatabase()
  .then(async () => {
    await CameraService.loadCameraConfigFromDb();
    iniciarProxyVideo();
  })
  .catch((err) => {
    console.error('Error al inicializar la base de datos MySQL/MariaDB:', err.message);
    iniciarProxyVideo();
  });

// Evento Socket.io para clientes de la interfaz
io.on('connection', (socket) => {
  console.log(`Cliente web conectado al dashboard: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`Cliente web desconectado: ${socket.id}`);
  });
});

const PORT = process.env.PORT ?? 3000;
httpServer.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
