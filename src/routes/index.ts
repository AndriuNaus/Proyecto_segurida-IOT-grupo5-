import { Router } from 'express';
import authRoutes from './auth.routes.js';
import cameraRoutes from './camera.routes.js';
import { requireJwt } from '../middlewares/auth.js';

const router = Router();

// Rutas de Autenticación (Públicas)
router.use('/auth', authRoutes);

// Rutas de la Cámara (Protegidas por JWT)
router.use('/camera', requireJwt, cameraRoutes);

export default router;
