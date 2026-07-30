import { Router } from 'express';
import { MascotaController } from '../controllers/mascota.controller.js';

const router = Router();

router.get('/', MascotaController.getAll);
router.post('/', MascotaController.create);
router.delete('/:id', MascotaController.delete);

export default router;
