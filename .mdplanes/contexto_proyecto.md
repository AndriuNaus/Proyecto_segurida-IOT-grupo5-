# Contexto Detallado y Técnico del Proyecto (Proyecto de Seguridad IoT - Grupo 5)

Este documento es el **punto de verdad y estado actual** de todo el repositorio. Léelo detenidamente si estás retomando el proyecto en una nueva sesión, para no tener que buscar entre logs ni archivos pasados.

---

## 1. Topología y Arquitectura del Sistema
El proyecto es un sistema de videovigilancia IoT con Inteligencia Artificial. Migró recientemente de una arquitectura "PUSH" a una "PULL" (Túnel Inverso) porque la memoria (RAM/Heap) de la ESP32-CAM colapsaba al enviar las fotos manualmente a AWS.

### El Flujo de Datos Actual:
1. **ESP32-CAM (Hardware):** Sirve un stream en formato MJPEG a través de un servidor HTTP local en su puerto 80 (Ruta: `/stream`).
2. **PC Local (Puente):** En la misma red que la ESP32, la computadora ejecuta el script `./iniciar_tunel.sh`. Este script usa `autossh` para capturar el tráfico del puerto 80 de la ESP32 y enviarlo a través de internet hacia el puerto `8081` de la instancia en AWS.
3. **Servidor AWS EC2 (Backend):** Corre un backend en Node.js mediante un contenedor de Docker. El contenedor utiliza el modo `--network host`, por lo que intercepta la señal del túnel (que llega al `localhost:8081` de AWS) y actúa como un proxy inverso.
4. **Cliente Web (Frontend):** Consume la API del backend (`/api/camera/stream`), renderiza el video en un canvas y ejecuta un modelo local de IA en el navegador (MediaPipe) para detectar personas y objetos.

---

## 2. Estructura del Repositorio y Código

### A. Frontend (React + Vite)
Ubicado en la carpeta `frontend/`.
*   **Archivos Clave Modificados:**
    *   `src/pages/Register.jsx`: Contiene toda la lógica de registro. Se incluyó una validación estricta para que el campo de número de teléfono NO acepte letras.
    *   `src/models/userModel.js`: Encargado de las peticiones a la API del backend para manejar autenticaciones (Login/Registro).
    *   `src/pages/LiveStream.jsx` / `Dashboard.jsx`: Contienen la vista de la cámara. La lógica de IA usa el modelo `efficientdet_lite0` de TensorFlow Lite/MediaPipe. Aquí están los switches y botones de la UI.

### B. Backend (Node.js + Express + TypeScript)
Ubicado en `src/`.
*   **Archivos Clave Modificados:**
    *   `src/index.ts`: Punto de entrada.
    *   `src/controllers/auth.controller.ts`: Se arreglaron problemas críticos de tipado de TypeScript (`req.params` de tipo `string | string[]`) que hacían fallar el pipeline CI/CD en GitHub Actions.
    *   `src/services/camera.service.ts`: Maneja el proxy PULL. Realiza una conexión hacia la variable de entorno `ESP32_CAM_URL` y transmite los frames al cliente conectado (WebSocket o GET HTTP).
    *   `src/repositories/user.repository.ts`: Define las interacciones con Supabase.

### C. Base de Datos (Supabase PostgreSQL)
*   **Problemas Resueltos:** Los usuarios que ya existían y los nuevos no podían iniciar sesión (Error 401 Unauthorized) porque la tabla `usuario` carecía de las columnas de la nueva versión del frontend.
*   **Solución Aplicada:** Se añadieron a la base de datos las columnas: `is_verified`, `primer_nombre`, `segundo_nombre`, `primer_apellido`, `segundo_apellido` y `celular`. Ya funciona al 100%.

### D. Infraestructura y DevOps
*   **`dockerfile`:** Tiene un build *multi-stage*. La Etapa 1 compila el frontend de Vite y la Etapa 2 lo empaqueta junto con el backend de Node.js.
*   `.github/workflows/ci-cd.yml`: El pipeline oficial. Ante un push a `main`, compila el tipado, corre auditorías de npm, construye la imagen Docker en GitHub (`ghcr.io/...`) y finalmente **entra por SSH a AWS**, baja el código, reconstruye el Docker y lo despliega.
*   **El Túnel (`iniciar_tunel.sh`):** Ejecutable local que utiliza la llave privada `/home/anderson/Descargas/key-verda.pem` para hacer un Remote Forwarding hacia `ubuntu@3.138.214.6`.

---

## 3. Configuraciones Importantes de Entorno
En el servidor AWS, el archivo `.env` NO debe ser sobreescrito por Git. Actualmente está configurado así:
```env
JWT_SECRET=secreto-super-seguro-clase-iot-2026
ESP32_CAM_URL=http://localhost:8081/stream
PORT=3000
SUPABASE_URL=... (las claves de la DB)
```
*Crucial:* El Docker arranca con `--network host` para que `localhost:8081` lea realmente el puerto del servidor físico donde llega el túnel. Si se corre con puertos mapeados normales (`-p 3000:3000`), el backend da el error `ECONNREFUSED`.

---

## 4. Hoja de Ruta para la Siguiente Sesión (Fase 2)
*(Ver plan en fase2_mejoras.md para más detalles)*

1. **Mejorar la Detección IA:** Cambiar en el frontend el uso de `efficientdet_lite0` por `efficientdet_lite2` para mayor precisión.
2. **Sistema de Alertas (Telegram):** 
   - Crear endpoint `/api/alerts` en Node.
   - Conectar un bot de Telegram.
   - Enviar POST desde React hacia Node cuando la IA tenga >70% de confianza detectando una persona.
3. **Botones de UI:** Conectar los botones visuales (flash y calidad de video) con comandos HTTP reales a la ESP32.
