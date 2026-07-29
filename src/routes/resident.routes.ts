import { Router } from 'express';
import { ResidentController } from '../controllers/resident.controller.js';

const router = Router();

// GET /api/residents
router.get('/', ResidentController.getAll);

// GET /api/residents/summary  ← modo del hogar
router.get('/summary', ResidentController.getSummary);

// POST /api/residents
router.post('/', ResidentController.create);

// PATCH /api/residents/:id/presence
router.patch('/:id/presence', ResidentController.updatePresence);

// DELETE /api/residents/:id
router.delete('/:id', ResidentController.delete);

export default router;
