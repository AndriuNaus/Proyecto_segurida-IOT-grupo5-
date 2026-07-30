import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { requireRole } from '../middlewares/auth.js';

const router = Router();

// Todas las rutas aquí requieren rol de admin (lo verificaremos en index.ts o aquí)
// En este caso, usaremos el middleware directamente aquí para asegurarnos.
router.get('/clients', requireRole('admin'), UserController.getClients);
router.patch('/:username/camera-access', requireRole('admin'), UserController.updateCameraAccess);

export default router;
