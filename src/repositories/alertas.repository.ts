import { supabase } from '../config/supabase.js';

export interface AlertaRow {
  id_alerta?: number;
  mensaje: string;
  confianza: number;
  fecha_hora?: string;
  id_usuario?: number;
}

export const AlertasRepository = {
  async crearAlerta(alerta: AlertaRow): Promise<AlertaRow> {
    const { data, error } = await supabase
      .from('alertas')
      .insert({
        mensaje: alerta.mensaje,
        confianza: alerta.confianza,
        id_usuario: alerta.id_usuario
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Error al registrar alerta en Supabase:', error);
      throw new Error(error?.message || 'Error registrando alerta');
    }

    return data as AlertaRow;
  }
};
