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

// 3. Obtener el stream de video de la cámara principal (PULL) - AHORA PROTEGIDO
// Validará el JWT temporal enviado por query: ?token=ey...
router.get('/stream', requireJwt, CameraController.stream);

// 4. Obtener el stream de video de la cámara 2 (PULL) - AHORA PROTEGIDO
router.get('/stream2', requireJwt, CameraController.stream2);

export default router;
