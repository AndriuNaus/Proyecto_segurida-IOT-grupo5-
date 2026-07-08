import mariadb from 'mariadb';

const pool = mariadb.createPool({
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '3306'),
  user: process.env.DB_USER ?? 'iot_user',
  password: process.env.DB_PASSWORD ?? 'iot_password',
  database: process.env.DB_NAME ?? 'iot_security_db',
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
  console.log('Inicializando la base de datos MariaDB...');
  let conn;
  try {
    conn = await pool.getConnection();
    
    // Crear tabla de usuarios si no existe
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user'
      )
    `);

    // Insertar usuarios por defecto si no existen
    const usersCount = await conn.query('SELECT COUNT(*) as count FROM users');
    const countVal = Number(usersCount[0].count);
    if (countVal === 0) {
      console.log('Insertando usuarios por defecto en la base de datos...');
      await conn.query("INSERT INTO users (username, password, role) VALUES ('admin', 'admin123', 'admin')");
      await conn.query("INSERT INTO users (username, password, role) VALUES ('anyella', '1234', 'admin')");
    }

    // Crear tabla de configuración de cámara si no existe
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
      await conn.query("INSERT INTO camera_config (id, resolution, stream_quality, motion_detection, esp32_cam_url) VALUES (1, 'VGA', 30, false, ?)", [defaultUrl]);
    }

    console.log('¡Base de datos MariaDB inicializada correctamente!');
  } catch (err: any) {
    console.error('Error durante la inicialización de la base de datos:', err.message);
  } finally {
    if (conn) conn.release();
  }
}
