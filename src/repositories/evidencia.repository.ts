import { supabase } from '../config/supabase.js';

export interface EvidenciaRow {
  id_evidencia?: number;
  id_evento: number;
  tipo_archivo?: string;
  ruta_archivo?: string;
  fecha_registro?: string;
  id_dispositivo: number;
}

export const EvidenciaRepository = {
  async registrarEvidencia(evidencia: EvidenciaRow): Promise<EvidenciaRow> {
    const { data, error } = await supabase
      .from('evidencia')
      .insert({
        id_evento: evidencia.id_evento,
        tipo_archivo: evidencia.tipo_archivo || 'image/jpeg',
        ruta_archivo: evidencia.ruta_archivo || null,
        id_dispositivo: evidencia.id_dispositivo
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Error registrando evidencia en Supabase:', error);
      throw new Error(error?.message || 'Error registrando evidencia');
    }

    return data as EvidenciaRow;
  },

  async obtenerEvidenciasPorEvento(id_evento: number): Promise<EvidenciaRow[]> {
    const { data, error } = await supabase
      .from('evidencia')
      .select('*')
      .eq('id_evento', id_evento);

    if (error) return [];
    return (data as EvidenciaRow[]) || [];
  }
};
