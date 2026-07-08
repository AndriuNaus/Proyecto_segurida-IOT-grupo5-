import mariadb from 'mariadb';

const pool = mariadb.createPool({
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '3306'),
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? 'root',
  database: process.env.DB_NAME ?? 'sistema_seguridad',
  connectionLimit: 5
});

export async function query(sql: string, params?: any[]) {
  let conn;
  try {
    conn = await pool.getConnection();
    const res = await conn.query(sql, params);
    return res;
  } catch (err) {
    console.error('Error de base de datos:', err);
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

export async function initializeDatabase() {
  console.log('Inicializando la base de datos MySQL/MariaDB para el sistema de seguridad...');
  let conn;
  try {
    conn = await pool.getConnection();
    
    // Crear tabla de usuarios (usuario) si no existe
    await conn.query(`
      CREATE TABLE IF NOT EXISTS usuario (
        id_usuario INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        telefono VARCHAR(20) NOT NULL UNIQUE,
        correo VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        rol ENUM('Cliente', 'Admin', 'Tecnico') NOT NULL DEFAULT 'Cliente',
        direccion VARCHAR(255) NOT NULL
      )
    `);

    // MIGRACIÓN ACTIVA: Verificar si falta la columna 'password' en la tabla existente 'usuario'
    const columnCheck = await conn.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'usuario' 
        AND COLUMN_NAME = 'password'
    `);

    if (columnCheck.length === 0) {
      console.log("Detectada tabla 'usuario' antigua sin columna 'password'. Agregando columna...");
      await conn.query("ALTER TABLE usuario ADD COLUMN password VARCHAR(255) NOT NULL DEFAULT '123456'");
      console.log("Columna 'password' agregada exitosamente.");
    }

    // Insertar usuarios por defecto si no existen
    const usersCount = await conn.query('SELECT COUNT(*) as count FROM usuario');
    const countVal = Number(usersCount[0].count);
    if (countVal === 0) {
      console.log('Insertando usuarios por defecto (admin, anyella) en la base de datos...');
      await conn.query(`
        INSERT INTO usuario (nombre, telefono, correo, password, rol, direccion) 
        VALUES ('Admin Principal', '999999999', 'admin', 'admin123', 'Admin', 'Oficina Central')
      `);
      await conn.query(`
        INSERT INTO usuario (nombre, telefono, correo, password, rol, direccion) 
        VALUES ('Anyela Carpio', '988888888', 'anyella', '1234', 'Admin', 'Calle Principal 123')
      `);
    }

    // Crear tabla de configuración de cámara (camera_config) si no existe
    await conn.query(`
      CREATE TABLE IF NOT EXISTS camera_config (
        id INT PRIMARY KEY,
        resolution VARCHAR(10) NOT NULL,
        stream_quality INT NOT NULL,
        motion_detection BOOLEAN NOT NULL,
        esp32_cam_url VARCHAR(255) NOT NULL
      )
    `);

    // Insertar configuración inicial de cámara si no existe
    const configCount = await conn.query('SELECT COUNT(*) as count FROM camera_config');
    const configCountVal = Number(configCount[0].count);
    if (configCountVal === 0) {
      console.log('Insertando configuración de cámara por defecto...');
      const defaultUrl = process.env.ESP32_CAM_URL ?? 'http://192.168.1.100:81/stream';
      await conn.query(`
        INSERT INTO camera_config (id, resolution, stream_quality, motion_detection, esp32_cam_url) 
        VALUES (1, 'VGA', 30, false, ?)
      `, [defaultUrl]);
    }

    console.log('¡Base de datos MySQL/MariaDB inicializada correctamente!');
  } catch (err: any) {
    console.error('Error durante la inicialización de la base de datos:', err.message);
  } finally {
    if (conn) conn.release();
  }
}
