# Plan de Acción - Fase 2: Mejoras Post-Presentación

Este plan detalla los próximos pasos para escalar el sistema de seguridad IoT, mejorando la precisión, añadiendo alertas reales y puliendo la interfaz de usuario. Todo esto se implementará **después** de la presentación para no arriesgar la estabilidad actual.

## 1. Mejora del Modelo de Inteligencia Artificial (Precisión)
Actualmente el sistema usa `efficientdet_lite0`, que es el modelo más rápido pero menos preciso de MediaPipe. 

**Acciones a tomar:**
*   **Actualizar el Modelo:** Cambiar la URL del modelo en `LiveStream.jsx` a `efficientdet_lite2.tflite`. Esto consumirá un poco más de CPU pero reducirá drásticamente los falsos positivos.
*   **Umbral de Confianza:** Ajustar el `scoreThreshold` de `0.45` a `0.60`. Así la IA solo enmarcará objetos cuando esté muy segura.
*   **Calidad de Video:** Desde el dashboard, enviar el comando a la ESP32 para subir la resolución de VGA (640x480) a SVGA (800x600) para darle imágenes más nítidas a la IA.

## 2. Sistema de Alertas Críticas por Telegram
Para cumplir con el requisito de notificar "movimientos inusuales" al celular del usuario sin necesidad de tener la página web abierta.

**Acciones a tomar:**
*   **Crear el Bot:** Usar *BotFather* en Telegram para crear un bot oficial del proyecto y obtener el `API_TOKEN`.
*   **Lógica en el Frontend:** Cuando la IA de MediaPipe detecte a una "Persona" (person) con una confianza superior al 70%, el frontend (React) enviará una petición al backend: `POST /api/alerts`.
*   **Lógica en el Backend:** El servidor Node.js recibirá la alerta, guardará un registro en Supabase (tabla `alertas`), y usará la API de Telegram para enviar un mensaje instantáneo al usuario: 
    * 🚨 *ALERTA: Se ha detectado una persona en la cámara principal.*

## 3. Limpieza y Funcionalidad de la Interfaz (Botones)
La interfaz actual tiene botones y switches que actúan como "placeholders" (maquetas) y no envían comandos reales.

**Acciones a tomar:**
*   **Ocultamiento Temporal:** Ocultaremos (con `display: none` o borrándolos) cualquier botón que no funcione, para evitar confusiones.
*   **Implementación (Fase 2):** 
    *   *Botón de Flash/Luz:* Crear un endpoint `/api/camera/light` que envíe una petición HTTP a la ESP32 para encender el pin del flash LED.
    *   *Botones de Calidad:* Conectar los switches de la UI a la función existente `cameraService.configure()` para cambiar la resolución en vivo.
