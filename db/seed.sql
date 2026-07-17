-- =====================================================
-- DATA SEED SCRIPT: CARGA DE DATOS DE PRUEBA
-- PROYECTO SEGURIDAD IOT - GRUPO 5
-- =====================================================

USE `sistema_seguridad` ;

-- -----------------------------------------------------
-- 1. Cargar Registros en la Tabla `usuario` (Mínimo 20 registros)
-- -----------------------------------------------------
INSERT INTO `sistema_seguridad`.`usuario` (`id_usuario`, `nombre`, `telefono`, `correo`, `password`, `rol`, `direccion`) VALUES
(1, 'Admin Principal', '999999999', 'admin', 'admin123', 'Admin', 'Oficina Central'),
(2, 'Anyela Carpio', '988888888', 'anyella', '1234', 'Admin', 'Calle Principal 123'),
(3, 'Juan Perez', '977777777', 'juan@security.com', 'user123', 'Cliente', 'Av. Arequipa 456'),
(4, 'Maria Gomez', '966666666', 'maria@security.com', 'user123', 'Cliente', 'Calle Los Pinos 789'),
(5, 'Carlos Lopez', '955555555', 'carlos@security.com', 'user123', 'Cliente', 'Jr. Junin 101'),
(6, 'Ana Martinez', '944444444', 'ana@security.com', 'user123', 'Cliente', 'Av. Larco 202'),
(7, 'Pedro Quispe', '933333333', 'pedro@security.com', 'user123', 'Cliente', 'Calle Lima 303'),
(8, 'Laura Torres', '922222222', 'laura@security.com', 'user123', 'Cliente', 'Av. Javier Prado 404'),
(9, 'Luis Flores', '911111111', 'luis@security.com', 'user123', 'Cliente', 'Calle San Martin 505'),
(10, 'Sofia Castro', '900000000', 'sofia@security.com', 'user123', 'Cliente', 'Av. Tacna 606'),
(11, 'Diego Diaz', '991111111', 'diego@security.com', 'user123', 'Cliente', 'Calle Bolivar 707'),
(12, 'Elena Silva', '992222222', 'elena@security.com', 'user123', 'Cliente', 'Av. Brasil 808'),
(13, 'Javier Ruiz', '993333333', 'javier@security.com', 'user123', 'Cliente', 'Calle Tarapaca 909'),
(14, 'Lucia Ramos', '994444444', 'lucia@security.com', 'user123', 'Cliente', 'Av. Salaverry 111'),
(15, 'Miguel Angel', '995555555', 'miguel@security.com', 'user123', 'Cliente', 'Calle Cusco 222'),
(16, 'Carmen Rosa', '996666666', 'carmen@security.com', 'user123', 'Cliente', 'Av. La Marina 333'),
(17, 'Roberto Carlos', '997777777', 'roberto@security.com', 'user123', 'Cliente', 'Calle Ica 444'),
(18, 'Patricia Sanchez', '998888888', 'patricia@security.com', 'user123', 'Cliente', 'Av. Angamos 555'),
(19, 'Jose Manuel', '999999991', 'jose@security.com', 'user123', 'Cliente', 'Calle Ayacucho 666'),
(20, 'Técnico Especialista', '999999992', 'tecnico@security.com', 'tecnico123', 'Tecnico', 'Taller Central')
ON DUPLICATE KEY UPDATE id_usuario=id_usuario;

-- -----------------------------------------------------
-- 2. Cargar Registros en la Tabla `ubicacion` (5 ubicaciones de ejemplo)
-- -----------------------------------------------------
INSERT INTO `sistema_seguridad`.`ubicacion` (`id_ubicacion`, `nombre_lugar`, `direccion`, `latitud`, `longitud`, `tipo`) VALUES
(1, 'Casa Central', 'Av. Primavera 123', -12.04637400, -77.04279300, 'Casa'),
(2, 'Negocio Repuestos', 'Av. Argentina 456', -12.04351200, -77.05128300, 'Negocio'),
(3, 'Departamento Anderson', 'Calle Alcanfores 789', -12.12239400, -77.02839200, 'Departamento'),
(4, 'Oficina Principal', 'Av. Rivera Navarrete 101', -12.09542300, -77.02294100, 'Negocio'),
(5, 'Almacén Secundario', 'Calle Industrial 302', -12.02941200, -77.01239400, 'Otro')
ON DUPLICATE KEY UPDATE id_ubicacion=id_ubicacion;

-- -----------------------------------------------------
-- 3. Cargar Registros en la Tabla `dispositivo` (5 dispositivos asociados)
-- -----------------------------------------------------
INSERT INTO `sistema_seguridad`.`dispositivo` (`id_dispositivo`, `nombre_dispositivo`, `estado`, `id_ubicacion`) VALUES
(1, 'ESP32-CAM Entrada', 'Activo', 1),
(2, 'Cámara Patio', 'Activo', 1),
(3, 'Sensor Movimiento Pasillo', 'Activo', 3),
(4, 'Cámara Caja Registradora', 'Activo', 2),
(5, 'Sensor Puerta Principal', 'Activo', 4)
ON DUPLICATE KEY UPDATE id_dispositivo=id_dispositivo;

-- -----------------------------------------------------
-- 4. Cargar Registros en la Tabla `evento` (Mínimo 20 registros)
-- -----------------------------------------------------
INSERT INTO `sistema_seguridad`.`evento` (`id_evento`, `tipo_evento`, `descripcion`, `id_dispositivo`, `nivel_riesgo`) VALUES
(1, 'Movimiento', 'Detección en puerta principal', 1, 'Bajo'),
(2, 'Persona', 'Persona detectada en jardín', 2, 'Medio'),
(3, 'Ruido', 'Ruido sospechoso en almacén', 4, 'Bajo'),
(4, 'Puerta', 'Apertura de puerta trasera', 5, 'Alto'),
(5, 'Movimiento', 'Movimiento en pasillo central', 3, 'Bajo'),
(6, 'Movimiento', 'Detección en la entrada', 1, 'Bajo'),
(7, 'Persona', 'Persona ingresando a la oficina', 5, 'Bajo'),
(8, 'Ruido', 'Fuerte golpe en el patio', 2, 'Medio'),
(9, 'Puerta', 'Puerta principal abierta fuera de horario', 5, 'Alto'),
(10, 'Otro', 'Fallo de conexión del dispositivo', 1, 'Bajo'),
(11, 'Movimiento', 'Movimiento detectado en zona restringida', 4, 'Medio'),
(12, 'Persona', 'Desconocido merodeando el negocio', 4, 'Alto'),
(13, 'Puerta', 'Puerta del almacén abierta', 5, 'Bajo'),
(14, 'Movimiento', 'Actividad detectada en balcón', 3, 'Medio'),
(15, 'Persona', 'Propietario detectado en entrada', 1, 'Bajo'),
(16, 'Ruido', 'Grito escuchado cerca del perímetro', 2, 'Alto'),
(17, 'Movimiento', 'Movimiento nocturno en el jardín', 2, 'Medio'),
(18, 'Puerta', 'Puerta del pasillo abierta', 3, 'Bajo'),
(19, 'Otro', 'Batería baja en sensor de movimiento', 3, 'Bajo'),
(20, 'Persona', 'Dos personas detectadas en zona de carga', 4, 'Medio')
ON DUPLICATE KEY UPDATE id_evento=id_evento;

-- -----------------------------------------------------
-- 5. Cargar Registros en la Tabla `alerta` (Mínimo 20 registros)
-- -----------------------------------------------------
INSERT INTO `sistema_seguridad`.`alerta` (`id_alerta`, `id_evento`, `estado`, `prioridad`) VALUES
(1, 1, 'Atendida', 'Baja'),
(2, 2, 'Atendida', 'Media'),
(3, 3, 'Descartada', 'Baja'),
(4, 4, 'Pendiente', 'Alta'),
(5, 5, 'Atendida', 'Baja'),
(6, 6, 'Descartada', 'Baja'),
(7, 7, 'Atendida', 'Baja'),
(8, 8, 'Atendida', 'Media'),
(9, 9, 'Pendiente', 'Alta'),
(10, 10, 'Atendida', 'Baja'),
(11, 11, 'Pendiente', 'Media'),
(12, 12, 'Pendiente', 'Alta'),
(13, 13, 'Descartada', 'Baja'),
(14, 14, 'Pendiente', 'Media'),
(15, 15, 'Atendida', 'Baja'),
(16, 16, 'Pendiente', 'Alta'),
(17, 17, 'Atendida', 'Media'),
(18, 18, 'Descartada', 'Baja'),
(19, 19, 'Pendiente', 'Baja'),
(20, 20, 'Pendiente', 'Media')
ON DUPLICATE KEY UPDATE id_alerta=id_alerta;

-- -----------------------------------------------------
-- 6. Configuración de Cámara ESP32-CAM por defecto
-- -----------------------------------------------------
INSERT INTO `sistema_seguridad`.`camera_config` (`id`, `resolution`, `stream_quality`, `motion_detection`, `esp32_cam_url`) 
VALUES (1, 'VGA', 30, FALSE, 'http://192.168.4.1:81/stream')
ON DUPLICATE KEY UPDATE esp32_cam_url='http://192.168.4.1:81/stream';
