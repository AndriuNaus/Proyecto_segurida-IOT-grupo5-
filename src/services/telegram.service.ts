import axios from 'axios';

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
        text: mensaje
      });
      return true;
    } catch (error: any) {
      console.error('Error al enviar mensaje por Telegram:', error.message);
      return false;
    }
  }
};
