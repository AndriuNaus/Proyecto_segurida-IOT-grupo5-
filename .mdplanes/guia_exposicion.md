# Guía de Exposición: Sistema de Seguridad IoT (ESP32-CAM)

Esta es una guía rápida y estructurada con los puntos clave para que tu exposición sea clara, técnica y profesional.

---

## 1. Introducción y Objetivo del Proyecto
* **¿Qué es?** Es un sistema de seguridad y monitoreo en tiempo real basado en el Internet de las Cosas (IoT).
* **Objetivo:** Permitir a los usuarios visualizar una cámara de seguridad desde cualquier lugar a través de un Dashboard web seguro, resolviendo el problema de acceso remoto a dispositivos locales.

## 2. Arquitectura y Tecnologías
Menciona cómo está dividido el proyecto (Hardware, Backend, Frontend y Nube):
* **Hardware (IoT):** Microcontrolador **ESP32-CAM**, encargado de capturar y transmitir el video en red local.
* **Backend:** Desarrollado en **Node.js con TypeScript** y Express. Sirve como puente de comunicación y control.
* **Frontend:** Aplicación web moderna y reactiva donde el usuario interactúa (Dashboard).
* **Despliegue (Nube):** Hospedado en una instancia de **AWS (EC2)** utilizando **Docker** para mantener el entorno aislado y escalable.
* **Base de Datos:** Uso de **Supabase (PostgreSQL)** para el registro de alertas de seguridad.

## 3. El Desafío de la Comunicación (Punto clave técnico)
Explica cómo lograste que una cámara en tu casa se vea en la nube:
* **Problema:** La ESP32-CAM está en una red local (NAT) y no es accesible directamente desde internet.
* **Solución (El Túnel SSH):** Se implementó un **Túnel SSH reverso (autossh)** que conecta la red local con el servidor en AWS. Esto permite que el backend en AWS "vea" la cámara como si estuviera conectada directamente a él (`172.17.0.1` hacia el host).

## 4. Transmisión de Video en Tiempo Real
* El video no se envía como un archivo pesado, sino a través de un flujo constante (**Stream MJPEG**).
* Para reducir la latencia (retraso) en la web, el backend procesa el stream y lo retransmite a los clientes conectados a través de **WebSockets** (codificado en Base64), logrando una visualización en vivo muy fluida.

## 5. Seguridad de Grado Profesional
Resalta que el proyecto no solo funciona, sino que es seguro contra ataques:
* **Autenticación JWT (JSON Web Tokens):** Nadie puede ver la cámara ni consumir los endpoints sin iniciar sesión. 
* **Protección Criptográfica:** Uso de `crypto.timingSafeEqual` para validar firmas y evitar ataques de canal lateral (timing attacks).
* **Rate Limiting:** Protección activa contra ataques de Denegación de Servicio (DoS), limitando el número de peticiones por minuto.
* **Validación estricta de datos:** El backend rechaza peticiones malformadas automáticamente.

## 6. Conclusión y Escalabilidad
* El sistema está diseñado para escalar. Al estar en **Docker**, se puede mover a servidores más grandes sin reescribir código.
* La base de datos en **Supabase** permite un registro histórico de eventos/alertas que puede usarse a futuro para auditorías de seguridad.

---

### 💡 Tips para la presentación:
1. **Muestra el Dashboard en vivo** si es posible, eso siempre da muchos puntos.
2. Si te preguntan sobre el problema de conexión que tuviste (el "Connection Refused"), puedes mencionarlo como un desafío técnico superado: *"Tuvimos que configurar la red de Docker en AWS para que pudiera comunicarse con el puerto del Host donde llegaba el túnel SSH"*. ¡Suena súper pro!
