import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import axios from 'axios';
import { requestLogger } from './middlewares/logger.js';
import { rateLimiter } from './middlewares/rateLimiter.js';
import { requireJwt } from './middlewares/auth.js';
import authRoutes from './routes/auth.js';
import cameraRoutes, { cameraState } from './routes/camera.js';

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

// Rutas Públicas
app.use('/api/auth', authRoutes);

// Rutas Privadas (Protegidas por JWT)
app.use('/api/camera', requireJwt, cameraRoutes);

// Manejo de errores global
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error no controlado:', err.stack);
  res.status(500).json({ error: 'Error interno en el servidor' });
});

// Proxy de video ESP32-CAM a Socket.io
let streamAbortController: AbortController | null = null;

async function iniciarProxyVideo() {
  // Cancelar stream anterior si existe
  if (streamAbortController) {
    streamAbortController.abort();
  }
  streamAbortController = new AbortController();

  const url = cameraState.config.esp32CamUrl;
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
      // Convertir el chunk a base64
      const base64Data = chunk.toString('base64');
      // Emitir a todos los clientes WebSockets
      io.emit('video_frame', base64Data);
    });

    response.data.on('close', () => {
      console.log('Stream de ESP32-CAM cerrado.');
      cameraState.isConnected = false;
      intentarReconexion();
    });

    response.data.on('error', (err: Error) => {
      console.error('Error en stream de datos de ESP32-CAM:', err.message);
      cameraState.isConnected = false;
      intentarReconexion();
    });

  } catch (error: any) {
    if (axios.isCancel(error)) {
      console.log('Conexión de stream cancelada por cambio de configuración.');
      return;
    }
    console.error('Error conectando con la ESP32-CAM:', error.message);
    cameraState.isConnected = false;
    intentarReconexion();
  }
}

function intentarReconexion() {
  setTimeout(() => {
    // Si la URL sigue siendo la misma o cambió, intentamos reconectar
    iniciarProxyVideo();
  }, 5000);
}

// Iniciar el proxy al arrancar
iniciarProxyVideo();

// Escuchar cambios de URL para reconectar el stream inmediatamente
app.post('/api/camera/configure', (_req, res, next) => {
  // Dejamos que Express ejecute la ruta de configuración primero, y después reiniciamos el stream.
  res.on('finish', () => {
    console.log('Configuración de cámara cambiada, reiniciando proxy de video...');
    iniciarProxyVideo();
  });
  next();
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
