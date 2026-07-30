import type { Request, Response } from 'express';
import { UserRepository } from '../repositories/user.repository.js';

export const UserController = {
  /**
   * Obtiene todos los clientes registrados
   */
  async getClients(req: Request, res: Response) {
    try {
      const clients = await UserRepository.getAllClients();
      res.json({ clients });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  /**
   * Actualiza el permiso de un usuario para ver la cámara
   */
  async updateCameraAccess(req: Request, res: Response) {
    try {
      const username = req.params.username as string;
      const { can_view_camera } = req.body;

      if (typeof can_view_camera !== 'boolean') {
        res.status(400).json({ error: 'El campo can_view_camera debe ser un booleano' });
        return;
      }

      const success = await UserRepository.updateCameraPermission(username, can_view_camera);
      
      if (!success) {
        res.status(500).json({ error: 'No se pudo actualizar el permiso' });
        return;
      }

      res.json({ message: 'Permiso actualizado correctamente', can_view_camera });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
};
