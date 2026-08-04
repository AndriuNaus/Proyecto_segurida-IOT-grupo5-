# Configuración y Solución de Problemas: Multi-Cámara (Dual ESP32-CAM)

Este documento guarda el contexto de los cambios y arreglos realizados para que el backend en AWS soporte múltiples cámaras simultáneamente mediante túneles SSH.

## 1. Arquitectura de Túnel Múltiple
Para soportar la Cámara 1 (conectada en modo AP directo a la laptop: `192.168.4.1`) y la Cámara 2 (conectada al router de la casa: `192.168.0.13`), se creó un script `iniciar_doble_tunel.sh`.
Este script abre dos túneles reversos en la misma conexión SSH:
* Puerto `8081` en AWS -> `192.168.4.1:80` (Cámara 1)
* Puerto `8082` en AWS -> `192.168.0.13:80` (Cámara 2)

## 2. Problemas Resueltos en el Backend (Node.js/Axios)

### A. Diferencias en Firmware (Boundary del MJPEG)
**Problema:** La Cámara 1 usaba la palabra `frame` para separar los cuadros de video en el flujo HTTP, pero la Cámara 2 usaba `123456789000000000000987654321`. Como el backend esperaba `frame` para ambas, la Cámara 2 se congelaba en el frontend.
**Solución:** Se dividió la lógica en el backend (`camera.controller.ts`) creando un endpoint dedicado `/api/camera/stream2` que especifica el boundary exacto esperado por la Cámara 2 (`boundary=123456789000000000000987654321`).

### B. El problema de IPv6 vs IPv4 (Silencio de Axios)
**Problema:** En el archivo `.env` de AWS, la cámara 2 estaba configurada como `http://localhost:8082/stream`. Node.js (versiones 18+) da prioridad a IPv6 e intentó conectarse a `::1` en lugar de `127.0.0.1`. Dado que el túnel de `autossh` estaba mapeado en IPv4, la conexión fallaba, generando un error `AggregateError ECONNREFUSED` silencioso.
**Solución:** Se modificó el archivo `.env` en AWS para apuntar explícitamente a `http://127.0.0.1:8081` y `http://127.0.0.1:8082`. Con esto, Node.js y Docker en `--network host` resolvieron correctamente las rutas de los túneles y se establecieron ambas conexiones.

## 3. Consideraciones del Frontend
Al incorporar `/api/camera/stream2`, la ruta se protegió con el middleware JWT. Por tanto, el frontend debe recordar enviar el token temporal generado al solicitar las cámaras.

**Implementación correcta en React/HTML:**
```jsx
<img 
  src={`https://iot-security.pro/api/camera/stream2?token=${streamToken}&t=${Date.now()}`} 
  alt="Cámara 2" 
/>
```

## 4. Recordatorio Crítico de Hardware
Las ESP32-CAM son dispositivos limitados de un solo hilo para video (modo Pull). **No pueden transmitir a más de un cliente a la vez**.
Si un usuario abre la dirección IP local de la cámara (`http://192.168.0.13/stream`) en el navegador de su laptop, la cámara se ocupará al 100% y AWS (el túnel) recibirá un "Timeout" al intentar jalar el video. Para que AWS funcione, la cámara no debe estar siendo observada en la red local.
