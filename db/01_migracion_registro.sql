-- =====================================================
-- MIGRACIÓN: Mejoras en Registro de Usuario
-- Ejecutar este script en Supabase SQL Editor
-- =====================================================

-- 1. Agregar nuevas columnas a la tabla usuario
ALTER TABLE usuario 
ADD COLUMN IF NOT EXISTS primer_nombre VARCHAR(100),
ADD COLUMN IF NOT EXISTS segundo_nombre VARCHAR(100),
ADD COLUMN IF NOT EXISTS primer_apellido VARCHAR(100),
ADD COLUMN IF NOT EXISTS segundo_apellido VARCHAR(100),
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);

-- 2. Actualizar datos existentes (Migración de datos de 'nombre' a 'primer_nombre' y 'primer_apellido')
-- Dividimos el campo nombre actual por el primer espacio.
UPDATE usuario
SET 
    primer_nombre = split_part(nombre, ' ', 1),
    primer_apellido = SUBSTRING(nombre FROM position(' ' in nombre) + 1)
WHERE primer_nombre IS NULL;

-- Asegurar que primer_nombre y primer_apellido no sean nulos para el futuro si se desea (opcional)
-- ALTER TABLE usuario ALTER COLUMN primer_nombre SET NOT NULL;
-- ALTER TABLE usuario ALTER COLUMN primer_apellido SET NOT NULL;

-- 3. Marcar a los usuarios existentes como verificados para que no pierdan el acceso
UPDATE usuario SET is_verified = true WHERE is_verified = false;

-- Opcional: Eliminar la columna 'nombre' antigua una vez que estés seguro de que todo funciona
-- ALTER TABLE usuario DROP COLUMN nombre;
