import { Router, type Request, type Response } from 'express';
import { createHmac, randomUUID } from 'crypto';
import { query } from '../db.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET ?? 'secreto-super-seguro-clase-iot';

// Helper para firmar JWT
function base64url(str: string): string {
  return Buffer.from(str).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function generateToken(username: string, role: string): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    sub: username,
    iss: 'https://auth.iot-seguridad.local',
    aud: 'https://api.iot-seguridad.local/camera',
    role: role,
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hora de validez
    jti: randomUUID()
  }));

  const sig = createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${sig}`;
}

/**
 * @route POST /api/auth/login
 * @desc Iniciar sesión y obtener un JWT
 */
router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  // Validación de Entradas
  if (typeof username !== 'string' || !username.trim()) {
    res.status(400).json({ error: 'El campo "username" es requerido y debe ser un texto.' });
    return;
  }

  if (typeof password !== 'string' || password.length < 4) {
    res.status(400).json({ error: 'El campo "password" es requerido y debe tener al menos 4 caracteres.' });
    return;
  }

  try {
    // Buscar usuario en la base de datos
    const rows = await query("SELECT username, password, role FROM users WHERE username = ?", [username]);
    
    if (rows && rows.length > 0) {
      const user = rows[0];
      
      // Validar contraseña
      if (user.password === password) {
        const token = generateToken(user.username, user.role);
        res.status(200).json({
          message: 'Autenticación exitosa',
          token
        });
        return;
      }
    }

    res.status(401).json({ error: 'Credenciales inválidas' });
  } catch (err: any) {
    console.error("Error en login:", err.message);
    res.status(500).json({ error: 'Error interno en el servidor' });
  }
});

export default router;
