# Contexto de Implementación: Bot de Telegram + Tablas Pendientes
> Fecha: 2026-07-29 | Estado: Funcionando en LOCAL, pendiente de subir a AWS

---

## ✅ Lo que ya funciona en LOCAL

### Bot de Telegram
- **Archivo:** `src/services/telegram.service.ts`
- Usa `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` del `.env`
- Envía mensajes con formato Markdown a Telegram

### Flujo completo de alerta (`POST /api/alerts`)
1. Frontend detecta persona → manda `{ message, confidence, tipo_evento }`
2. Backend crea **evento** en tabla `evento` (Supabase)
3. Backend crea **alerta** en tabla `alerta` vinculada al evento
4. Backend envía mensaje a Telegram con formato:
   ```
   🚨 Alerta de Seguridad
   [mensaje] (Confianza: X%)
   📋 Alerta #N registrada
   ```
5. Responde 200 aunque Telegram falle (no bloquea el flujo)

### Logging en `backend_registro`
- **Middleware:** `src/middlewares/logger.ts` — guarda CADA petición HTTP en Supabase
- **Repositorio:** `src/repositories/backend_registro.repository.ts`
- Guarda: `endpoint`, `metodo`, `payload`, `respuesta_backend`, `codigo_estado`, `id_dispositivo`, `id_evento`
- El controller de alertas enriquece el log con `id_evento` para trazabilidad
- ⚠️ **Pendiente:** Filtrar mejor qué rutas se loguean (actualmente guarda todo excepto `/health` y `/assets`)

### Variables de entorno necesarias en `.env`
```env
TELEGRAM_BOT_TOKEN=8942877754:AAE3YUknigirgcXQf4xU7O_3ngO6IOeUCZQ
TELEGRAM_CHAT_ID=1043412898
```
> ⚠️ Estas variables NO están en el `.env.example` aún — agregar antes de hacer deploy a AWS

---

## 🗂 Archivos creados/modificados en esta sesión

| Archivo | Estado | Descripción |
|---|---|---|
| `src/services/telegram.service.ts` | ✅ Existe | Envío de mensajes a Telegram via HTTP |
| `src/controllers/alerts.controller.ts` | ✅ Modificado | Flujo: guardar evento+alerta → Telegram → log |
| `src/repositories/alertas.repository.ts` | ✅ Reescrito | Crea evento + alerta en Supabase (tablas reales) |
| `src/repositories/backend_registro.repository.ts` | ✅ Nuevo | Escribe en tabla `backend_registro` |
| `src/middlewares/logger.ts` | ✅ Modificado | Ahora guarda en Supabase además de consola |
| `src/routes/alerts.routes.ts` | ✅ Existe | Ruta `POST /api/alerts` protegida con JWT |
| `.env` | ✅ Modificado | Agregadas variables de Telegram |

---

## 🔴 Tablas que aún NO tienen implementación completa

### 1. `notificacion`
**Schema:**
```sql
CREATE TABLE IF NOT EXISTS notificacion (
  id_notificacion SERIAL PRIMARY KEY,
  mensaje VARCHAR(255) NOT NULL,
  fecha_envio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  id_evento INT NOT NULL REFERENCES evento(id_evento),
  id_usuario INT NOT NULL REFERENCES usuario(id_usuario)
);
```
**Propósito:** Registrar que se envió una notificación (Telegram u otro canal) a un usuario específico, vinculada a un evento.

**Lo que falta implementar:**
- `src/repositories/notificacion.repository.ts` — insertar/listar notificaciones
- Llamar a `NotificacionRepository.registrar()` dentro de `alerts.controller.ts` después de que Telegram envíe exitosamente
- Pasar `id_usuario` desde el JWT al controller

**Lógica propuesta:**
```typescript
// Dentro de alerts.controller.ts, después de que enviado === true:
await NotificacionRepository.registrar({
  mensaje: telegramMensaje,
  id_evento: alertaGuardada.id_evento,
  id_usuario: user.id  // viene del JWT
});
```

---

### 2. `evidencia`
**Schema:**
```sql
CREATE TABLE IF NOT EXISTS evidencia (
  id_evidencia SERIAL PRIMARY KEY,
  id_evento INT NOT NULL REFERENCES evento(id_evento),
  tipo_archivo VARCHAR(50) DEFAULT 'image/jpeg',
  ruta_archivo VARCHAR(500) DEFAULT NULL,  -- URL en Supabase Storage
  fecha_registro TIMESTAMPTZ DEFAULT NOW(),
  id_dispositivo INT NOT NULL REFERENCES dispositivo(id_dispositivo)
);
```
**Propósito:** Guardar capturas de imagen (frames del ESP32-CAM) vinculadas a un evento de detección.

**Repositorio:** `src/repositories/evidencia.repository.ts` — ✅ YA EXISTE con `registrarEvidencia()` y `obtenerEvidenciasPorEvento()`

**Lo que falta implementar:**
- Cuando el frontend detecta una persona, enviar el frame como base64 en el body de `/api/alerts`
- En el controller, subir el frame a **Supabase Storage** bucket `evidencias`
- Luego llamar a `EvidenciaRepository.registrarEvidencia()` con la URL pública

**Lógica propuesta en `alerts.controller.ts`:**
```typescript
if (req.body.imagen_base64) {
  const buffer = Buffer.from(req.body.imagen_base64, 'base64');
  const filename = `frame_${Date.now()}.jpg`;
  
  const { data: storageData } = await supabase.storage
    .from('evidencias')
    .upload(filename, buffer, { contentType: 'image/jpeg' });
  
  await EvidenciaRepository.registrarEvidencia({
    id_evento: alertaGuardada.id_evento,
    tipo_archivo: 'image/jpeg',
    ruta_archivo: storageData?.path ?? null,
    id_dispositivo: 1
  });
}
```

---

### 3. `historial_dispositivo`
**Schema:**
```sql
CREATE TABLE IF NOT EXISTS historial_dispositivo (
  id_historial SERIAL PRIMARY KEY,
  id_dispositivo INT NOT NULL REFERENCES dispositivo(id_dispositivo),
  fecha_cambio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  estado_anterior VARCHAR(50) DEFAULT NULL,
  estado_nuevo VARCHAR(50) DEFAULT NULL,
  descripcion VARCHAR(255) DEFAULT NULL
);
```
**Propósito:** Registrar cambios de estado del ESP32-CAM (Activo → Inactivo, configuración cambiada, etc.)

**Lo que falta implementar:**
- `src/repositories/historial_dispositivo.repository.ts`
- Llamar a `HistorialDispositivoRepository.registrar()` en `camera.routes.ts` o en el controller de cámara cuando cambia la configuración o el estado

**Lógica propuesta:**
```typescript
// Cuando se cambia configuración de cámara:
await HistorialDispositivoRepository.registrar({
  id_dispositivo: 1,
  estado_anterior: 'Activo',
  estado_nuevo: 'Configurando',
  descripcion: `Cambio de resolución a ${resolution}`
});
```

---

## 🚀 Plan de deploy a AWS (cuando esté listo)

### Antes de hacer push
- [ ] Agregar `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` como **secrets de GitHub Actions**
- [ ] Actualizar `.env.example` con las nuevas variables (sin valores reales)
- [ ] Verificar que el bucket `evidencias` existe en Supabase Storage
- [ ] Probar localmente el flujo completo: detección → evento → alerta → Telegram → notificacion → evidencia

### Secrets a agregar en GitHub → Settings → Secrets and variables → Actions
```
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
```

### Posible causa del fallo anterior en AWS
El bot fallaba porque las variables `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` no existían en el entorno de Docker. El controller devolvía **500** cuando Telegram fallaba (ya corregido — ahora devuelve 200).

---

## 📋 Orden de implementación sugerido

1. **`notificacion`** — más urgente, es parte del flujo de alertas actual
2. **`evidencia`** — requiere trabajo en el frontend (enviar frame base64)
3. **`historial_dispositivo`** — menor prioridad, es solo auditoría del dispositivo
4. **Filtro en `backend_registro`** — decidir qué rutas loguear (ahora guarda todo)
