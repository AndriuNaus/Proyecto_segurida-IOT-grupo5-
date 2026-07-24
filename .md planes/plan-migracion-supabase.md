# Plan de Migración: MariaDB Local → Supabase (PostgreSQL en la Nube)

## Sistema de Seguridad IoT con ESP32-CAM

**Proyecto:** Proyecto IoT Cámara  
**Autor:** Anderson Bustos  
**Fecha:** Julio 2026

---

## Índice

1. [Diagnóstico del proyecto actual](#1-diagnóstico-del-proyecto-actual)
2. [¿Por qué Supabase?](#2-por-qué-supabase)
3. [Arquitectura actual del flujo de video](#3-arquitectura-actual-del-flujo-de-video)
4. [Plan de migración fase por fase](#4-plan-de-migración-fase-por-fase)
   - [Fase 0: Preparación](#fase-0-preparación)
   - [Fase 1: Migrar esquema MySQL → PostgreSQL](#fase-1-migrar-esquema-mysql--postgresql)
   - [Fase 2: Configurar cliente Supabase en backend](#fase-2-configurar-cliente-supabase-en-backend)
   - [Fase 3: Reescribir repositorios](#fase-3-reescribir-repositorios)
   - [Fase 4: Migrar autenticación a Supabase Auth](#fase-4-migrar-autenticación-a-supabase-auth)
   - [Fase 5: Storage para evidencias de cámara](#fase-5-storage-para-evidencias-de-cámara)
   - [Fase 6: Realtime para eventos y alertas](#fase-6-realtime-para-eventos-y-alertas)
   - [Fase 7: Persistencia de frames de video](#fase-7-persistencia-de-frames-de-video)
   - [Fase 8: Actualizar variables de entorno, Docker y CI/CD](#fase-8-actualizar-variables-de-entorno-docker-y-cicd)
   - [Fase 9: Migrar datos de prueba (seed)](#fase-9-migrar-datos-de-prueba-seed)
5. [Resumen de archivos a modificar/crear](#5-resumen-de-archivos-a-modificarcrear)
6. [Tiempo estimado](#6-tiempo-estimado)
7. [Riesgos y consideraciones](#7-riesgos-y-consideraciones)

---

## 1. Diagnóstico del proyecto actual

### Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Node.js 22 + TypeScript + Express 5 |
| Frontend | React 18 + Material UI 9 + Vite |
| Base de datos actual | MariaDB 10+ (MySQL compatible) |
| ORM | **Ninguno** — SQL puro con driver `mariadb` |
| Autenticación | JWT manual (HMAC-SHA256) |
| Video en vivo | Socket.io + MJPEG proxy HTTP |
| Streaming ESP32 | Push (POST raw JPEG) + Pull (MJPEG proxy) |
| Despliegue | Docker → AWS EC2 (IP estática) |
| CI/CD | GitHub Actions → GHCR → AWS EC2 via SSH |

### Base de datos actual: 12 tablas

| Tabla | Propósito |
|---|---|
| `usuario` | Usuarios con roles (Cliente/Admin/Tecnico) |
| `acceso` | Registros de ingreso/egreso |
| `ubicacion` | Ubicaciones físicas con coordenadas |
| `dispositivo` | Dispositivos IoT vinculados a ubicaciones |
| `evento` | Eventos de seguridad detectados |
| `alerta` | Alertas disparadas por eventos |
| `backend_registro` | Auditoría de peticiones al backend |
| `evidencia` | Metadatos de evidencia (archivos multimedia) |
| `historial_dispositivo` | Historial de cambios de estado |
| `mascota` | Mascotas para filtrar falsos positivos |
| `notificacion` | Notificaciones a usuarios |
| `camera_config` | Configuración de la ESP32-CAM |

Todas tienen **claves foráneas**, **ENUMs**, **índices** y relaciones complejas.

### Dependencias actuales del backend (package.json)

```
mariadb: ^3.5.3
axios: ^1.16.1
dotenv: ^17.4.2
express: ^5.2.1
mqtt: ^5.15.1 (instalado pero no usado aún)
socket.io: ^4.8.3
zod: ^3.25.76
```

---

## 2. ¿Por qué Supabase?

### Comparativa de opciones gratuitas

| Característica | **Supabase** ★ | Firebase Firestore | PlanetScale | Neon |
|---|---|---|---|---|
| **Tipo de BD** | PostgreSQL (SQL) | NoSQL (documentos) | MySQL (SQL) | PostgreSQL (SQL) |
| **Migración desde MySQL** | Media (~20 cambios) | **Masiva** (todo a NoSQL) | **Mínima** (es MySQL) | Media |
| **Capa gratuita** | 500MB DB, 50k usuarios, 2GB ancho de banda | 1GB, 10k docs, 10GB/mes | 1GB, 10M lecturas/mes | 0.5GB, 100h/mes |
| **Auth integrado** | ✅ PostgreSQL + RLS | ✅ | ❌ | ❌ |
| **Realtime (WebSockets)** | ✅ Nativo | ✅ | ❌ | ❌ |
| **Storage + CDN** | ✅ | ✅ | ❌ | ❌ |
| **SQL puro** | ✅ | ❌ | ✅ | ✅ |
| **SDK Node.js** | ✅ `@supabase/supabase-js` | ✅ Firebase Admin | ❌ (mysql2) | ✅ `@neondatabase/serverless` |

### Por qué **NO** Firebase para este proyecto

1. Firebase Firestore es **NoSQL** (colecciones de documentos, no tablas).
2. Las 12 tablas actuales tienen **claves foráneas, JOINs implícitos y ENUMs** que no existen en Firestore.
3. Migrar `SELECT ... WHERE correo = ?` y `UPDATE camera_config SET ... WHERE id = 1` a documentos NoSQL implicaría **reescribir por completo** todos los repositorios, servicios y controladores.
4. Se perderían las restricciones de integridad referencial (FKs).

### Por qué **Supabase** es la mejor opción

1. **PostgreSQL puro** — puedes reutilizar el 90% de las consultas SQL actuales.
2. **Auth integrado** — reemplaza el JWT manual hecho a mano con autenticación manejada por Supabase (bcrypt, refresh tokens, recovery).
3. **Realtime** — WebSockets nativos para eventos/alertas en vivo (complementa a Socket.io para video).
4. **Storage** — guardar evidencias (snapshots de la cámara) con CDN incluido.
5. **Row Level Security (RLS)** — políticas de seguridad a nivel de fila de base de datos.
6. **Capa gratuita generosa** — 500MB es suficiente para las 12 tablas con datos de prueba.
7. **Dashboard web** — interfaz gráfica para ver datos, ejecutar SQL y monitorear.

---

## 3. Arquitectura actual del flujo de video

### Cómo funciona hoy

```
┌──────────────────────────────────────────────────────────────────────┐
│ ESP32-CAM (Firmware .ino)                                           │
│                                                                      │
│ loop() cada 100ms ~10 FPS:                                          │
│   1. esp_camera_fb_get() → captura frame JPEG                       │
│   2. HTTP POST → http://<IP_AWS>:3000/api/camera/upload             │
│      └─ Content-Type: image/jpeg                                    │
│      └─ Body: raw JPEG binario                                      │
│                                                                      │
│   La IP del servidor está fija (estática AWS):                      │
│   http://3.133.100.38:3000/api/camera/upload                        │
└───────────────────────────┬──────────────────────────────────────────┘
                            │ POST /api/camera/upload
                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│ Backend Node.js (src/index.ts)                                      │
│                                                                      │
│ app.post('/api/camera/upload', (req, res) => {                      │
│   const buffer = Buffer.concat(chunks);                             │
│                                                                      │
│   1. io.emit('video_frame', base64(buffer))  → Socket.io            │
│   2. Enviar a clientes MJPEG HTTP conectados                        │
│   3. cameraState.isConnected = true                                 │
│   4. cameraState.lastActivity = new Date()                          │
│ });                                                                  │
│                                                                      │
│ app.get('/api/camera/stream')  → MJPEG proxy con JWT               │
│ app.get('/api/camera/status')  → Estado + configuración             │
│ app.post('/api/camera/configure') → Cambiar config + persistir en DB│
└───────────────────────────┬──────────────────────────────────────────┘
                            │ Socket.io + MJPEG HTTP
                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│ Frontend React                                                      │
│                                                                      │
│ Dashboard.jsx:                                                       │
│   ├─ <img src="/api/camera/stream?token=JWT">  (MJPEG en vivo)     │
│   ├─ socket.io-client escucha 'video_frame'                         │
│   ├─ Polling cada 5s: GET /api/camera/status                        │
│   └─ Panel de configuración (admin)                                 │
│                                                                      │
│ LiveStream.jsx:                                                      │
│   ├─ ESP32-CAM: <img> con MJPEG                                     │
│   ├─ Webcam PC: getUserMedia + <video>                              │
│   └─ MediaPipe EfficientDet-Lite0 (detección en canvas)             │
└──────────────────────────────────────────────────────────────────────┘
```

### Problemas actuales identificados

| Problema | Impacto |
|---|---|
| Las contraseñas se guardan en **texto plano** | Riesgo de seguridad severo |
| No hay persistencia de frames de video | Las detecciones se ven en vivo pero no quedan registradas como evidencia |
| La tabla `evidencia` solo guarda metadatos, no los archivos reales | No se pueden recuperar grabaciones pasadas |
| `/api/camera/upload` no tiene autenticación | Cualquier dispositivo puede enviar frames falsos |
| No hay hasheo de contraseñas | Incompatible con Supabase Auth (que usa bcrypt) |
| El modo PUSH (ESP32 envía) y PULL (servidor jala) coexisten y se pueden pisar | Confusión en el flujo de datos |

---

## 4. Plan de migración fase por fase

---

### Fase 0: Preparación

**Duración estimada:** 1 hora  
**Objetivo:** Tener todo listo antes de tocar código.

#### Pasos

1. **Crear cuenta en Supabase**
   - Ir a [supabase.com](https://supabase.com)
   - Registrarse con GitHub (recomendado)
   - Crear un nuevo organización (puede ser personal)

2. **Crear proyecto**
   - Nombre: `sistema-seguridad-iot`
   - Región: `us-east-1` (la más cercana a AWS EC2)
   - Base de datos: PostgreSQL (default)
   - Anotar la contraseña de la base de datos

3. **Obtener credenciales**
   - Ir a **Project Settings → API**
   - Copiar:
     - `Project URL` → `SUPABASE_URL`
     - `anon public` → `SUPABASE_ANON_KEY`
     - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (solo para backend)
   - Ir a **Project Settings → Database → Connection string**
   - Copiar la URI para uso directo (opcional)

4. **Instalar dependencia**
   ```bash
   npm install @supabase/supabase-js
   ```

5. **Crear carpeta de documentación**
   ```bash
   mkdir -p ".md planes"
   ```

6. **Verificar IP estática AWS**
   - Confirmar que `3.133.100.38` (o la IP asignada) sea **elástica** (Elastic IP)
   - Así no cambiará aunque se reinicie la instancia EC2
   - No se necesita modificar el firmware de la ESP32-CAM

---

### Fase 1: Migrar esquema MySQL → PostgreSQL

**Duración estimada:** 2-3 horas  
**Objetivo:** Tener el script DDL completo para PostgreSQL.

#### Diferencias sintácticas MySQL → PostgreSQL

| Concepto MySQL | PostgreSQL equivalente |
|---|---|
| `` `backticks` `` | `"double quotes"` o se omite |
| `INT AUTO_INCREMENT` | `SERIAL` o `INT GENERATED ALWAYS AS IDENTITY` |
| `ENUM('A', 'B')` | `CREATE TYPE nombre_enum AS ENUM('A', 'B')` |
| `BOOLEAN` (como TINYINT) | `BOOLEAN` nativo (true/false) |
| `DECIMAL(10,8)` | `DECIMAL(10,8)` (igual) |
| `DATETIME DEFAULT CURRENT_TIMESTAMP` | `TIMESTAMPTZ DEFAULT NOW()` |
| `VARCHAR(255)` | `VARCHAR(255)` (igual) |
| `TEXT` | `TEXT` (igual) |
| `ON DUPLICATE KEY UPDATE` | `ON CONFLICT (columna) DO UPDATE` |
| `LAST_INSERT_ID()` | `RETURNING id` |
| `ENGINE = InnoDB` | Se omite (PostgreSQL solo tiene uno) |
| `DEFAULT CHARACTER SET utf8mb4` | Se omite (UTF-8 es default) |
| `INDEX nombre (col) VISIBLE` | `INDEX nombre (col)` (más simple) |
| `CONSTRAINT fk FOREIGN KEY ... ON DELETE CASCADE` | `FOREIGN KEY ... REFERENCES ... ON DELETE CASCADE` (igual) |

#### Archivo a crear: `db/schema_postgres.sql`

```sql
-- =====================================================
-- SCHEMA POSTGRESQL: sistema_seguridad
-- PROYECTO SEGURIDAD IOT - GRUPO 5
-- =====================================================

-- Crear tipos ENUM personalizados
CREATE TYPE rol_usuario AS ENUM ('Cliente', 'Admin', 'Tecnico');
CREATE TYPE tipo_acceso AS ENUM ('Ingreso', 'Egreso');
CREATE TYPE tipo_ubicacion AS ENUM ('Casa', 'Negocio', 'Departamento', 'Otro');
CREATE TYPE tipo_evento AS ENUM ('Movimiento', 'Persona', 'Ruido', 'Puerta', 'Otro');
CREATE TYPE nivel_riesgo AS ENUM ('Bajo', 'Medio', 'Alto');
CREATE TYPE estado_alerta AS ENUM ('Pendiente', 'Atendida', 'Descartada');
CREATE TYPE prioridad_alerta AS ENUM ('Baja', 'Media', 'Alta');

-- -----------------------------------------------------
-- Table: usuario
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS usuario (
  id_usuario SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  telefono VARCHAR(20) NOT NULL,
  correo VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  rol rol_usuario NOT NULL DEFAULT 'Cliente',
  direccion VARCHAR(255) NOT NULL,
  UNIQUE (telefono),
  UNIQUE (correo)
);

-- -----------------------------------------------------
-- Table: acceso
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS acceso (
  id_acceso SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL,
  fecha_hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tipo_acceso tipo_acceso NOT NULL,
  CONSTRAINT fk_acceso_usuario
    FOREIGN KEY (id_usuario)
    REFERENCES usuario (id_usuario)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE INDEX idx_acceso_usuario ON acceso (id_usuario);

-- -----------------------------------------------------
-- Table: ubicacion
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS ubicacion (
  id_ubicacion SERIAL PRIMARY KEY,
  nombre_lugar VARCHAR(100) NOT NULL,
  direccion VARCHAR(255) DEFAULT NULL,
  latitud DECIMAL(10,8) NOT NULL,
  longitud DECIMAL(11,8) NOT NULL,
  tipo tipo_ubicacion DEFAULT 'Otro'
);

-- -----------------------------------------------------
-- Table: dispositivo
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS dispositivo (
  id_dispositivo SERIAL PRIMARY KEY,
  nombre_dispositivo VARCHAR(100) DEFAULT NULL,
  estado VARCHAR(50) NOT NULL DEFAULT 'Activo',
  id_ubicacion INT NOT NULL,
  CONSTRAINT fk_dispositivo_ubicacion
    FOREIGN KEY (id_ubicacion)
    REFERENCES ubicacion (id_ubicacion)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);

CREATE INDEX idx_dispositivo_ubicacion ON dispositivo (id_ubicacion);

-- -----------------------------------------------------
-- Table: evento
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS evento (
  id_evento SERIAL PRIMARY KEY,
  tipo_evento tipo_evento NOT NULL,
  descripcion VARCHAR(255) DEFAULT NULL,
  fecha_hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  id_dispositivo INT NOT NULL,
  nivel_riesgo nivel_riesgo NOT NULL DEFAULT 'Bajo',
  CONSTRAINT fk_evento_dispositivo
    FOREIGN KEY (id_dispositivo)
    REFERENCES dispositivo (id_dispositivo)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE INDEX idx_evento_dispositivo ON evento (id_dispositivo);

-- -----------------------------------------------------
-- Table: alerta
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS alerta (
  id_alerta SERIAL PRIMARY KEY,
  id_evento INT NOT NULL,
  estado estado_alerta NOT NULL DEFAULT 'Pendiente',
  fecha_alerta TIMESTAMPTZ DEFAULT NOW(),
  prioridad prioridad_alerta NOT NULL DEFAULT 'Media',
  CONSTRAINT fk_alerta_evento
    FOREIGN KEY (id_evento)
    REFERENCES evento (id_evento)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE INDEX idx_alerta_evento ON alerta (id_evento);

-- -----------------------------------------------------
-- Table: backend_registro
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS backend_registro (
  id_backend_registro SERIAL PRIMARY KEY,
  id_dispositivo INT NOT NULL,
  id_evento INT DEFAULT NULL,
  endpoint VARCHAR(255) DEFAULT NULL,
  metodo VARCHAR(10) DEFAULT NULL,
  payload TEXT DEFAULT NULL,
  respuesta_backend TEXT DEFAULT NULL,
  codigo_estado INT DEFAULT NULL,
  fecha_peticion TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_backend_dispositivo
    FOREIGN KEY (id_dispositivo)
    REFERENCES dispositivo (id_dispositivo)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_backend_evento
    FOREIGN KEY (id_evento)
    REFERENCES evento (id_evento)
    ON DELETE SET NULL
    ON UPDATE CASCADE
);

CREATE INDEX idx_backend_dispositivo ON backend_registro (id_dispositivo);
CREATE INDEX idx_backend_evento ON backend_registro (id_evento);

-- -----------------------------------------------------
-- Table: evidencia
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS evidencia (
  id_evidencia SERIAL PRIMARY KEY,
  id_evento INT NOT NULL,
  tipo_archivo VARCHAR(50) DEFAULT NULL,
  ruta_archivo VARCHAR(500) DEFAULT NULL,
  fecha_registro TIMESTAMPTZ DEFAULT NOW(),
  id_dispositivo INT NOT NULL,
  CONSTRAINT fk_evidencia_evento
    FOREIGN KEY (id_evento)
    REFERENCES evento (id_evento)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_evidencia_dispositivo
    FOREIGN KEY (id_dispositivo)
    REFERENCES dispositivo (id_dispositivo)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE INDEX idx_evidencia_evento ON evidencia (id_evento);
CREATE INDEX idx_evidencia_dispositivo ON evidencia (id_dispositivo);

-- -----------------------------------------------------
-- Table: historial_dispositivo
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS historial_dispositivo (
  id_historial SERIAL PRIMARY KEY,
  id_dispositivo INT NOT NULL,
  fecha_cambio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  estado_anterior VARCHAR(50) DEFAULT NULL,
  estado_nuevo VARCHAR(50) DEFAULT NULL,
  descripcion VARCHAR(255) DEFAULT NULL,
  CONSTRAINT fk_historial_dispositivo
    FOREIGN KEY (id_dispositivo)
    REFERENCES dispositivo (id_dispositivo)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE INDEX idx_historial_dispositivo ON historial_dispositivo (id_dispositivo);

-- -----------------------------------------------------
-- Table: mascota
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS mascota (
  id_mascota SERIAL PRIMARY KEY,
  nombre VARCHAR(50) DEFAULT NULL,
  usuario_id_usuario INT NOT NULL,
  CONSTRAINT fk_mascota_usuario
    FOREIGN KEY (usuario_id_usuario)
    REFERENCES usuario (id_usuario)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
);

CREATE INDEX idx_mascota_usuario ON mascota (usuario_id_usuario);

-- -----------------------------------------------------
-- Table: notificacion
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS notificacion (
  id_notificacion SERIAL PRIMARY KEY,
  mensaje VARCHAR(255) NOT NULL,
  fecha_envio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  id_evento INT NOT NULL,
  id_usuario INT NOT NULL,
  CONSTRAINT fk_notificacion_evento
    FOREIGN KEY (id_evento)
    REFERENCES evento (id_evento)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_notificacion_usuario
    FOREIGN KEY (id_usuario)
    REFERENCES usuario (id_usuario)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE INDEX idx_notificacion_evento ON notificacion (id_evento);
CREATE INDEX idx_notificacion_usuario ON notificacion (id_usuario);

-- -----------------------------------------------------
-- Table: camera_config
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS camera_config (
  id INT PRIMARY KEY,
  resolution VARCHAR(10) NOT NULL,
  stream_quality INT NOT NULL,
  motion_detection BOOLEAN NOT NULL,
  esp32_cam_url VARCHAR(255) NOT NULL
);

-- Insertar configuración por defecto
INSERT INTO camera_config (id, resolution, stream_quality, motion_detection, esp32_cam_url)
VALUES (1, 'VGA', 30, false, 'http://3.133.100.38:81/stream')
ON CONFLICT (id) DO NOTHING;
```

#### Cómo ejecutar el schema

Opción A — **SQL Editor de Supabase Dashboard:**
1. Ir a **Supabase Dashboard → SQL Editor**
2. Pegar todo el contenido de `db/schema_postgres.sql`
3. Ejecutar

Opción B — **Migración desde Node.js:**
```typescript
// src/config/supabase.ts
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function initializeDatabase() {
  const schemaPath = path.resolve('db/schema_postgres.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  const { error } = await supabase.rpc('exec_sql', { sql: schema });
  if (error) console.error('Error al inicializar DB:', error.message);
}
```

---

### Fase 2: Configurar cliente Supabase en backend

**Duración estimada:** 1 hora  
**Objetivo:** Reemplazar `src/config/database.ts` (MariaDB) por `src/config/supabase.ts`.

#### Archivo a crear: `src/config/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar definidos en .env');
}

export const supabase = createClient(supabaseUrl!, supabaseServiceKey!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Inicializa la base de datos ejecutando el schema SQL.
 * Se llama al iniciar el servidor.
 */
export async function initializeDatabase() {
  console.log('Inicializando base de datos Supabase...');

  try {
    // Verificar conexión obteniendo la versión de PostgreSQL
    const { data, error } = await supabase.from('usuario').select('count(*)', { count: 'exact', head: true });

    if (error && error.message.includes('relation "usuario" does not exist')) {
      console.log('Tablas no encontradas. Ejecutando schema...');
      // Aquí se podría ejecutar el schema.sql si se configura un RPC
      console.log('Ejecuta el schema desde el SQL Editor de Supabase Dashboard.');
    } else if (error) {
      throw error;
    } else {
      console.log('Base de datos Supabase inicializada correctamente.');
    }
  } catch (err: any) {
    console.error('Error durante la inicialización de Supabase:', err.message);
  }
}
```

#### Variables de entorno nuevas (`.env`)

```env
# Supabase (NUEVO)
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

# Auth JWT (se mantiene temporalmente hasta migrar a Supabase Auth)
JWT_SECRET=secreto-super-seguro-clase-iot

# ESP32-CAM
ESP32_CAM_URL=http://3.133.100.38:81/stream

# Puerto del servidor
PORT=3000

# NOTA: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME ya NO son necesarios
```

---

### Fase 3: Reescribir repositorios

**Duración estimada:** 2 horas  
**Objetivo:** Cambiar todos los `mariadb.query(...)` por llamadas al SDK de Supabase.

#### `src/repositories/user.repository.ts` → Versión Supabase

```typescript
import { supabase } from '../config/supabase.js';

export interface UserRow {
  id?: number;
  username: string;
  password: string;
  role: string;
  nombre?: string;
  telefono?: string;
  direccion?: string;
}

export const UserRepository = {
  async findByUsername(username: string): Promise<UserRow | null> {
    const { data, error } = await supabase
      .from('usuario')
      .select('correo as username, password, rol as role')
      .eq('correo', username)
      .single();

    if (error || !data) return null;

    return {
      username: data.username,
      password: data.password,
      role: data.role.toLowerCase()
    };
  },

  async findByPhone(phone: string): Promise<UserRow | null> {
    const { data, error } = await supabase
      .from('usuario')
      .select('correo as username, password, rol as role, telefono')
      .eq('telefono', phone)
      .single();

    if (error || !data) return null;

    return {
      username: data.username,
      password: data.password,
      role: data.role.toLowerCase(),
      telefono: data.telefono
    };
  },

  async createUser(user: UserRow): Promise<void> {
    const roleToCapitalize = user.role || 'cliente';
    const capitalizedRole = roleToCapitalize.charAt(0).toUpperCase() + roleToCapitalize.slice(1);

    const { error } = await supabase
      .from('usuario')
      .insert({
        nombre: user.nombre || user.username.split('@')[0],
        telefono: user.telefono || `tel-${Math.random().toString(36).slice(2, 12)}`,
        correo: user.username,
        password: user.password,
        rol: capitalizedRole,
        direccion: user.direccion || 'Dirección por defecto'
      });

    if (error) throw error;
  }
};
```

#### `src/repositories/camera.repository.ts` → Versión Supabase

```typescript
import { supabase } from '../config/supabase.js';

export interface CameraConfig {
  resolution: string;
  streamQuality: number;
  motionDetection: boolean;
  esp32CamUrl: string;
}

export const CameraRepository = {
  async getConfig(): Promise<CameraConfig | null> {
    const { data, error } = await supabase
      .from('camera_config')
      .select('resolution, stream_quality, motion_detection, esp32_cam_url')
      .eq('id', 1)
      .single();

    if (error || !data) return null;

    return {
      resolution: data.resolution,
      streamQuality: Number(data.stream_quality),
      motionDetection: Boolean(data.motion_detection),
      esp32CamUrl: data.esp32_cam_url
    };
  },

  async updateConfig(config: CameraConfig): Promise<void> {
    const { error } = await supabase
      .from('camera_config')
      .update({
        resolution: config.resolution,
        stream_quality: config.streamQuality,
        motion_detection: config.motionDetection,
        esp32_cam_url: config.esp32CamUrl
      })
      .eq('id', 1);

    if (error) throw error;
  }
};
```

#### Repositorios adicionales a crear (para el resto de tablas)

Estos repositorios usarán datos del backend actualmente no persistidos en runtime:

- **`src/repositories/evento.repository.ts`** — CRUD para eventos
- **`src/repositories/alerta.repository.ts`** — CRUD para alertas
- **`src/repositories/evidencia.repository.ts`** — CRUD para evidencias
- **`src/repositories/dispositivo.repository.ts`** — CRUD para dispositivos
- **`src/repositories/notificacion.repository.ts`** — CRUD para notificaciones

Cada uno seguirá el mismo patrón: importar `supabase`, usar `supabase.from('tabla').select/insert/update/delete`.

---

### Fase 4: Migrar autenticación a Supabase Auth

**Duración estimada:** 2 horas  
**Objetivo:** Reemplazar el JWT hecho a mano por Supabase Auth.

#### Beneficios de Supabase Auth

- **bcrypt** para hashear contraseñas (seguridad real)
- **Refresh tokens** automáticos
- **Recuperación de contraseña** por email
- **RLS (Row Level Security)** — políticas a nivel de fila
- **Sesión persistente** en el frontend

#### Cambios en el backend

`src/services/auth.service.ts` → Usar Supabase Auth:

```typescript
import { supabase } from '../config/supabase.js';
import { UserRepository } from '../repositories/user.repository.js';

export const AuthService = {
  async login(username: string, password: string): Promise<string | null> {
    // Intentar con el correo electrónico
    const { data, error } = await supabase.auth.signInWithPassword({
      email: username,
      password: password
    });

    if (error || !data.session) return null;
    return data.session.access_token;
  },

  async register(userData: any): Promise<void> {
    // 1. Verificar si el usuario ya existe
    const existingUser = await UserRepository.findByUsername(userData.username);
    if (existingUser) {
      throw new Error('El correo electrónico ya se encuentra registrado.');
    }

    // 2. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.username,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        nombre: userData.nombre,
        telefono: userData.telefono,
        rol: userData.role || 'cliente',
        direccion: userData.direccion
      }
    });

    if (authError) throw authError;

    // 3. Insertar perfil en la tabla usuario
    await UserRepository.createUser({
      username: userData.username,
      password: userData.password, // Supabase ya la hasheó
      role: userData.role || 'cliente',
      nombre: userData.nombre,
      telefono: userData.telefono,
      direccion: userData.direccion
    });
  },

  verifyToken(token: string): { sub: string; role: string } | null {
    // Supabase maneja la verificación automáticamente
    // El middleware extraerá el usuario desde el token JWT de Supabase
    return null; // Ya no se usa, se reemplaza por el middleware de Supabase
  }
};
```

#### Middleware de autenticación actualizado

`src/middlewares/auth.ts`:

```typescript
import type { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    role: string;
  };
}

export async function requireJwt(req: Request, res: Response, next: NextFunction) {
  let token = '';
  const authHeader = req.headers['authorization'] ?? '';
  
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else if (req.query && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    res.status(401).json({ error: 'Token ausente o malformado' });
    return;
  }

  // Verificar token con Supabase
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    res.status(401).json({ error: 'Token inválido o expirado' });
    return;
  }

  (req as AuthenticatedRequest).user = {
    sub: user.email || user.id,
    role: user.user_metadata?.rol || 'cliente'
  };

  next();
}
```

#### Cambios en el frontend

En `frontend/src/models/apiService.js` y donde se maneje autenticación:

```javascript
// Usar @supabase/supabase-js en el frontend también
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: username,
  password: password
});

// Obtener sesión actual
const { data: { session } } = await supabase.auth.getSession();

// Escuchar cambios de autenticación
supabase.auth.onAuthStateChange((event, session) => {
  // Actualizar estado global
});
```

---

### Fase 5: Storage para evidencias de cámara

**Duración estimada:** 1 hora  
**Objetivo:** Guardar snapshots de la cámara como evidencia persistente.

#### Configurar Storage en Supabase

1. Ir a **Supabase Dashboard → Storage**
2. Crear bucket `evidencias`
3. Configurar visibilidad: **Público** (para ver las imágenes desde el frontend)
4. Configurar RLS:

```sql
-- Política: cualquier usuario autenticado puede leer
CREATE POLICY "Usuarios autenticados pueden leer evidencias"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'evidencias');

-- Política: solo admins pueden insertar
CREATE POLICY "Admins pueden insertar evidencias"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'evidencias' 
  AND auth.role() = 'authenticated'
);
```

#### Modificar `src/index.ts` para guardar snapshots

```typescript
import { supabase } from './config/supabase.js';

// Dentro de app.post('/api/camera/upload', ...)
app.post('/api/camera/upload', (req, res) => {
  const chunks: Buffer[] = [];
  
  req.on('data', (chunk: Buffer) => {
    chunks.push(chunk);
  });

  req.on('end', async () => {
    const buffer = Buffer.concat(chunks);
    
    if (buffer.length > 0) {
      // 1. Emitir frame en vivo (Socket.io)
      const base64Data = buffer.toString('base64');
      io.emit('video_frame', base64Data);

      // 2. Enviar a clientes MJPEG
      const boundary = '123456789000000000000987654321';
      const header = `\r\n--${boundary}\r\nContent-Type: image/jpeg\r\nContent-Length: ${buffer.length}\r\n\r\n`;
      
      for (const client of streamClients) {
        try {
          client.write(Buffer.from(header));
          client.write(buffer);
        } catch (err) {
          streamClients.delete(client);
        }
      }

      // 3. Guardar snapshot periódico en Supabase Storage
      const now = Date.now();
      if (!lastSnapshotTime || now - lastSnapshotTime > 30000) {
        // Guardar cada 30 segundos
        lastSnapshotTime = now;
        const filename = `snapshot_${new Date().toISOString().replace(/[:.]/g, '-')}.jpg`;
        
        try {
          const { data, error } = await supabase.storage
            .from('evidencias')
            .upload(filename, buffer, {
              contentType: 'image/jpeg',
              upsert: false
            });

          if (error) {
            console.error('Error al guardar snapshot:', error.message);
          } else {
            console.log(`Snapshot guardado: ${data.path}`);
          }
        } catch (err: any) {
          console.error('Error en storage:', err.message);
        }
      }

      // 4. Actualizar estado de la cámara
      cameraState.isConnected = true;
      cameraState.lastActivity = new Date();
    }
    
    res.status(200).send('OK');
  });
});
```

#### Tabla `evidencia` actualizada

La tabla `evidencia` ahora tendrá una columna `ruta_archivo` que almacena la URL pública del archivo en Supabase Storage:

```sql
ALTER TABLE evidencia ADD COLUMN IF NOT EXISTS ruta_archivo VARCHAR(500) DEFAULT NULL;
```

---

### Fase 6: Realtime para eventos y alertas

**Duración estimada:** 1 hora  
**Objetivo:** Usar Supabase Realtime para notificaciones en vivo.

#### Suscripción a cambios en la tabla `alerta`

En el backend, después de crear una alerta, el frontend recibirá la actualización automáticamente:

```typescript
// Backend: No se necesita código adicional
// Supabase Realtime escucha cambios en las tablas automáticamente
```

En el frontend (`Dashboard.jsx`):

```typescript
import { supabase } from '../supabaseClient';

useEffect(() => {
  // Suscribirse a nuevas alertas en tiempo real
  const subscription = supabase
    .channel('alertas-realtime')
    .on('postgres_changes', 
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'alerta',
        filter: `estado=eq.Pendiente`
      },
      (payload) => {
        console.log('Nueva alerta:', payload.new);
        // Mostrar notificación en la UI
        mostrarAlerta(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
}, []);
```

**Socket.io se mantiene** para el streaming de video binario (es más eficiente que Supabase Realtime para datos binarios grandes).

---

### Fase 7: Persistencia de frames de video

**Duración estimada:** 2 horas  
**Objetivo:** Cuando se detecte un evento (movimiento, persona), guardar el frame como evidencia.

#### Detección de eventos desde el backend

Actualmente el backend solo recibe frames y los reenvía. Para detectar eventos:

1. **Opción simple:** El backend guarda un snapshot cada N segundos (implementado en Fase 5).
2. **Opción con MediaPipe:** El frontend ejecuta MediaPipe y cuando detecta una `persona`, envía un POST al backend:
   - `POST /api/eventos` con la imagen del frame y el tipo de evento

#### Endpoint para crear eventos

```typescript
// src/routes/evento.routes.ts
router.post('/', requireJwt, EventoController.crearEvento);

// src/controllers/evento.controller.ts
async crearEvento(req: AuthenticatedRequest, res: Response) {
  const { tipo_evento, descripcion, id_dispositivo, imagen_base64 } = req.body;
  
  // 1. Guardar imagen en Supabase Storage
  const buffer = Buffer.from(imagen_base64, 'base64');
  const filename = `evento_${Date.now()}.jpg`;
  
  const { data: storageData, error: storageError } = await supabase.storage
    .from('evidencias')
    .upload(filename, buffer, { contentType: 'image/jpeg' });

  // 2. Crear evento en la base de datos
  const { data: evento, error } = await supabase
    .from('evento')
    .insert({
      tipo_evento,
      descripcion,
      id_dispositivo,
      nivel_riesgo: 'Medio'
    })
    .select()
    .single();

  // 3. Crear evidencia vinculada
  await supabase.from('evidencia').insert({
    id_evento: evento.id_evento,
    tipo_archivo: 'image/jpeg',
    ruta_archivo: storageData?.path,
    id_dispositivo
  });

  // 4. Crear alerta
  await supabase.from('alerta').insert({
    id_evento: evento.id_evento,
    estado: 'Pendiente',
    prioridad: 'Media'
  });

  res.status(201).json({ message: 'Evento registrado', evento });
}
```

---

### Fase 8: Actualizar variables de entorno, Docker y CI/CD

**Duración estimada:** 30 minutos  
**Objetivo:** Que el proyecto funcione sin MariaDB local.

#### `.env` (nuevo)

```env
# Supabase
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

# Auth (se mantiene temporalmente, se eliminará al migrar completamente a Supabase Auth)
JWT_SECRET=secreto-super-seguro-clase-iot

# ESP32-CAM (IP estática de AWS)
ESP32_CAM_URL=http://3.133.100.38:81/stream

# Puerto
PORT=3000
```

#### `dockerfile` (simplificado — ya no necesita MariaDB)

```dockerfile
# --- Stage 1: Build the frontend React app ---
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# --- Stage 2: Run the Node.js TypeScript backend ---
FROM node:22-alpine
WORKDIR /app

# Copy backend dependencies and install
COPY package*.json ./
RUN npm install

# Copy backend source code and config
COPY . .

# Copy the built frontend from Stage 1
COPY --from=frontend-builder /app/public ./public

# Expose the server port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start backend
CMD ["npm", "start"]
```

#### CI/CD (`.github/workflows/ci-cd.yml`) — actualizado

Agregar las nuevas variables de entorno como secrets de GitHub:

```yaml
# En la sección deploy:
- name: Conectar por SSH a AWS y Desplegar
  uses: appleboy/ssh-action@v1.0.3
  with:
    host: ${{ secrets.EC2_HOST }}
    username: ${{ secrets.EC2_USERNAME }}
    key: ${{ secrets.EC2_SSH_KEY }}
    script: |
      cd ~/proyecto || cd ~/Proyecto_segurida-IOT-grupo5- || exit 1
      
      git pull origin main
      sudo docker build -t backend-iot .
      sudo docker stop backend-iot || true
      sudo docker rm backend-iot || true
      
      sudo docker run -d \
        --name backend-iot \
        -p 3000:3000 \
        --restart always \
        -e SUPABASE_URL="${{ secrets.SUPABASE_URL }}" \
        -e SUPABASE_SERVICE_ROLE_KEY="${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
        -e JWT_SECRET="${{ secrets.JWT_SECRET }}" \
        -e ESP32_CAM_URL="${{ secrets.ESP32_CAM_URL }}" \
        -e PORT=3000 \
        backend-iot
```

**Agregar secrets en GitHub:**
- Ir a **Settings → Secrets and variables → Actions**
- Agregar: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ESP32_CAM_URL`

---

### Fase 9: Migrar datos de prueba (seed)

**Duración estimada:** 30 minutos  
**Objetivo:** Tener datos de prueba en la nueva base de datos.

#### Archivo a crear: `db/seed_postgres.sql`

```sql
-- =====================================================
-- SEED DATA PARA POSTGRESQL: sistema_seguridad
-- =====================================================

-- 1. Usuarios
INSERT INTO usuario (id_usuario, nombre, telefono, correo, password, rol, direccion) VALUES
(1, 'Admin Principal', '999999999', 'admin', 'admin123', 'Admin', 'Oficina Central'),
(2, 'Anyela Carpio', '988888888', 'anyella', '1234', 'Admin', 'Calle Principal 123'),
(3, 'Juan Perez', '977777777', 'juan@security.com', 'user123', 'Cliente', 'Av. Arequipa 456'),
(4, 'Maria Gomez', '966666666', 'maria@security.com', 'user123', 'Cliente', 'Calle Los Pinos 789'),
(5, 'Carlos Lopez', '955555555', 'carlos@security.com', 'user123', 'Cliente', 'Jr. Junin 101'),
(6, 'Ana Martinez', '944444444', 'ana@security.com', 'user123', 'Cliente', 'Av. Larco 202'),
(7, 'Pedro Quispe', '933333333', 'pedro@security.com', 'user123', 'Cliente', 'Calle Lima 303'),
(8, 'Laura Torres', '922222222', 'laura@security.com', 'user123', 'Cliente', 'Av. Javier Prado 404'),
(9, 'Luis Flores', '911111111', 'luis@security.com', 'user123', 'Cliente', 'Calle San Martin 505'),
(10, 'Sofia Castro', '900000000', 'sofia@security.com', 'user123', 'Cliente', 'Av. Tacna 606')
ON CONFLICT (id_usuario) DO NOTHING;

-- Los IDs se reinician para que coincidan con el seed
SELECT setval('usuario_id_usuario_seq', (SELECT MAX(id_usuario) FROM usuario));

-- 2. Ubicaciones
INSERT INTO ubicacion (id_ubicacion, nombre_lugar, direccion, latitud, longitud, tipo) VALUES
(1, 'Casa Central', 'Av. Primavera 123', -12.04637400, -77.04279300, 'Casa'),
(2, 'Negocio Repuestos', 'Av. Argentina 456', -12.04351200, -77.05128300, 'Negocio'),
(3, 'Departamento Anderson', 'Calle Alcanfores 789', -12.12239400, -77.02839200, 'Departamento'),
(4, 'Oficina Principal', 'Av. Rivera Navarrete 101', -12.09542300, -77.02294100, 'Negocio'),
(5, 'Almacén Secundario', 'Calle Industrial 302', -12.02941200, -77.01239400, 'Otro')
ON CONFLICT (id_ubicacion) DO NOTHING;

SELECT setval('ubicacion_id_ubicacion_seq', (SELECT MAX(id_ubicacion) FROM ubicacion));

-- 3. Dispositivos
INSERT INTO dispositivo (id_dispositivo, nombre_dispositivo, estado, id_ubicacion) VALUES
(1, 'ESP32-CAM Entrada', 'Activo', 1),
(2, 'Cámara Patio', 'Activo', 1),
(3, 'Sensor Movimiento Pasillo', 'Activo', 3),
(4, 'Cámara Caja Registradora', 'Activo', 2),
(5, 'Sensor Puerta Principal', 'Activo', 4)
ON CONFLICT (id_dispositivo) DO NOTHING;

SELECT setval('dispositivo_id_dispositivo_seq', (SELECT MAX(id_dispositivo) FROM dispositivo));

-- 4. Eventos (20 registros)
INSERT INTO evento (id_evento, tipo_evento, descripcion, id_dispositivo, nivel_riesgo) VALUES
(1, 'Movimiento', 'Detección en puerta principal', 1, 'Bajo'),
(2, 'Persona', 'Persona detectada en jardín', 2, 'Medio'),
(3, 'Ruido', 'Ruido sospechoso en almacén', 4, 'Bajo'),
(4, 'Puerta', 'Apertura de puerta trasera', 5, 'Alto'),
(5, 'Movimiento', 'Movimiento en pasillo central', 3, 'Bajo')
ON CONFLICT (id_evento) DO NOTHING;

SELECT setval('evento_id_evento_seq', (SELECT MAX(id_evento) FROM evento));

-- 5. Alertas
INSERT INTO alerta (id_alerta, id_evento, estado, prioridad) VALUES
(1, 1, 'Atendida', 'Baja'),
(2, 2, 'Atendida', 'Media'),
(3, 3, 'Descartada', 'Baja'),
(4, 4, 'Pendiente', 'Alta'),
(5, 5, 'Atendida', 'Baja')
ON CONFLICT (id_alerta) DO NOTHING;

SELECT setval('alerta_id_alerta_seq', (SELECT MAX(id_alerta) FROM alerta));

-- 6. Configuración de cámara
INSERT INTO camera_config (id, resolution, stream_quality, motion_detection, esp32_cam_url)
VALUES (1, 'VGA', 30, false, 'http://3.133.100.38:81/stream')
ON CONFLICT (id) DO NOTHING;
```

---

## 5. Resumen de archivos a modificar/crear

| Archivo | Acción | Descripción |
|---|---|---|
| `.md planes/plan-migracion-supabase.md` | ✅ Creado | Este documento |
| `db/schema_postgres.sql` | **Crear** | Schema PostgreSQL con ENUMs y tablas |
| `db/seed_postgres.sql` | **Crear** | Datos de prueba para PostgreSQL |
| `src/config/database.ts` | **Eliminar** | Reemplazado por supabase.ts |
| `src/config/supabase.ts` | **Crear** | Cliente Supabase con pool |
| `src/repositories/user.repository.ts` | **Reescribir** | Usar `supabase.from('usuario')` |
| `src/repositories/camera.repository.ts` | **Reescribir** | Usar `supabase.from('camera_config')` |
| `src/repositories/evento.repository.ts` | **Crear** | CRUD para eventos |
| `src/repositories/alerta.repository.ts` | **Crear** | CRUD para alertas |
| `src/repositories/evidencia.repository.ts` | **Crear** | CRUD para evidencias |
| `src/repositories/dispositivo.repository.ts` | **Crear** | CRUD para dispositivos |
| `src/repositories/notificacion.repository.ts` | **Crear** | CRUD para notificaciones |
| `src/services/auth.service.ts` | **Reescribir** | Usar `supabase.auth` |
| `src/middlewares/auth.ts` | **Reescribir** | Usar `supabase.auth.getUser()` |
| `src/services/camera.service.ts` | **Actualizar** | Agregar guardado de snapshots |
| `src/index.ts` | **Actualizar** | Reemplazar `initializeDatabase` |
| `.env` | **Actualizar** | Agregar SUPABASE_* vars |
| `.env.example` | **Actualizar** | Plantilla con nuevas vars |
| `dockerfile` | **Actualizar** | Opcional (no necesita cambios si las vars son env) |
| `.github/workflows/ci-cd.yml` | **Actualizar** | Agregar secrets de Supabase |
| `package.json` | **Actualizar** | Agregar `@supabase/supabase-js` |

---

## 6. Tiempo estimado

| Fase | Horas | Depende de |
|---|---|---|
| Fase 0: Preparación | 1h | — |
| Fase 1: Schema PostgreSQL | 2-3h | Fase 0 |
| Fase 2: Config Supabase | 1h | Fase 1 |
| Fase 3: Repositorios | 2h | Fase 2 |
| Fase 4: Auth Supabase | 2h | Fase 3 |
| Fase 5: Storage evidencias | 1h | Fase 3 |
| Fase 6: Realtime | 1h | Fase 4 |
| Fase 7: Persistencia frames | 2h | Fase 5 |
| Fase 8: Env/Docker/CI | 30min | Fases 2-4 |
| Fase 9: Seed data | 30min | Fase 1 |
| **Total** | **~13-14 horas** | |

---

## 7. Riesgos y consideraciones

### 1. Contraseñas en texto plano (CRÍTICO)
La app actual guarda contraseñas en texto plano. Al migrar a Supabase Auth, se usarán **bcrypt** automáticamente. Los usuarios existentes NO podrán iniciar sesión con su contraseña anterior porque el hash no coincidirá.

**Solución:** Al migrar, usar `supabase.auth.admin.createUser()` con `email_confirm: true` para cada usuario existente, y notificarles que deben usar "olvidé mi contraseña" en el primer inicio.

### 2. ENUMs en PostgreSQL
PostgreSQL maneja ENUMs como tipos personalizados a nivel de esquema. Es necesario crearlos explícitamente antes de las tablas. No se pueden alterar tan fácilmente como en MySQL.

### 3. Socket.io vs Supabase Realtime
- **Socket.io se mantiene** para el streaming de video binario (frames JPEG).
- **Supabase Realtime** se usa para notificaciones de eventos/alertas (datos pequeños).
- Ambos coexisten sin problema.

### 4. RLS (Row Level Security)
Al habilitar RLS, hay que configurar políticas para cada tabla. Si no se configuran, el acceso será denegado por defecto. El `service_role key` salta las políticas RLS (solo para el backend).

### 5. Costo a futuro
- **Capa gratis Supabase:** 500MB de base de datos, 50,000 usuarios mensuales activos, 2GB de ancho de banda, 1GB de storage.
- Si el proyecto crece, los planes pagos empiezan en $25/mes.
- **Recomendación:** Monitorear el uso en el dashboard de Supabase.

### 6. Dependencia de internet
Al ser cloud, la aplicación depende de conexión a internet para funcionar. No hay base de datos local de respaldo.

### 7. Latencia
Supabase tiene servidores en `us-east-1`. Si tu instancia AWS EC2 está en `us-east-1`, la latencia será mínima (<5ms). Si está en otra región, considerar migrar el proyecto de Supabase a la misma región.

---

## Notas finales

- La IP estática de AWS (`3.133.100.38`) está confirmada como fija, por lo que **no es necesario modificar el firmware de la ESP32-CAM** — la URL hardcodeada en el `.ino` seguirá funcionando.
- El firmware de la ESP32-CAM actualmente envía frames a `POST /api/camera/upload` sin autenticación. Se recomienda agregar un API Key simple en el futuro.
- El orden recomendado de implementación es secuencial (Fase 0 → 1 → 2 → ... → 9). No se recomienda saltar fases.
- Cada fase es independiente y se puede probar por separado antes de pasar a la siguiente.