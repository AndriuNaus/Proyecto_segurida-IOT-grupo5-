-- =====================================================
-- SEED DATA POSTGRESQL PARA SUPABASE: sistema_seguridad
-- =====================================================

-- 1. Usuarios
INSERT INTO usuario (id_usuario, nombre, telefono, correo, password, rol, direccion) VALUES
(1, 'Admin Principal', '999999999', 'admin', 'Security.14', 'Admin', 'Oficina Central'),
(2, 'Anyela Carpio', '988888888', 'anyella', '1234', 'Admin', 'Calle Principal 123'),
(3, 'Juan Perez', '977777777', 'juan@security.com', 'user123', 'Cliente', 'Av. Arequipa 456'),
(4, 'Maria Gomez', '966666666', 'maria@security.com', 'user123', 'Cliente', 'Calle Los Pinos 789'),
(5, 'Carlos Lopez', '955555555', 'carlos@security.com', 'user123', 'Cliente', 'Jr. Junin 101')
ON CONFLICT (id_usuario) DO NOTHING;

SELECT setval('usuario_id_usuario_seq', (SELECT MAX(id_usuario) FROM usuario));

-- 2. Ubicaciones
INSERT INTO ubicacion (id_ubicacion, nombre_lugar, direccion, latitud, longitud, tipo) VALUES
(1, 'Casa Central', 'Av. Primavera 123', -12.04637400, -77.04279300, 'Casa'),
(2, 'Negocio Repuestos', 'Av. Argentina 456', -12.04351200, -77.05128300, 'Negocio'),
(3, 'Departamento Anderson', 'Calle Alcanfores 789', -12.12239400, -77.02839200, 'Departamento')
ON CONFLICT (id_ubicacion) DO NOTHING;

SELECT setval('ubicacion_id_ubicacion_seq', (SELECT MAX(id_ubicacion) FROM ubicacion));

-- 3. Dispositivos (Cámaras ESP32-CAM)
INSERT INTO dispositivo (id_dispositivo, nombre_dispositivo, estado, id_ubicacion) VALUES
(1, 'ESP32-CAM Entrada Principal', 'Activo', 1),
(2, 'Cámara Patio Trasero', 'Activo', 1),
(3, 'Sensor Movimiento Pasillo', 'Activo', 3)
ON CONFLICT (id_dispositivo) DO NOTHING;

SELECT setval('dispositivo_id_dispositivo_seq', (SELECT MAX(id_dispositivo) FROM dispositivo));

-- 4. Eventos de Cámara / Sensores
INSERT INTO evento (id_evento, tipo_evento, descripcion, id_dispositivo, nivel_riesgo) VALUES
(1, 'Movimiento', 'Detección de movimiento en puerta principal', 1, 'Medio'),
(2, 'Persona', 'Persona detectada en cámara entrada', 1, 'Alto'),
(3, 'Ruido', 'Ruido sospechoso detectado', 3, 'Bajo')
ON CONFLICT (id_evento) DO NOTHING;

SELECT setval('evento_id_evento_seq', (SELECT MAX(id_evento) FROM evento));

-- 5. Alertas
INSERT INTO alerta (id_alerta, id_evento, estado, prioridad) VALUES
(1, 1, 'Atendida', 'Media'),
(2, 2, 'Pendiente', 'Alta'),
(3, 3, 'Descartada', 'Baja')
ON CONFLICT (id_alerta) DO NOTHING;

SELECT setval('alerta_id_alerta_seq', (SELECT MAX(id_alerta) FROM alerta));

-- 6. Configuración de Cámara ESP32-CAM
INSERT INTO camera_config (id, resolution, stream_quality, motion_detection, esp32_cam_url)
VALUES (1, 'VGA', 30, false, 'https://iot-security.pro/api/camera/stream')
ON CONFLICT (id) DO NOTHING;
