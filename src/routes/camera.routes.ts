import { Router } from 'express';
import { CameraController } from '../controllers/camera.controller.js';

const router = Router();

// GET /api/camera/status
router.get('/status', CameraController.getStatus);

// POST /api/camera/configure
router.post('/configure', CameraController.configure);

// GET /api/camera/stream
router.get('/stream', CameraController.stream);

export default router;
