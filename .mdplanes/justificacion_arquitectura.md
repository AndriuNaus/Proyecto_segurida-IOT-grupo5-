# Justificación de la Arquitectura del Sistema (Cámara, IA y Telegram)

Este documento detalla las decisiones técnicas y de arquitectura tomadas para la integración del proyecto final de Seguridad IoT.

---

## 1. El Desafío de Integración
Al momento de unificar el proyecto, nos encontramos con dos sistemas distintos:
1. **Frontend en Vercel:** Una interfaz gráfica moderna, con base de datos propia y un sistema de Autenticación de Google (OAuth 2.0).
2. **Backend en AWS (iot-security.pro):** Un servidor especializado en hardware que ya tenía configurado el túnel con la ESP32-CAM y la lógica del Bot de Telegram.

**Problemas técnicos si intentábamos fusionar todo en un solo código (Monolito):**
- **Bloqueo de Google Auth:** Google OAuth exige estrictamente que la aplicación corra bajo un dominio HTTPS registrado y validado en su consola de Google Cloud. Si movíamos el frontend de Vercel hacia una IP genérica o si migrábamos la base de datos a las carreras, el login se habría roto irreversiblemente.
- **Error de Contenido Mixto (Mixed Content):** Los navegadores modernos bloquean cualquier intento de una página segura (`https://`, como Vercel) de consumir recursos de una red no segura (`http://`).
- **Conflictos de Base de Datos:** Ambos proyectos tenían esquemas de tablas distintos.

---

## 2. La Solución: Arquitectura Basada en Microservicios
Para resolver esto con calidad empresarial, decidimos separar las responsabilidades (Separation of Concerns) usando el patrón de **Microservicios**.

### A. El Servidor Principal (Vercel)
Actúa como el cliente principal (Frontend) y servidor de autenticación.
- Maneja la experiencia del usuario (UI/UX).
- Gestiona el Login de Google.
- **Ejecuta la Inteligencia Artificial (MediaPipe):** La IA corre directamente en el navegador del cliente (Client-Side Rendering). Esto es crucial porque descargarle el procesamiento de video (Computer Vision) al servidor AWS lo habría saturado. Al correr en el cliente, aprovechamos el hardware del usuario para analizar las imágenes.

### B. El Microservicio de Hardware y Notificaciones (AWS EC2)
El servidor en `https://iot-security.pro` fue refactorizado para actuar como una API pública especializada en IoT.
1. **Túnel SSH Reverso (El Puente):** La ESP32-CAM está en una red local sin IP pública. Usamos `autossh` para enviar el puerto 80 local hacia el puerto 8081 de AWS. AWS toma ese flujo y lo convierte en un stream de video MJPEG público.
2. **Eliminación del Bloqueo CORS:** Se configuraron cabeceras HTTP (`Access-Control-Allow-Origin: *`) en Express.js. Esto es lo que permite que el Canvas de Vercel pueda "leer" los píxeles del video en AWS sin que el navegador lance un error de seguridad (CORS Tainted Canvas), permitiendo que la IA detecte a la persona.
3. **API Pública sin JWT para Hardware:** Se eliminó la dependencia de tokens JWT exclusivamente en las rutas `/api/camera/stream` y `/api/alerts`. Esto permite que el sistema de Vercel (que tiene su propio esquema de usuarios) pueda consumir el video y disparar alarmas libremente como un servicio de terceros.
4. **Pasarela de Telegram:** Cuando la IA en Vercel detecta una persona con más de 70% de confianza, hace un **POST Request** hacia el endpoint de alertas de AWS. Es el servidor de AWS el que tiene las credenciales del Bot y se encarga de contactar a los servidores de Telegram para entregar el mensaje.

---

## 3. ¿Por qué esta arquitectura es superior?
1. **Escalabilidad:** Si en el futuro hay 1000 usuarios, el servidor de Vercel escala automáticamente el frontend, y el AWS solo se dedica a servir video sin preocuparse por bases de datos ni sesiones.
2. **Resiliencia (Fault Tolerance):** Si el servidor de la cámara se cae por un corte de luz en la casa, la página principal en Vercel sigue funcionando y los usuarios aún pueden iniciar sesión y usar el resto de la app.
3. **Seguridad y Velocidad:** Se evitó modificar el delicado sistema de Google Auth, garantizando la seguridad de los usuarios, y el stream de video viaja protegido por certificados SSL (HTTPS).
