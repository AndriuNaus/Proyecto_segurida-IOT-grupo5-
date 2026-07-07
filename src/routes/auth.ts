import { Router, type Request, type Response } from 'express';
import { createHmac, randomUUID } from 'crypto';

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
router.post('/login', (req: Request, res: Response) => {
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

  // Credenciales estáticas de prueba (en producción usar base de datos)
  if (username === 'admin' && password === 'admin123') {
    const token = generateToken(username, 'admin');
    res.status(200).json({
      message: 'Autenticación exitosa',
      token
    });
    return;
  }

  if (username === 'anyella' && password === '1234') {
    const token = generateToken(username, 'admin');
    res.status(200).json({
      message: 'Autenticación exitosa',
      token
    });
    return;
  }

  // Para pruebas/demo: cualquier otro usuario se loguea con rol 'user'
  const token = generateToken(username, 'user');
  res.status(200).json({
    message: 'Autenticación exitosa',
    token
  });
});

export default router;
