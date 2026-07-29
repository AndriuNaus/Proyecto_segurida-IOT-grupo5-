import axios from 'axios';
import FormData from 'form-data';

export const TelegramService = {
  async enviarMensaje(mensaje: string): Promise<boolean> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      console.warn('Faltan credenciales de Telegram (TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID). No se pudo enviar el mensaje.');
      return false;
    }

    try {
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      await axios.post(url, {
        chat_id: chatId,
        text: mensaje,
        parse_mode: 'Markdown'
      });
      return true;
    } catch (error: any) {
      console.error('Error al enviar mensaje por Telegram:', error.message);
      return false;
    }
  },

  /**
   * Envía una foto al chat de Telegram.
   * @param imageBase64 - Imagen en base64 (sin el prefijo data:image/...)
   * @param caption - Texto que acompaña la foto
   */
  async enviarFoto(imageBase64: string, caption: string): Promise<boolean> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      console.warn('Faltan credenciales de Telegram para enviar foto.');
      return false;
    }

    try {
      // Limpiar el prefijo data:image/...;base64, si viene del frontend
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const form = new FormData();
      form.append('chat_id', chatId);
      form.append('caption', caption);
      form.append('photo', buffer, { filename: `alerta_${Date.now()}.jpg`, contentType: 'image/jpeg' });

      const url = `https://api.telegram.org/bot${token}/sendPhoto`;
      await axios.post(url, form, { headers: form.getHeaders() });
      return true;
    } catch (error: any) {
      console.error('Error al enviar foto por Telegram:', error.message);
      // Si falla la foto, intentar enviar solo el texto
      return await this.enviarMensaje(caption);
    }
  }
};
