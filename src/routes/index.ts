import { Router } from 'express';
import authRoutes from './auth.routes.js';
import cameraRoutes from './camera.routes.js';
import alertsRoutes from './alerts.routes.js';
import residentRoutes from './resident.routes.js';
import userRoutes from './user.routes.js';
import mascotaRoutes from './mascota.routes.js';
import { requireJwt } from '../middlewares/auth.js';

const router = Router();

// Rutas de Autenticación (Públicas)
router.use('/auth', authRoutes);

// Rutas de la Cámara (Pública para Vercel)
router.use('/camera', cameraRoutes);

// Rutas de Alertas (Públicas para Vercel)
router.use('/alerts', alertsRoutes);

// Rutas de Residentes (Protegidas por JWT)
router.use('/residents', requireJwt, residentRoutes);

// Rutas de Gestión de Usuarios (Protegidas por JWT)
router.use('/users', requireJwt, userRoutes);

// Rutas de Mascotas (Protegidas por JWT)
router.use('/mascotas', requireJwt, mascotaRoutes);

export default router;
