import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const USERS_FILE = path.join(process.cwd(), 'telegram_users.json');

// Helper para obtener los chat IDs (incluyendo el del .env y los del JSON)
function getChatIds(): string[] {
  let ids: string[] = [];
  
  // Agregar el principal del .env
  if (process.env.TELEGRAM_CHAT_ID) {
    ids.push(process.env.TELEGRAM_CHAT_ID);
  }

  // Leer del archivo si existe
  if (fs.existsSync(USERS_FILE)) {
    try {
      const data = fs.readFileSync(USERS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        ids = [...ids, ...parsed];
      }
    } catch (error) {
      console.error('Error al leer telegram_users.json:', error);
    }
  }

  // Retornar IDs únicos
  return [...new Set(ids)];
}

export const TelegramService = {
  // Función para guardar un nuevo Chat ID
  agregarChatId(chatId: string): boolean {
    try {
      let ids: string[] = [];
      if (fs.existsSync(USERS_FILE)) {
        ids = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
      }
      if (!ids.includes(chatId) && chatId !== process.env.TELEGRAM_CHAT_ID) {
        ids.push(chatId);
        fs.writeFileSync(USERS_FILE, JSON.stringify(ids, null, 2));
      }
      return true;
    } catch (e) {
      console.error("Error al guardar chatId:", e);
      return false;
    }
  },

  async enviarMensaje(mensaje: string): Promise<boolean> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return false;

    const chatIds = getChatIds();
    if (chatIds.length === 0) return false;

    let exitoGlobal = false;
    for (const chatId of chatIds) {
      try {
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        await axios.post(url, {
          chat_id: chatId,
          text: mensaje,
          parse_mode: 'Markdown'
        });
        exitoGlobal = true;
      } catch (error: any) {
        console.error(`Error al enviar msj a ${chatId}:`, error.message);
      }
    }
    return exitoGlobal;
  },

  async enviarFoto(imageBase64: string, caption: string): Promise<boolean> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return false;

    const chatIds = getChatIds();
    if (chatIds.length === 0) return false;

    let exitoGlobal = false;
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    for (const chatId of chatIds) {
      try {
        const form = new FormData();
        form.append('chat_id', chatId);
        form.append('caption', caption);
        form.append('photo', buffer, { filename: `alerta_${Date.now()}.jpg`, contentType: 'image/jpeg' });

        const url = `https://api.telegram.org/bot${token}/sendPhoto`;
        await axios.post(url, form, { headers: form.getHeaders() });
        exitoGlobal = true;
      } catch (error: any) {
        console.error(`Error al enviar foto a ${chatId}:`, error.message);
        // Fallback a texto
        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: caption });
      }
    }
    return exitoGlobal;
  }
};
