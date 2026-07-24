import { supabase } from '../config/supabase.js';

export interface EventoRow {
  id_evento?: number;
  tipo_evento: 'Movimiento' | 'Persona' | 'Ruido' | 'Puerta' | 'Otro';
  descripcion?: string;
  fecha_hora?: string;
  id_dispositivo: number;
  nivel_riesgo?: 'Bajo' | 'Medio' | 'Alto';
}

export const EventoRepository = {
  async crearEvento(evento: EventoRow): Promise<EventoRow> {
    const { data, error } = await supabase
      .from('evento')
      .insert({
        tipo_evento: evento.tipo_evento,
        descripcion: evento.descripcion || 'Detección en vivo',
        id_dispositivo: evento.id_dispositivo,
        nivel_riesgo: evento.nivel_riesgo || 'Bajo'
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Error al registrar evento en Supabase:', error);
      throw new Error(error?.message || 'Error registrando evento');
    }

    return data as EventoRow;
  },

  async obtenerEventos(limit = 50): Promise<EventoRow[]> {
    const { data, error } = await supabase
      .from('evento')
      .select('*')
      .order('fecha_hora', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error al obtener eventos:', error);
      return [];
    }

    return (data as EventoRow[]) || [];
  }
};
