import { query } from '../config/database.js';

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
    const rows = await query(
      "SELECT resolution, stream_quality as streamQuality, motion_detection as motionDetection, esp32_cam_url as esp32CamUrl FROM camera_config WHERE id = 1"
    );
    if (rows && rows.length > 0) {
      return {
        resolution: rows[0].resolution,
        streamQuality: Number(rows[0].streamQuality),
        motionDetection: Boolean(rows[0].motionDetection),
        esp32CamUrl: rows[0].esp32CamUrl
      };
    }
    return null;
  },

  /**
   * Actualiza la configuración de la cámara (id = 1).
   */
  async updateConfig(config: CameraConfig): Promise<void> {
    await query(
      "UPDATE camera_config SET resolution = ?, stream_quality = ?, motion_detection = ?, esp32_cam_url = ? WHERE id = 1",
      [
        config.resolution,
        config.streamQuality,
        config.motionDetection ? 1 : 0,
        config.esp32CamUrl
      ]
    );
  }
};
