import type { Request, Response } from 'express';
import { MascotaRepository } from '../repositories/mascota.repository.js';

export const MascotaController = {
  async getAll(req: Request, res: Response) {
    try {
      // req.user viene del middleware JWT
      const ownerId = (req as any).user.sub || (req as any).user.id_usuario;
      if (!ownerId) {
        res.status(401).json({ error: 'No autorizado' });
        return;
      }
      
      const mascotas = await MascotaRepository.getAllByOwner(ownerId);
      res.json({ mascotas });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async create(req: Request, res: Response) {
    const { nombre, tipo } = req.body;
    
    if (!nombre) {
      res.status(400).json({ error: 'El campo nombre es requerido' });
      return;
    }

    try {
      const ownerId = (req as any).user.sub || (req as any).user.id_usuario;
      if (!ownerId) {
        res.status(401).json({ error: 'No autorizado' });
        return;
      }

      const mascota = await MascotaRepository.create({
        nombre,
        tipo: tipo || 'Mascota',
        owner_id: ownerId
      });
      res.status(201).json({ mascota });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async delete(req: Request, res: Response) {
    const id = parseInt(req.params.id as string);
    try {
      const ownerId = (req as any).user.sub || (req as any).user.id_usuario;
      const deleted = await MascotaRepository.delete(id, ownerId);
      if (!deleted) {
        res.status(404).json({ error: 'Mascota no encontrada o no autorizada' });
        return;
      }
      res.json({ message: 'Mascota eliminada' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
};
