import { createHmac, timingSafeEqual } from 'crypto';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';
import { UserRepository, type UserRow } from '../repositories/user.repository.js';

// Configuración de correo electrónico
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true para 465, false para otros puertos
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

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
      jti: uuidv4()
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

    let isMatch = false;
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$')) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      // Compatibilidad con usuarios de prueba antiguos en texto plano
      isMatch = (user.password === password);
    }

    if (!isMatch) return null;

    // Verificar si el correo ha sido verificado (a menos que sea el admin o usuario de prueba legacy)
    if (user.is_verified === false && user.role !== 'admin') {
      throw new Error('NOT_VERIFIED');
    }

    return this.generateToken(user.username, user.role);
  },

  /**
   * Registra un nuevo usuario en el sistema con la contraseña encriptada con Bcrypt.
   * Lanza un error si el usuario ya existe.
   */
  async register(userData: Omit<UserRow, 'id'>): Promise<void> {
    const existingUser = await UserRepository.findByUsername(userData.username);
    if (existingUser) {
      throw new Error('El correo electrónico ya se encuentra registrado.');
    }
    if (userData.telefono) {
      const existingPhone = await UserRepository.findByPhone(userData.telefono);
      if (existingPhone) {
        throw new Error('El número de teléfono ya se encuentra registrado.');
      }
    }
    // Hashear contraseña con Bcrypt (salt rounds = 10)
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const verificationToken = uuidv4();

    await UserRepository.createUser({
      ...userData,
      password: hashedPassword,
      is_verified: false,
      verification_token: verificationToken
    });

    // Enviar correo de verificación (en segundo plano)
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verificar?token=${verificationToken}`;
      
      transporter.sendMail({
        from: `"Sistema de Seguridad" <${process.env.SMTP_USER}>`,
        to: userData.username,
        subject: 'Verifica tu cuenta',
        html: `
          <h1>Bienvenido al Sistema de Seguridad Inteligente</h1>
          <p>Hola ${userData.primer_nombre},</p>
          <p>Para activar tu cuenta y poder iniciar sesión, por favor haz clic en el siguiente enlace:</p>
          <a href="${verificationLink}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">Verificar mi correo</a>
          <p>Si no solicitaste esta cuenta, puedes ignorar este correo.</p>
        `
      }).catch(err => console.error('Error enviando correo de verificación:', err));
    } else {
      console.warn('⚠️ Credenciales SMTP no configuradas. No se enviará el correo de verificación.');
      console.log(`Token de verificación para ${userData.username}: ${verificationToken}`);
    }
  },

  /**
   * Verifica un token de correo electrónico.
   */
  async verifyEmail(token: string): Promise<boolean> {
    return await UserRepository.verifyUser(token);
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
