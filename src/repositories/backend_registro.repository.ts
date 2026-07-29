import { supabase } from '../config/supabase.js';

export interface BackendRegistroInput {
  id_dispositivo?: number;
  id_evento?: number | null;
  endpoint: string;
  metodo: string;
  payload?: string | null;
  respuesta_backend?: string | null;
  codigo_estado?: number | null;
}

export const BackendRegistroRepository = {
  /**
   * Registra una petición HTTP en la tabla backend_registro de Supabase.
   * id_dispositivo default = 1 (ESP32-CAM principal).
   * No lanza error para no interrumpir el flujo principal.
   */
  async registrar(input: BackendRegistroInput): Promise<void> {
    const { error } = await supabase
      .from('backend_registro')
      .insert({
        id_dispositivo: input.id_dispositivo ?? 1,
        id_evento: input.id_evento ?? null,
        endpoint: input.endpoint,
        metodo: input.metodo,
        payload: input.payload ?? null,
        respuesta_backend: input.respuesta_backend ?? null,
        codigo_estado: input.codigo_estado ?? null,
      });

    if (error) {
      // Solo log, no interrumpe la petición principal
      console.warn('[backend_registro] Error al guardar log:', error.message);
    }
  }
};
