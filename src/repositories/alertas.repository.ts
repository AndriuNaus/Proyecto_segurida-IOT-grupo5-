import { supabase } from '../config/supabase.js';

export interface AlertaInput {
  mensaje: string;
  confianza: number;
  id_usuario?: number;
  // Campos para el evento vinculado
  tipo_evento?: 'Movimiento' | 'Persona' | 'Ruido' | 'Puerta' | 'Otro';
  nivel_riesgo?: 'Bajo' | 'Medio' | 'Alto';
  id_dispositivo?: number;
}

export interface AlertaRow {
  id_alerta: number;
  id_evento: number;
  estado: string;
  fecha_alerta: string;
  prioridad: string;
}

export const AlertasRepository = {
  /**
   * Crea un evento de detección y luego una alerta vinculada.
   * Flujo: evento → alerta (según schema de Supabase)
   */
  async crearAlertaConEvento(input: AlertaInput): Promise<AlertaRow> {
    const {
      mensaje,
      confianza,
      tipo_evento = 'Persona',
      nivel_riesgo = confianza >= 80 ? 'Alto' : confianza >= 50 ? 'Medio' : 'Bajo',
      id_dispositivo = 1, // ESP32-CAM por defecto
    } = input;

    // 1. Crear el evento de detección
    const { data: evento, error: eventoError } = await supabase
      .from('evento')
      .insert({
        tipo_evento,
        descripcion: mensaje,
        id_dispositivo,
        nivel_riesgo,
      })
      .select()
      .single();

    if (eventoError || !evento) {
      console.error('Error al crear evento en Supabase:', eventoError);
      throw new Error(eventoError?.message || 'Error creando evento');
    }

    // 2. Crear la alerta vinculada al evento
    const prioridad = nivel_riesgo === 'Alto' ? 'Alta' : nivel_riesgo === 'Medio' ? 'Media' : 'Baja';

    const { data: alerta, error: alertaError } = await supabase
      .from('alerta')
      .insert({
        id_evento: evento.id_evento,
        estado: 'Pendiente',
        prioridad,
      })
      .select()
      .single();

    if (alertaError || !alerta) {
      console.error('Error al crear alerta en Supabase:', alertaError);
      throw new Error(alertaError?.message || 'Error creando alerta');
    }

    console.log(`✅ Evento #${evento.id_evento} y Alerta #${alerta.id_alerta} creados en Supabase`);
    return alerta as AlertaRow;
  }
};
