import type { Request, Response, NextFunction } from 'express';
import { AlertasRepository } from '../repositories/alertas.repository.js';
import { TelegramService } from '../services/telegram.service.js';
import { BackendRegistroRepository } from '../repositories/backend_registro.repository.js';
import { ResidentRepository } from '../repositories/resident.repository.js';

export const AlertsController = {
  /**
   * Recibe una alerta desde el frontend.
   * - Si nadie está en casa (MODO AUSENTE) → INTRUSIÓN CRÍTICA + envía foto
   * - Si hay alguien en casa (MODO EN CASA) → Actividad normal
   * Guarda en Supabase (evento + alerta) y notifica por Telegram.
   */
  async createAlert(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { message, confidence, tipo_evento, imagen_base64 } = req.body;
      const user = (req as any).user;

      if (!message) {
        res.status(400).json({ error: 'El mensaje es requerido' });
        return;
      }

      // 1. Consultar modo del hogar
      const { isAnyoneHome, mode, atHome, total } = ResidentRepository.getSummary();
      const esCritico = !isAnyoneHome; // Nadie en casa = intrusión crítica

      const confianzaTexto = confidence ? ` (Confianza: ${confidence}%)` : '';
      const modoTexto = esCritico
        ? `🚨 *INTRUSIÓN CRÍTICA — MODO AUSENTE*\n_${total} residentes registrados, ninguno en casa_`
        : `🏠 *Actividad detectada — MODO EN CASA*\n_${atHome}/${total} residentes en casa_`;

      const telegramMensaje = `${modoTexto}\n\n${message}${confianzaTexto}`;

      // 2. Guardar evento + alerta en Supabase
      let alertaGuardada = null;
      let dbError = false;

      try {
        alertaGuardada = await AlertasRepository.crearAlertaConEvento({
          mensaje: esCritico ? `[INTRUSIÓN] ${message}` : message,
          confianza: confidence || 0,
          id_usuario: user?.id,
          tipo_evento: tipo_evento || 'Persona',
          nivel_riesgo: esCritico ? 'Alto' : (confidence >= 80 ? 'Alto' : confidence >= 50 ? 'Medio' : 'Bajo'),
        });
      } catch (err) {
        console.error('No se pudo guardar la alerta en la base de datos:', err);
        dbError = true;
      }

      // 3. Enviar a Telegram
      let telegramEnviado = false;

      if (esCritico && imagen_base64) {
        // Modo Ausente + hay imagen → enviar foto con caption
        telegramEnviado = await TelegramService.enviarFoto(imagen_base64, telegramMensaje);
      } else {
        // Modo En Casa o sin imagen → solo texto
        telegramEnviado = await TelegramService.enviarMensaje(telegramMensaje);
      }

      if (!telegramEnviado) {
        console.warn('Telegram no pudo enviar el mensaje. Revisa TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID en .env');
      }

      // 4. Log en backend_registro con id_evento si se creó
      if (alertaGuardada) {
        BackendRegistroRepository.registrar({
          endpoint: req.path,
          metodo: req.method,
          id_evento: alertaGuardada.id_evento,
          payload: JSON.stringify({ message, confidence, mode }),
          respuesta_backend: JSON.stringify({ success: true, id_alerta: alertaGuardada.id_alerta }),
          codigo_estado: 200,
        }).catch(() => {});
      }

      res.status(200).json({
        success: true,
        mode,
        esCritico,
        message: telegramEnviado
          ? `Alerta ${esCritico ? 'CRÍTICA' : 'normal'} enviada a Telegram`
          : 'Alerta guardada, pero Telegram falló',
        alerta: alertaGuardada,
        telegramEnviado,
        dbError,
      });

    } catch (error) {
      next(error);
    }
  }
};
