# Guía de Pruebas en Postman — API Sistema de Seguridad IoT

> **Base URL local:** `http://localhost:3000`  
> **Verificación de correo:** ⚠️ DESACTIVADA temporalmente  
> **Autenticación:** JWT en header `Authorization: Bearer <token>`

---

## ⚙️ Configuración inicial en Postman

1. Abre Postman → crea una **Collection** llamada `Sistema Seguridad IoT`
2. En la collection, ve a **Variables** y agrega:
   - `base_url` = `http://localhost:3000`
   - `token` = *(se llenará automáticamente tras el login)*
3. En cada request protegida, usa en **Auth** → `Bearer Token` → `{{token}}`

---

## 1. REGISTRO DE USUARIO

**`POST http://localhost:3000/api/auth/register`**

**Headers:**
```
Content-Type: application/json
```

**Body (raw → JSON):**
```json
{
  "username": "hector2@security.com",
  "password": "Password1234",
  "role": "cliente",
  "primer_nombre": "Hector",
  "primer_apellido": "Campoverde",
  "telefono": "9876543443",
  "direccion": "Calle 24 mayo"
}
```

**Campos obligatorios:**
| Campo | Regla |
|---|---|
| `username` | Email válido — es el correo de acceso |
| `password` | Mínimo 8 chars + 1 mayúscula + 1 número |
| `primer_nombre` | Requerido |
| `primer_apellido` | Requerido |
| `role` | `cliente` / `admin` / `tecnico` |
| `telefono` | Opcional |
| `direccion` | Opcional |

**Respuesta exitosa `201`:**
```json
{
  "message": "Usuario registrado exitosamente."
}
```

**Errores comunes:**
```json
{ "error": "El correo electrónico ya se encuentra registrado." }
{ "error": "El número de teléfono ya se encuentra registrado." }
{ "error": "Correo electrónico no válido." }
{ "error": "La contraseña debe tener al menos 8 caracteres." }
```

---

## 2. LOGIN

**`POST http://localhost:3000/api/auth/login`**

**Headers:**
```
Content-Type: application/json
```

**Body (raw → JSON):**
```json
{
  "username": "hector2@security.com",
  "password": "Password1234"
}
```

**Respuesta exitosa `200`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

> 💡 **Tip Postman:** En la pestaña **Tests** del request de login, agrega este script para guardar el token automáticamente:
> ```javascript
> const res = pm.response.json();
> if (res.token) {
>   pm.collectionVariables.set("token", res.token);
>   console.log("✅ Token guardado");
> }
> ```

**Errores comunes:**
```json
{ "error": "Credenciales incorrectas." }
```

---

## 3. ESTADO DE CÁMARA 🔒

**`GET http://localhost:3000/api/camera/status`**

**Headers:**
```
Authorization: Bearer {{token}}
```

**Respuesta exitosa `200`:**
```json
{
  "status": "success",
  "data": {
    "isConnected": true,
    "resolution": "VGA",
    "streamQuality": 10
  }
}
```

---

## 4. CONFIGURAR CÁMARA 🔒

**`POST http://localhost:3000/api/camera/configure`**

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body (raw → JSON):**
```json
{
  "resolution": "VGA",
  "streamQuality": 10
}
```

**Valores válidos para `resolution`:** `QQVGA`, `QVGA`, `VGA`, `SVGA`, `XGA`, `SXGA`, `UXGA`  
**Valores válidos para `streamQuality`:** entero entre `0` y `63`

**Respuesta exitosa `200`:**
```json
{
  "status": "success",
  "message": "Configuración actualizada"
}
```

---

## 5. ENVIAR ALERTA (Bot de Telegram) 🔒

**`POST http://localhost:3000/api/alerts`**

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body (raw → JSON):**
```json
{
  "message": "🚨 ALERTA: Se ha detectado una persona en la cámara principal.",
  "confidence": 92,
  "tipo_evento": "Persona"
}
```

**Campos:**
| Campo | Valores | Descripción |
|---|---|---|
| `message` | string | Mensaje de la alerta (requerido) |
| `confidence` | 0–100 | Porcentaje de confianza de la IA |
| `tipo_evento` | `Movimiento` / `Persona` / `Ruido` / `Puerta` / `Otro` | Tipo de evento detectado |

**Respuesta exitosa `200`:**
```json
{
  "success": true,
  "message": "Alerta guardada y notificada por Telegram",
  "alerta": {
    "id_alerta": 5,
    "id_evento": 3,
    "estado": "Pendiente",
    "prioridad": "Alta",
    "fecha_alerta": "2026-07-29T15:00:00Z"
  },
  "telegramEnviado": true,
  "dbError": false
}
```

**Lógica de prioridad según confianza:**
| Confianza | nivel_riesgo | Prioridad |
|---|---|---|
| ≥ 80% | Alto | Alta |
| 50–79% | Medio | Media |
| < 50% | Bajo | Baja |

---

## 6. VERIFICAR EMAIL (endpoint activo pero verificación desactivada)

**`GET http://localhost:3000/api/auth/verify-email/:token`**

> ⚠️ Este endpoint existe pero la verificación está desactivada temporalmente.  
> Cuando se reactive, el link llegará al correo del usuario tras el registro.

---

## 🔐 Cómo usar el token en todas las rutas protegidas

Las rutas `/api/camera/*` y `/api/alerts` requieren JWT.  
El token expira en **1 hora** — si recibes `401`, haz login de nuevo.

**Header requerido:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Error si no hay token `401`:**
```json
{ "error": "Token no proporcionado." }
```

**Error si el token expiró `401`:**
```json
{ "error": "Token inválido o expirado." }
```

---

## 📋 Resumen de endpoints

| Método | Endpoint | Auth | Descripción |
|---|---|---|---|
| POST | `/api/auth/register` | ❌ | Registrar usuario |
| POST | `/api/auth/login` | ❌ | Login → devuelve JWT |
| GET | `/api/auth/verify-email/:token` | ❌ | Verificar correo (desactivado) |
| GET | `/api/camera/status` | ✅ JWT | Estado de la cámara |
| POST | `/api/camera/configure` | ✅ JWT | Configurar cámara |
| POST | `/api/alerts` | ✅ JWT | Enviar alerta + Telegram |
