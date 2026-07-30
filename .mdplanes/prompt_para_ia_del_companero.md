# PROMPT PARA LA IA DE TU COMPAÑERO

Copia todo el texto que está debajo de la línea punteada y dile a tu compañero que se lo pegue completo a la IA que esté usando (ChatGPT, Claude, Cursor, GitHub Copilot, etc.). Está redactado con términos técnicos precisos para que la otra IA entienda la arquitectura de microservicios, el túnel y sepa exactamente qué archivos buscar y modificar en el código de Vercel.

--------------------------------------------------------------------------------------------------

**Contexto de Arquitectura y Topología:**
Actúa como un desarrollador Frontend Senior experto en React/Next.js y MediaPipe. Estoy integrando este frontend (alojado en Vercel) con un backend externo en AWS (`https://iot-security.pro`) mediante una arquitectura de microservicios orientada a IoT.
El servidor de AWS es un servicio dedicado de hardware que recibe el tráfico de una ESP32-CAM a través de un túnel reverso (`autossh` en `localhost:8081`) y lo expone a internet como un stream MJPEG de forma pública (sin JWT) y con cabeceras CORS permisivas (`Access-Control-Allow-Origin: *`). Además, el AWS tiene un controlador para enviar notificaciones Push a Telegram de forma nativa.

**Tu Tarea:**
Necesito que analices el código actual de este repositorio y me ayudes a integrar la visualización de esta cámara y un modelo local de IA que avise al AWS cuando vea una persona.

Ejecuta los siguientes pasos de forma sistemática:

### 1. Dependencias
Genera el comando para instalar `@mediapipe/tasks-vision`.

### 2. Identificación del Componente
Busca en mi código el componente o vista donde lógicamente debería ir el Dashboard de la cámara o la vista de monitoreo de seguridad.

### 3. Modificación del JSX (UI y Canvas)
Dentro del contenedor de la cámara, debes implementar esta estructura exacta:
- Un tag `<img />` con `crossOrigin="anonymous"` apuntando a `https://iot-security.pro/api/camera/stream`. (El crossOrigin es mandatorio para evitar el Tainted Canvas de MediaPipe).
- Un tag `<canvas />` posicionado de manera absoluta (`position: absolute`) exactamente sobre el `<img>`, con el atributo `pointer-events: none;`. Este servirá para renderizar las cajas delimitadoras (Bounding Boxes).

### 4. Lógica de MediaPipe (Hooks)
Escribe la lógica utilizando `useEffect` y `useRef` para inicializar el modelo `EfficientDet-Lite2`. Utiliza los binarios WASM desde el CDN de jsdelivr y el modelo de Google Storage:
```javascript
const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm");
const detector = await ObjectDetector.createFromOptions(vision, {
  baseOptions: {
    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite2/float16/1/efficientdet_lite2.tflite",
    delegate: "GPU"
  },
  scoreThreshold: 0.60,
  runningMode: "IMAGE"
});
```

### 5. Loop de Detección (Game Loop)
Implementa un bucle basado en `requestAnimationFrame` que tome el nodo del `<img />` (usando un Ref) y llame a `detector.detect(imgRef.current)`. 
Basado en los resultados de `detections`, dibuja los rectángulos correspondientes en el `<canvas />` usando `canvas.getContext('2d')`. Debes manejar correctamente el escalado multiplicando el `width` del canvas según la proporción de origen.

### 6. Integración del Webhook (Telegram)
Si la IA detecta la categoría `person` con un `score > 0.70`, debes hacer un POST Request (Fetch) hacia:
`https://iot-security.pro/api/alerts`
- `method: "POST"`
- `headers: { 'Content-Type': 'application/json' }`
- `body`: Un string de JSON con esta estructura obligatoria:
  `{ "message": "🚨 INTRUSIÓN: Persona detectada en el stream", "confidence": <porcentaje>, "tipo_evento": "Persona" }`
  
*Importante:* Para evitar hacer spam y saturar el backend de AWS con peticiones, debes implementar un Debounce o Cooldown usando un `useRef` para guardar el timestamp de la última alerta. Solo debes enviar un POST como máximo **1 vez cada 30 segundos**.

### 7. Manejo de Errores
El stream MJPEG puede ser interrumpido temporalmente si el hardware local pierde conexión WiFi. Añade un handler `onError` al `<img />` que vuelva a intentar cargar el `src` pasados 3000ms agregando un query param de timestamp para romper la caché (`?t=Date.now()`).

Entrégame el código refactorizado del componente listo para ser pegado. Asegúrate de importar los hooks necesarios y manejar correctamente el montaje y desmontaje del componente (limpiar los Refs y cancelar el requestAnimationFrame al salir).
