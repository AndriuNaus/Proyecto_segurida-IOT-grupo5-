# Sistema de Seguridad IoT - ESP32-CAM Dashboard

Este repositorio contiene el backend en Node.js con TypeScript y una interfaz web para el monitoreo y control en vivo de una cámara de seguridad basada en el microcontrolador ESP32-CAM.

El sistema implementa seguridad mediante **JWT (JSON Web Tokens)**, validación estricta de entradas en los endpoints y documentación **OpenAPI (Swagger)**.

---

## Características de Arquitectura y Seguridad

1. **Autenticación con JWT**:
   - Acceso seguro a los endpoints del dispositivo.
   - Decodificación y validación de tokens manual mediante firmas HMAC (algoritmo `HS256`) utilizando `crypto.timingSafeEqual` para evitar ataques de canal lateral (timing attacks).
   - Control de expiración del token (`exp`) y validación de claims obligatorios.

2. **Validación de Entradas**:
   - Verificación estricta de tipos de datos y rangos en parámetros (resolución de imagen admitida, factor de compresión JPEG del stream entre 10 y 63, booleano para sensor de movimiento y URL válidas).

3. **Limitación de Peticiones (Rate Limiting)**:
   - Middleware de protección contra abuso y denegación de servicio (DoS) limitando solicitudes repetitivas por IP a un máximo de 60 peticiones por minuto.

4. **Flujo de Video por WebSockets**:
   - Proxy de stream nativo MJPEG de la ESP32-CAM retransmitido a clientes web en tiempo real en formato Base64 para reducir la latencia.

---

## Requisitos Previos

- **Node.js** v18 o superior
- **npm** v9 o superior

---

## Instrucciones para Levantar el Servidor

### 1. Clonar el repositorio e instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
Copia el archivo de plantilla `.env.example` y crea el archivo `.env`:
```bash
cp .env.example .env
```
Abre `.env` y configura tus variables:
```ini
JWT_SECRET=tu-clave-secreta-larga-para-firmar-tokens
ESP32_CAM_URL=http://<IP_DE_LA_ESP32_CAM>:81/stream
PORT=3000
```

### 3. Ejecutar el servidor en modo desarrollo
Para ejecutar el servidor con recarga automática usando `nodemon` y `tsx`:
```bash
npm run dev
```
El backend estará disponible en `http://localhost:3000`.

---

## Pruebas de Endpoints (Manuales)

### 1. Iniciar Sesión (Autenticación)
Envía una petición POST con las credenciales por defecto (`admin` / `admin123`) para obtener tu JWT:

```bash
# Petición:
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```
El servidor te devolverá un JSON con el token JWT:
```json
{
  "message": "Autenticación exitosa",
  "token": "eyJhbGciOiJIUzI1Ni..."
}
```

### 2. Obtener Estado de la Cámara (Protegido por JWT)
```bash
curl -X GET http://localhost:3000/api/camera/status \
  -H "Authorization: Bearer <TU_TOKEN_JWT>"
```

### 3. Cambiar Configuración de la Cámara (Protegido por JWT, requiere rol 'admin')
```bash
curl -X POST http://localhost:3000/api/camera/configure \
  -H "Authorization: Bearer <TU_TOKEN_JWT>" \
  -H "Content-Type: application/json" \
  -d '{"resolution": "UXGA", "streamQuality": 15, "motionDetection": true}'
```

---

## Documentación de la API (OpenAPI)

El archivo [`openapi.yaml`](file:///home/anderson/Documentos/Cuarto%20semestre/Proyecto/openapi.yaml) en la raíz del proyecto describe la estructura de los datos, las validaciones y los códigos de respuesta del servidor de acuerdo a la especificación OpenAPI 3.1.0. Puedes importar este archivo en herramientas como **Swagger Editor** o **Postman** para interactuar visualmente con la API.
