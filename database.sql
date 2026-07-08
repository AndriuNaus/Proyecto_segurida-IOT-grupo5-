-- ==========================================
-- ESTRUCTURA Y DATOS DE LA BASE DE DATOS
-- PROYECTO SEGURIDAD IOT - GRUPO 5
-- ==========================================

-- 1. Crear Base de Datos si no existe
CREATE DATABASE IF NOT EXISTS iot_security_db;
USE iot_security_db;

-- 2. Crear Tabla de Usuarios
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user'
);

-- 3. Cargar Usuarios por Defecto (admin/admin123 y anyella/1234)
INSERT INTO users (username, password, role) 
VALUES ('admin', 'admin123', 'admin') 
ON DUPLICATE KEY UPDATE password='admin123', role='admin';

INSERT INTO users (username, password, role) 
VALUES ('anyella', '1234', 'admin') 
ON DUPLICATE KEY UPDATE password='1234', role='admin';

-- 4. Crear Tabla de Configuración de Cámara
CREATE TABLE IF NOT EXISTS camera_config (
  id INT PRIMARY KEY,
  resolution VARCHAR(10) NOT NULL,
  stream_quality INT NOT NULL,
  motion_detection BOOLEAN NOT NULL,
  esp32_cam_url VARCHAR(255) NOT NULL
);

-- 5. Cargar Configuración de Cámara Inicial
INSERT INTO camera_config (id, resolution, stream_quality, motion_detection, esp32_cam_url) 
VALUES (1, 'VGA', 30, FALSE, 'http://192.168.1.100:81/stream')
ON DUPLICATE KEY UPDATE id=1;

-- =========================================================
-- CONFIGURACIÓN DE ACCESOS Y USUARIOS (MARIADB SERVER)
-- Ejecutar como root si es necesario en el servidor destino:
-- =========================================================

-- CREATE USER IF NOT EXISTS 'iot_user'@'localhost' IDENTIFIED BY 'poner_aqui_tu_contraseña';
-- CREATE USER IF NOT EXISTS 'iot_user'@'%' IDENTIFIED BY 'poner_aqui_tu_contraseña';
-- GRANT ALL PRIVILEGES ON iot_security_db.* TO 'iot_user'@'localhost' WITH GRANT OPTION;
-- GRANT ALL PRIVILEGES ON iot_security_db.* TO 'iot_user'@'%' WITH GRANT OPTION;
-- FLUSH PRIVILEGES;
