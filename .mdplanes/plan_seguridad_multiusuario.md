# Plan de Escalabilidad y Seguridad Multi-Usuario (Optimizado)

Analizando la base de datos actual, tienes razón. Es mucho mejor **reutilizar las tablas existentes** en lugar de crear nuevas desde cero. Esto hace que la migración sea más fácil y no altera el ecosistema actual.

---

## 1. Reutilización de la Tabla `camera_config`
Actualmente, el sistema siempre lee la cámara con `id = 1` en la tabla `camera_config`. 
Vamos a convertir esta tabla para que pueda almacenar múltiples cámaras, una (o varias) para cada usuario.

**Cambios en la tabla (SQL necesario):**
```sql
-- Agregar dueño a la cámara
ALTER TABLE camera_config ADD COLUMN owner_id INT REFERENCES usuario(id_usuario) ON DELETE CASCADE;
-- Agregar nombre descriptivo a la cámara
ALTER TABLE camera_config ADD COLUMN nombre VARCHAR(100) DEFAULT 'Mi ESP32-CAM';
```

---

## 2. Reutilización de la Tabla `residents` (Familiares)
Actualmente los residentes están mezclados globalmente. Le agregaremos la columna `owner_id` para que cada cliente solo vea a *sus* familiares en el panel.

**Cambios en la tabla (SQL necesario):**
```sql
ALTER TABLE residents ADD COLUMN owner_id INT REFERENCES usuario(id_usuario) ON DELETE CASCADE;
```

---

## 3. Integración de Mascotas (Pets)
Dado que la IA (MediaPipe) ya detecta animales, los clientes podrán registrar a sus mascotas.

**Cambios en la tabla (SQL necesario):**
```sql
-- Si la tabla no existe, se crea así:
CREATE TABLE mascota (
  id_mascota SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  tipo VARCHAR(50), -- (Perro, Gato, etc)
  owner_id INT REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  fecha_registro TIMESTAMP DEFAULT NOW()
);
-- Si ya existe, solo le agregamos el owner_id:
-- ALTER TABLE mascota ADD COLUMN owner_id INT REFERENCES usuario(id_usuario) ON DELETE CASCADE;
```

---

## 4. Lógica del Backend (El Candado de Privacidad)

En lugar de consultar `camera_config` donde `id = 1`, ahora el backend:
1. Leerá el token del usuario logueado (`req.user.sub`).
2. Buscará en `camera_config` donde `owner_id` coincida con el usuario.
3. Si el usuario no tiene ninguna cámara registrada, le devolverá un arreglo vacío `[]`.
4. Solo se le enviará el stream MJPEG si la cámara que intenta ver le pertenece. 

---

## 5. Flujo en el Dashboard (Frontend)

1. **Gestión de Clientes (Vista Admin):** El administrador usa la nueva pestaña "Accesos" (que ya creamos) para habilitar cuentas.
2. **Mis Dispositivos (Vista Cliente):** 
   - El cliente entra al Dashboard.
   - Si no tiene cámaras registradas, el cuadro de video dirá: *"No tienes cámaras. Haz clic en Agregar Dispositivo"*.
   - Habrá un botón para insertar la URL (Ej: `http://192.168.1.100:81/stream`) o el código de la cámara y registrarla a su nombre.
3. **Gestión de Familiares y Mascotas:** 
   - Desde su panel, cada cliente podrá agregar cuántos familiares viven en la casa y cuántas mascotas tienen, lo que ayudará al sistema de Alertas Inteligentes a discernir falsas alarmas (Ej: "Movimiento detectado, pero es el perro registrado").
4. **El Túnel SSH:** Sigue intacto. La URL de la cámara de AWS (`localhost:8081`) simplemente se asignará al cliente principal de pruebas para que la presentación siga funcionando espectacularmente.

---

**Resumen:** Reutilizando `camera_config`, `residents` y agregando/vinculando `mascota`, logramos un ecosistema multi-inquilino real donde cada usuario tiene su propia privacidad de video, familia y mascotas, todo sin quebrar el código base existente de la ESP32.
