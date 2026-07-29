import type { Request, Response, NextFunction } from 'express';
import { AlertasRepository } from '../repositories/alertas.repository.js';
import { TelegramService } from '../services/telegram.service.js';

export const AlertsController = {
  /**
   * Recibe una alerta desde el frontend, la guarda en Supabase y notifica por Telegram.
   */
  async createAlert(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { message, confidence } = req.body;
      const user = (req as any).user; // Obtenido del middleware requireJwt

      if (!message) {
        res.status(400).json({ error: 'El mensaje es requerido' });
        return;
      }

      // 1. Guardar en Supabase (Opcional si falla, podemos continuar con Telegram)
      try {
        await AlertasRepository.crearAlerta({
          mensaje: message,
          confianza: confidence || 0,
          id_usuario: user?.id
        });
      } catch (dbError) {
        console.error('No se pudo guardar la alerta en la base de datos:', dbError);
        // Continuamos para enviar el Telegram de todas formas
      }

      // 2. Enviar mensaje por Telegram
      const telegramMensaje = `${message} (Confianza: ${confidence}%)`;
      const enviado = await TelegramService.enviarMensaje(telegramMensaje);

      if (enviado) {
        res.status(200).json({ success: true, message: 'Alerta procesada y notificada' });
      } else {
        res.status(500).json({ error: 'La alerta fue procesada pero falló el envío por Telegram' });
      }

    } catch (error) {
      next(error);
    }
  }
};
