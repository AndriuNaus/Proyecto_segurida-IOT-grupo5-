# 🚀 Guía de Integración Final (Arquitectura de Microservicios)

Sigue estos pasos EXACTAMENTE en este orden para tener el proyecto funcionando antes de las 5 PM.

---

## 💻 1. Tu Responsabilidad (Hardware y Backend AWS)

Tu proyecto ahora actúa como el **Microservicio de Hardware y Notificaciones**. 

### A. Preparar la Cámara Local
1. Enciende la ESP32-CAM y asegúrate de que esté conectada a la red WiFi (igual que siempre).
2. Ejecuta tu script del túnel en tu computadora:
   ```bash
   ./iniciar_tunel.sh
   ```
   *(Esto enviará el video desde tu casa hacia el puerto 8081 de tu AWS).*

### B. Actualizar tu Servidor AWS
Ya modifiqué tu código local para agregar **CORS** y **desbloquear las rutas** de la cámara y Telegram. Solo debes empujarlos a GitHub para que tu servidor se actualice:
1. Abre tu terminal y ejecuta:
   ```bash
   git add .
   git commit -m "feat: habilitar cors y microservicio de alertas"
   git push origin main
   ```
2. **IMPORTANTE:** En tu servidor de AWS, revisa que el archivo `.env` (donde corre el Docker) tenga las credenciales de Telegram:
   ```env
   TELEGRAM_BOT_TOKEN=tu_token_aqui
   TELEGRAM_CHAT_ID=tu_chat_id_aqui
   ```

---

## 🌐 2. Responsabilidad de tu Compañero (Frontend Vercel)

El código de tu compañero consumirá tu cámara y le dirá a tu servidor cuándo enviar la alerta. Él debe hacer esto en su código fuente (React/Next.js):

### A. Instalar la IA
En la terminal de su proyecto, debe instalar MediaPipe:
```bash
npm install @mediapipe/tasks-vision
```

### B. Mostrar la Cámara de tu AWS
Donde él tenga la pantalla de video, debe poner esta etiqueta EXACTA (el `crossorigin` es vital para que la IA funcione sin errores de seguridad):
```html
<img 
  id="camera-stream"
  src="https://iot-security.pro/api/camera/stream" 
  crossorigin="anonymous" 
  alt="ESP32 Live Stream" 
  style="width: 100%; height: 100%; object-fit: contain;" 
/>
```

### C. Copiar tu lógica de Inteligencia Artificial
1. Que abra tu archivo `frontend/src/pages/LiveStream.jsx`.
2. Que copie la importación:
   ```javascript
   import { FilesetResolver, ObjectDetector } from '@mediapipe/tasks-vision';
   ```
3. Que copie los dos `useEffect` principales:
   - El que dice `loadModel()` (que descarga el modelo EfficientDet-Lite2).
   - El que dice `detectFrame()` (el bucle que dibuja los cuadros de colores).

### D. Conectar las Alertas hacia tu AWS
Dentro de la lógica que él acaba de pegar, cuando el código detecta una persona, debe llamar a tu API en lugar de la suya. 
Que reemplace la parte de envío de alertas por este código:

```javascript
// Cuando se detecte a una persona con >70% de confianza:
fetch('https://iot-security.pro/api/alerts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: "🚨 ALERTA: Persona detectada en la propiedad",
    confidence: Math.round(personDetection.categories[0].score * 100),
    tipo_evento: "Persona",
    // Opcional: enviar la foto capturada del canvas
    imagen_base64: imagenExtraidaDelCanvasBase64 
  })
})
.then(res => res.json())
.then(data => console.log("¡Alerta enviada al Microservicio de AWS (Telegram)!", data))
.catch(err => console.error("Error al enviar alerta:", err));
```

### E. Desplegar
Que haga `git push` a su repositorio para que Vercel se actualice con la nueva cámara conectada y la IA configurada.

---

## 🏆 Resumen para el Profesor (Defensa del Proyecto)
Si el profesor pregunta por qué los códigos están separados, responden lo siguiente:
> *"Implementamos una Arquitectura de Microservicios. Vercel actúa como el Servidor Principal que maneja las sesiones de usuario con Google Auth y la UI. Sin embargo, procesar streaming de video IoT es muy pesado, así que separamos esa responsabilidad. Configuramos un Servidor Dedicado en AWS (iot-security.pro) que actúa como un microservicio exclusivo para extraer el video de la ESP32 por un túnel inverso y gestionar la pasarela de notificaciones push a Telegram."*
