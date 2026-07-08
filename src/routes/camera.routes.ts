import { Router } from 'express';
import { CameraController } from '../controllers/camera.controller.js';

const router = Router();

// GET /api/camera/status
router.get('/status', CameraController.getStatus);

// POST /api/camera/configure
router.post('/configure', CameraController.configure);

export default router;
