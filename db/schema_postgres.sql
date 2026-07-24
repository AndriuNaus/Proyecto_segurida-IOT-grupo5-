-- =====================================================
-- SCHEMA POSTGRESQL PARA SUPABASE: sistema_seguridad
-- PROYECTO SEGURIDAD IOT - ESP32-CAM
-- =====================================================

-- 1. Crear tipos ENUM personalizados (PostgreSQL)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rol_usuario') THEN
        CREATE TYPE rol_usuario AS ENUM ('Cliente', 'Admin', 'Tecnico');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_acceso') THEN
        CREATE TYPE tipo_acceso AS ENUM ('Ingreso', 'Egreso');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_ubicacion') THEN
        CREATE TYPE tipo_ubicacion AS ENUM ('Casa', 'Negocio', 'Departamento', 'Otro');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_evento') THEN
        CREATE TYPE tipo_evento AS ENUM ('Movimiento', 'Persona', 'Ruido', 'Puerta', 'Otro');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'nivel_riesgo') THEN
        CREATE TYPE nivel_riesgo AS ENUM ('Bajo', 'Medio', 'Alto');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_alerta') THEN
        CREATE TYPE estado_alerta AS ENUM ('Pendiente', 'Atendida', 'Descartada');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prioridad_alerta') THEN
        CREATE TYPE prioridad_alerta AS ENUM ('Baja', 'Media', 'Alta');
    END IF;
END $$;

-- 2. Tabla: usuario
CREATE TABLE IF NOT EXISTS usuario (
  id_usuario SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  telefono VARCHAR(20) NOT NULL UNIQUE,
  correo VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  rol rol_usuario NOT NULL DEFAULT 'Cliente',
  direccion VARCHAR(255) NOT NULL
);

-- 3. Tabla: acceso
CREATE TABLE IF NOT EXISTS acceso (
  id_acceso SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE,
  fecha_hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tipo_acceso tipo_acceso NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_acceso_usuario ON acceso (id_usuario);

-- 4. Tabla: ubicacion
CREATE TABLE IF NOT EXISTS ubicacion (
  id_ubicacion SERIAL PRIMARY KEY,
  nombre_lugar VARCHAR(100) NOT NULL,
  direccion VARCHAR(255) DEFAULT NULL,
  latitud DECIMAL(10,8) NOT NULL,
  longitud DECIMAL(11,8) NOT NULL,
  tipo tipo_ubicacion DEFAULT 'Otro'
);

-- 5. Tabla: dispositivo
CREATE TABLE IF NOT EXISTS dispositivo (
  id_dispositivo SERIAL PRIMARY KEY,
  nombre_dispositivo VARCHAR(100) DEFAULT NULL,
  estado VARCHAR(50) NOT NULL DEFAULT 'Activo',
  id_ubicacion INT NOT NULL REFERENCES ubicacion(id_ubicacion) ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_dispositivo_ubicacion ON dispositivo (id_ubicacion);

-- 6. Tabla: evento (Detecciones de Cámara / Sensores)
CREATE TABLE IF NOT EXISTS evento (
  id_evento SERIAL PRIMARY KEY,
  tipo_evento tipo_evento NOT NULL,
  descripcion VARCHAR(255) DEFAULT NULL,
  fecha_hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  id_dispositivo INT NOT NULL REFERENCES dispositivo(id_dispositivo) ON DELETE CASCADE ON UPDATE CASCADE,
  nivel_riesgo nivel_riesgo NOT NULL DEFAULT 'Bajo'
);
CREATE INDEX IF NOT EXISTS idx_evento_dispositivo ON evento (id_dispositivo);

-- 7. Tabla: alerta
CREATE TABLE IF NOT EXISTS alerta (
  id_alerta SERIAL PRIMARY KEY,
  id_evento INT NOT NULL REFERENCES evento(id_evento) ON DELETE CASCADE ON UPDATE CASCADE,
  estado estado_alerta NOT NULL DEFAULT 'Pendiente',
  fecha_alerta TIMESTAMPTZ DEFAULT NOW(),
  prioridad prioridad_alerta NOT NULL DEFAULT 'Media'
);
CREATE INDEX IF NOT EXISTS idx_alerta_evento ON alerta (id_evento);

-- 8. Tabla: backend_registro (Auditoría de API)
CREATE TABLE IF NOT EXISTS backend_registro (
  id_backend_registro SERIAL PRIMARY KEY,
  id_dispositivo INT NOT NULL REFERENCES dispositivo(id_dispositivo) ON DELETE CASCADE ON UPDATE CASCADE,
  id_evento INT REFERENCES evento(id_evento) ON DELETE SET NULL ON UPDATE CASCADE,
  endpoint VARCHAR(255) DEFAULT NULL,
  metodo VARCHAR(10) DEFAULT NULL,
  payload TEXT DEFAULT NULL,
  respuesta_backend TEXT DEFAULT NULL,
  codigo_estado INT DEFAULT NULL,
  fecha_peticion TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_backend_dispositivo ON backend_registro (id_dispositivo);

-- 9. Tabla: evidencia (Guardado de Imágenes / Capturas de la ESP32-CAM)
CREATE TABLE IF NOT EXISTS evidencia (
  id_evidencia SERIAL PRIMARY KEY,
  id_evento INT NOT NULL REFERENCES evento(id_evento) ON DELETE CASCADE ON UPDATE CASCADE,
  tipo_archivo VARCHAR(50) DEFAULT 'image/jpeg',
  ruta_archivo VARCHAR(500) DEFAULT NULL, -- URL pública o path en Supabase Storage
  fecha_registro TIMESTAMPTZ DEFAULT NOW(),
  id_dispositivo INT NOT NULL REFERENCES dispositivo(id_dispositivo) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_evidencia_evento ON evidencia (id_evento);
CREATE INDEX IF NOT EXISTS idx_evidencia_dispositivo ON evidencia (id_dispositivo);

-- 10. Tabla: historial_dispositivo
CREATE TABLE IF NOT EXISTS historial_dispositivo (
  id_historial SERIAL PRIMARY KEY,
  id_dispositivo INT NOT NULL REFERENCES dispositivo(id_dispositivo) ON DELETE CASCADE ON UPDATE CASCADE,
  fecha_cambio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  estado_anterior VARCHAR(50) DEFAULT NULL,
  estado_nuevo VARCHAR(50) DEFAULT NULL,
  descripcion VARCHAR(255) DEFAULT NULL
);

-- 11. Tabla: mascota
CREATE TABLE IF NOT EXISTS mascota (
  id_mascota SERIAL PRIMARY KEY,
  nombre VARCHAR(50) DEFAULT NULL,
  usuario_id_usuario INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE
);

-- 12. Tabla: notificacion
CREATE TABLE IF NOT EXISTS notificacion (
  id_notificacion SERIAL PRIMARY KEY,
  mensaje VARCHAR(255) NOT NULL,
  fecha_envio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  id_evento INT NOT NULL REFERENCES evento(id_evento) ON DELETE CASCADE ON UPDATE CASCADE,
  id_usuario INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 13. Tabla: camera_config (Configuración del flujo de la ESP32-CAM)
CREATE TABLE IF NOT EXISTS camera_config (
  id INT PRIMARY KEY,
  resolution VARCHAR(10) NOT NULL,
  stream_quality INT NOT NULL,
  motion_detection BOOLEAN NOT NULL,
  esp32_cam_url VARCHAR(255) NOT NULL
);

-- Insertar configuración por defecto para la ESP32-CAM
INSERT INTO camera_config (id, resolution, stream_quality, motion_detection, esp32_cam_url)
VALUES (1, 'VGA', 30, false, 'https://iot-security.pro/api/camera/stream')
ON CONFLICT (id) DO NOTHING;
