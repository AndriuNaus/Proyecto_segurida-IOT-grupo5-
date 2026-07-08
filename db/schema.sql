-- =====================================================
-- SCHEMA DE BASE DE DATOS: sistema_seguridad
-- PROYECTO SEGURIDAD IOT - GRUPO 5
-- =====================================================

CREATE SCHEMA IF NOT EXISTS `sistema_seguridad` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
USE `sistema_seguridad` ;

-- -----------------------------------------------------
-- Table `sistema_seguridad`.`usuario`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sistema_seguridad`.`usuario` (
  `id_usuario` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(150) NOT NULL,
  `telefono` VARCHAR(20) NOT NULL,
  `correo` VARCHAR(100) NOT NULL,
  `password` VARCHAR(255) NOT NULL, -- Agregado para autenticación JWT
  `rol` ENUM('Cliente', 'Admin', 'Tecnico') NOT NULL DEFAULT 'Cliente',
  `direccion` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id_usuario`),
  UNIQUE INDEX `telefono` (`telefono` ASC) VISIBLE,
  UNIQUE INDEX `correo` (`correo` ASC) VISIBLE
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Table `sistema_seguridad`.`acceso`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sistema_seguridad`.`acceso` (
  `id_acceso` INT NOT NULL AUTO_INCREMENT,
  `id_usuario` INT NOT NULL,
  `fecha_hora` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `tipo_acceso` ENUM('Ingreso', 'Egreso') NOT NULL,
  PRIMARY KEY (`id_acceso`),
  INDEX `fk_acceso_usuario` (`id_usuario` ASC) VISIBLE,
  CONSTRAINT `fk_acceso_usuario`
    FOREIGN KEY (`id_usuario`)
    REFERENCES `sistema_seguridad`.`usuario` (`id_usuario`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Table `sistema_seguridad`.`ubicacion`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sistema_seguridad`.`ubicacion` (
  `id_ubicacion` INT NOT NULL AUTO_INCREMENT,
  `nombre_lugar` VARCHAR(100) NOT NULL,
  `direccion` VARCHAR(255) NULL DEFAULT NULL,
  `latitud` DECIMAL(10,8) NOT NULL,
  `longitud` DECIMAL(11,8) NOT NULL,
  `tipo` ENUM('Casa', 'Negocio', 'Departamento', 'Otro') NULL DEFAULT 'Otro',
  PRIMARY KEY (`id_ubicacion`)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Table `sistema_seguridad`.`dispositivo`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sistema_seguridad`.`dispositivo` (
  `id_dispositivo` INT NOT NULL AUTO_INCREMENT,
  `nombre_dispositivo` VARCHAR(100) NULL DEFAULT NULL,
  `estado` VARCHAR(50) NOT NULL DEFAULT 'Activo',
  `id_ubicacion` INT NOT NULL,
  PRIMARY KEY (`id_dispositivo`),
  INDEX `fk_dispositivo_ubicacion` (`id_ubicacion` ASC) VISIBLE,
  CONSTRAINT `fk_dispositivo_ubicacion`
    FOREIGN KEY (`id_ubicacion`)
    REFERENCES `sistema_seguridad`.`ubicacion` (`id_ubicacion`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Table `sistema_seguridad`.`evento`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sistema_seguridad`.`evento` (
  `id_evento` INT NOT NULL AUTO_INCREMENT,
  `tipo_evento` ENUM('Movimiento', 'Persona', 'Ruido', 'Puerta', 'Otro') NOT NULL,
  `descripcion` VARCHAR(255) NULL DEFAULT NULL,
  `fecha_hora` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `id_dispositivo` INT NOT NULL,
  `nivel_riesgo` ENUM('Bajo', 'Medio', 'Alto') NOT NULL DEFAULT 'Bajo',
  PRIMARY KEY (`id_evento`),
  INDEX `fk_evento_dispositivo` (`id_dispositivo` ASC) VISIBLE,
  CONSTRAINT `fk_evento_dispositivo`
    FOREIGN KEY (`id_dispositivo`)
    REFERENCES `sistema_seguridad`.`dispositivo` (`id_dispositivo`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Table `sistema_seguridad`.`alerta`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sistema_seguridad`.`alerta` (
  `id_alerta` INT NOT NULL AUTO_INCREMENT,
  `id_evento` INT NOT NULL,
  `estado` ENUM('Pendiente', 'Atendida', 'Descartada') NOT NULL DEFAULT 'Pendiente',
  `fecha_alerta` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `prioridad` ENUM('Baja', 'Media', 'Alta') NOT NULL DEFAULT 'Media',
  PRIMARY KEY (`id_alerta`),
  INDEX `fk_alerta_evento` (`id_evento` ASC) VISIBLE,
  CONSTRAINT `fk_alerta_evento`
    FOREIGN KEY (`id_evento`)
    REFERENCES `sistema_seguridad`.`evento` (`id_evento`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Table `sistema_seguridad`.`backend_registro`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sistema_seguridad`.`backend_registro` (
  `id_backend_registro` INT NOT NULL AUTO_INCREMENT,
  `id_dispositivo` INT NOT NULL,
  `id_evento` INT NULL DEFAULT NULL,
  `endpoint` VARCHAR(255) NULL DEFAULT NULL,
  `metodo` VARCHAR(10) NULL DEFAULT NULL,
  `payload` TEXT NULL DEFAULT NULL,
  `respuesta_backend` TEXT NULL DEFAULT NULL,
  `codigo_estado` INT NULL DEFAULT NULL,
  `fecha_peticion` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_backend_registro`),
  INDEX `fk_backend_dispositivo` (`id_dispositivo` ASC) VISIBLE,
  INDEX `fk_backend_evento` (`id_evento` ASC) VISIBLE,
  CONSTRAINT `fk_backend_dispositivo`
    FOREIGN KEY (`id_dispositivo`)
    REFERENCES `sistema_seguridad`.`dispositivo` (`id_dispositivo`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_backend_evento`
    FOREIGN KEY (`id_evento`)
    REFERENCES `sistema_seguridad`.`evento` (`id_evento`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Table `sistema_seguridad`.`evidencia`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sistema_seguridad`.`evidencia` (
  `id_evidencia` INT NOT NULL AUTO_INCREMENT,
  `id_evento` INT NOT NULL,
  `tipo_archivo` VARCHAR(50) NULL DEFAULT NULL,
  `fecha_registro` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `id_dispositivo` INT NOT NULL,
  PRIMARY KEY (`id_evidencia`),
  INDEX `fk_evidencia_evento` (`id_evento` ASC) VISIBLE,
  INDEX `fk_evidencia_dispositivo` (`id_dispositivo` ASC) VISIBLE,
  CONSTRAINT `fk_evidencia_dispositivo`
    FOREIGN KEY (`id_dispositivo`)
    REFERENCES `sistema_seguridad`.`dispositivo` (`id_dispositivo`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_evidencia_evento`
    FOREIGN KEY (`id_evento`)
    REFERENCES `sistema_seguridad`.`evento` (`id_evento`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Table `sistema_seguridad`.`historial_dispositivo`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sistema_seguridad`.`historial_dispositivo` (
  `id_historial` INT NOT NULL AUTO_INCREMENT,
  `id_dispositivo` INT NOT NULL,
  `fecha_cambio` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `estado_anterior` VARCHAR(50) NULL DEFAULT NULL,
  `estado_nuevo` VARCHAR(50) NULL DEFAULT NULL,
  `descripcion` VARCHAR(255) NULL DEFAULT NULL,
  PRIMARY KEY (`id_historial`),
  INDEX `fk_historial_dispositivo` (`id_dispositivo` ASC) VISIBLE,
  CONSTRAINT `fk_historial_dispositivo`
    FOREIGN KEY (`id_dispositivo`)
    REFERENCES `sistema_seguridad`.`dispositivo` (`id_dispositivo`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Table `sistema_seguridad`.`mascota`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sistema_seguridad`.`mascota` (
  `id_mascota` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(50) NULL DEFAULT NULL,
  `usuario_id_usuario` INT NOT NULL,
  PRIMARY KEY (`id_mascota`),
  INDEX `fk_mascota_usuario1_idx` (`usuario_id_usuario` ASC) VISIBLE,
  CONSTRAINT `fk_mascota_usuario1`
    FOREIGN KEY (`usuario_id_usuario`)
    REFERENCES `sistema_seguridad`.`usuario` (`id_usuario`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Table `sistema_seguridad`.`notificacion`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sistema_seguridad`.`notificacion` (
  `id_notificacion` INT NOT NULL AUTO_INCREMENT,
  `mensaje` VARCHAR(255) NOT NULL,
  `fecha_envio` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `id_evento` INT NOT NULL,
  `id_usuario` INT NOT NULL,
  PRIMARY KEY (`id_notificacion`),
  INDEX `fk_notificacion_evento` (`id_evento` ASC) VISIBLE,
  INDEX `fk_notificacion_usuario` (`id_usuario` ASC) VISIBLE,
  CONSTRAINT `fk_notificacion_evento`
    FOREIGN KEY (`id_evento`)
    REFERENCES `sistema_seguridad`.`evento` (`id_evento`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_notificacion_usuario`
    FOREIGN KEY (`id_usuario`)
    REFERENCES `sistema_seguridad`.`usuario` (`id_usuario`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Table `sistema_seguridad`.`camera_config`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sistema_seguridad`.`camera_config` (
  `id` INT PRIMARY KEY,
  `resolution` VARCHAR(10) NOT NULL,
  `stream_quality` INT NOT NULL,
  `motion_detection` BOOLEAN NOT NULL,
  `esp32_cam_url` VARCHAR(255) NOT NULL
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
