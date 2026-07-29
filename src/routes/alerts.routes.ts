import { Router } from 'express';
import { AlertsController } from '../controllers/alerts.controller.js';

const router = Router();

router.post('/', AlertsController.createAlert);

export default router;
