import { Router } from 'express';
import { AlertsController } from '../controllers/alerts.controller.js';

const router = Router();

router.post('/', AlertsController.createAlert);
router.post('/telegram/add', AlertsController.addTelegramUser);

export default router;
