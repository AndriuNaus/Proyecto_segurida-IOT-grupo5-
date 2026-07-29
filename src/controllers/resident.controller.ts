import type { Request, Response, NextFunction } from 'express';
import { ResidentRepository } from '../repositories/resident.repository.js';

export const ResidentController = {
  async getAll(req: Request, res: Response) {
    const residents = await ResidentRepository.getAll();
    res.json({ residents });
  },

  async getSummary(req: Request, res: Response) {
    const summary = await ResidentRepository.getSummary();
    res.json(summary);
  },

  async create(req: Request, res: Response) {
    const { fullName, full_name, role, isAtHome, is_at_home, emergencyContact } = req.body;
    const name = fullName || full_name;
    if (!name) {
      res.status(400).json({ error: 'El campo fullName es requerido' });
      return;
    }
    try {
      const resident = await ResidentRepository.create({
        full_name: name,
        role: role || 'Familiar',
        is_at_home: isAtHome ?? is_at_home ?? true,
        emergency_contact: emergencyContact || undefined,
      });
      res.status(201).json({ resident });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async updatePresence(req: Request, res: Response) {
    const id = parseInt(req.params.id as string);
    const { isAtHome, is_at_home } = req.body;
    const value = isAtHome ?? is_at_home;

    if (typeof value !== 'boolean') {
      res.status(400).json({ error: 'El campo isAtHome debe ser true o false' });
      return;
    }

    const updated = await ResidentRepository.updatePresence(id, value);
    if (!updated) {
      res.status(404).json({ error: 'Residente no encontrado' });
      return;
    }

    const summary = await ResidentRepository.getSummary();
    res.json({ resident: updated, summary });
  },

  async delete(req: Request, res: Response) {
    const id = parseInt(req.params.id as string);
    const deleted = await ResidentRepository.delete(id);
    if (!deleted) {
      res.status(404).json({ error: 'Residente no encontrado' });
      return;
    }
    const summary = await ResidentRepository.getSummary();
    res.json({ message: 'Residente eliminado', summary });
  }
};
