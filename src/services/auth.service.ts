import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { UserRepository } from '../repositories/user.repository.js';

const JWT_SECRET = process.env.JWT_SECRET ?? 'secreto-super-seguro-clase-iot';

function base64url(str: string): string {
  return Buffer.from(str).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str: string): string {
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}

export const AuthService = {
  /**
   * Genera un token JWT firmado mediante HMAC (HS256)
   */
  generateToken(username: string, role: string): string {
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
  },

  /**
   * Autentica a un usuario y retorna su JWT si las credenciales son válidas.
   */
  async login(username: string, password: string): Promise<string | null> {
    const user = await UserRepository.findByUsername(username);
    if (!user) return null;

    // Validación de contraseña (texto plano según inicialización en db)
    if (user.password !== password) return null;

    return this.generateToken(user.username, user.role);
  },

  /**
   * Verifica la validez y firma de un token JWT.
   * Retorna los claims si es válido o null si es inválido/expirado.
   */
  verifyToken(token: string): { sub: string; role: string } | null {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, sigB64] = parts as [string, string, string];

    try {
      // 1. Validar Algoritmo en Header
      const header = JSON.parse(base64urlDecode(headerB64));
      if (header.alg !== 'HS256') return null;

      // 2. Validar Firma usando timingSafeEqual
      const expectedSig = createHmac('sha256', JWT_SECRET)
        .update(`${headerB64}.${payloadB64}`)
        .digest('base64url');

      const sigBuf = Buffer.from(sigB64);
      const expectedSigBuf = Buffer.from(expectedSig);

      if (sigBuf.length !== expectedSigBuf.length || !timingSafeEqual(sigBuf, expectedSigBuf)) {
        return null;
      }

      // 3. Validar Expiración y Campos Obligatorios
      const claims = JSON.parse(base64urlDecode(payloadB64));
      const now = Math.floor(Date.now() / 1000);
      
      if (claims.exp && claims.exp < now) return null; // Expirado
      if (!claims.sub) return null; // Sub requerido

      return {
        sub: claims.sub,
        role: claims.role ?? 'guest'
      };
    } catch {
      return null;
    }
  }
};
