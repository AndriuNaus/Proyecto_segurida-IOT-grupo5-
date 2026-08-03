# 📋 Instrucciones para el Frontend (Seguridad de la Cámara)

¡Hola! Soy la IA que está ayudando a Anderson con el backend del proyecto. Hemos realizado una actualización importante en la seguridad de la cámara y necesitamos tu ayuda para adaptar el frontend.

## 🔒 ¿Qué hicimos y por qué?
Antes, el endpoint de la cámara (`/api/camera/stream`) era completamente público. Si alguien adivinaba la URL de la API, podía ver la cámara de la casa de Anderson sin iniciar sesión.

Para arreglarlo:
1. **Hemos protegido** el acceso al stream en el backend.
2. Como el `<img src="...">` de HTML no soporta enviar encabezados `Authorization: Bearer`, hemos implementado un sistema de **"Token temporal"**.
3. **Todo está integrado con tu Supabase Auth.** No tienes que crear usuarios en nuestra base de datos.

## 🛠️ ¿Qué tienes que cambiar en el frontend (React)?

Necesitas modificar el componente donde estás renderizando la imagen en vivo de la cámara (seguramente en `LiveStream.jsx` o similar).

**El flujo ahora es este:**
1. Usas el token actual de sesión de Supabase.
2. Haces un `POST` a nuestro nuevo endpoint `/api/camera/stream-token`.
3. Te devolveremos un token de 10 minutos.
4. Se lo pones a la URL de la imagen: `?token=<NUEVO_TOKEN>`.

### Código de ejemplo para implementar:

```jsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; // Tu cliente de Supabase

function LiveStreamCamera() {
  const [streamUrl, setStreamUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStreamToken() {
      try {
        // 1. Obtener la sesión actual de Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          throw new Error('No hay sesión activa. Inicia sesión primero.');
        }

        // 2. Pedir un token temporal a la API de Anderson usando tu token de Supabase
        const response = await fetch('https://api.iot-security.pro/api/camera/stream-token', {
          method: 'POST',
          headers: {
            // Mandamos tu token de Supabase en el Authorization
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('No autorizado para ver la cámara.');
        }

        const data = await response.json();
        
        // 3. Establecer la URL del stream con el token
        const finalUrl = `https://api.iot-security.pro/api/camera/stream?token=${data.streamToken}`;
        setStreamUrl(finalUrl);

      } catch (err) {
        console.error(err);
        setError(err.message);
      }
    }

    fetchStreamToken();
  }, []);

  if (error) return <p className="text-red-500">{error}</p>;
  if (!streamUrl) return <p>Cargando cámara segura...</p>;

  return (
    <div>
      <img src={streamUrl} alt="ESP32-CAM Live Stream" className="w-full h-auto rounded-lg shadow-lg" />
    </div>
  );
}
```

¡Eso es todo! Con este cambio, nuestro backend verificará con tu Supabase si el usuario es válido, le dará acceso por 10 minutos y el video se mostrará seguro. 🚀
