import { z } from 'zod';

export const VALID_RESOLUTIONS: [string, ...string[]] = ['QVGA', 'VGA', 'SVGA', 'UXGA'];

export const ConfigureCameraSchema = z.object({
  resolution: z.enum(VALID_RESOLUTIONS, {
    errorMap: () => ({ message: `Resolución inválida. Debe ser una de las siguientes: ${VALID_RESOLUTIONS.join(', ')}` })
  }).optional(),
  streamQuality: z.number({
    invalid_type_error: 'Calidad de stream debe ser un número.'
  }).min(10, 'Calidad de stream inválida. Debe ser un número entre 10 y 63 (factor JPEG).')
    .max(63, 'Calidad de stream inválida. Debe ser un número entre 10 y 63 (factor JPEG).')
    .optional(),
  motionDetection: z.boolean({
    invalid_type_error: 'El parámetro "motionDetection" debe ser un valor booleano (true/false).'
  }).optional(),
  esp32CamUrl: z.string({
    invalid_type_error: 'La URL de la cámara debe ser un texto.'
  }).url('La URL proporcionada para la ESP32-CAM no es válida.').optional()
});

export type ConfigureCameraInput = z.infer<typeof ConfigureCameraSchema>;
