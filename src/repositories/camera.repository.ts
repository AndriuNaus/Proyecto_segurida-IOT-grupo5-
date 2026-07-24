import { supabase } from '../config/supabase.js';

export interface CameraConfig {
  resolution: string;
  streamQuality: number;
  motionDetection: boolean;
  esp32CamUrl: string;
}

export const CameraRepository = {
  /**
   * Obtiene la configuración guardada de la cámara en base de datos (id = 1).
   */
  async getConfig(): Promise<CameraConfig | null> {
    const { data, error } = await supabase
      .from('camera_config')
      .select('resolution, stream_quality, motion_detection, esp32_cam_url')
      .eq('id', 1)
      .maybeSingle();

    if (error || !data) return null;

    return {
      resolution: data.resolution,
      streamQuality: Number(data.stream_quality),
      motionDetection: Boolean(data.motion_detection),
      esp32CamUrl: data.esp32_cam_url
    };
  },

  /**
   * Actualiza la configuración de la cámara (id = 1).
   */
  async updateConfig(config: CameraConfig): Promise<void> {
    const { error } = await supabase
      .from('camera_config')
      .upsert({
        id: 1,
        resolution: config.resolution,
        stream_quality: config.streamQuality,
        motion_detection: config.motionDetection,
        esp32_cam_url: config.esp32CamUrl
      });

    if (error) {
      console.error('Error actualizando camera_config en Supabase:', error);
      throw new Error(error.message);
    }
  }
};
