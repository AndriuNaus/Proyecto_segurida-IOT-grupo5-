import { Router } from 'express';
import { CameraController } from '../controllers/camera.controller.js';
import { requireJwt } from '../middlewares/auth.js';

const router = Router();

// GET /api/camera/status
router.get('/status', CameraController.getStatus);

// POST /api/camera/configure
router.post('/configure', CameraController.configure);

// POST /api/camera/stream-token  ← NUEVO (público)
// El frontend del compañero manda su token de Supabase y recibe un token
// temporal de 10 minutos para abrir el stream
router.post('/stream-token', CameraController.getStreamToken);

// GET /api/camera/stream  ← Ahora PROTEGIDO con JWT
// Requiere ?token=<streamToken> obtenido desde /stream-token
router.get('/stream', requireJwt, CameraController.stream);

export default router;
