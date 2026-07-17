import { query } from '../config/database.js';

export interface UserRow {
  id?: number;
  username: string; // Se mapea a 'correo' en la base de datos
  password: string;
  role: string;     // Se mapea a 'rol' en la base de datos (se normaliza a minúsculas)
  nombre?: string;
  telefono?: string;
  direccion?: string;
}

export const UserRepository = {
  /**
   * Busca un usuario por su correo (nombre de usuario para login).
   */
  async findByUsername(username: string): Promise<UserRow | null> {
    const rows = await query(
      "SELECT correo as username, password, rol as role FROM usuario WHERE correo = ?",
      [username]
    );
    if (rows && rows.length > 0) {
      return {
        username: rows[0].username,
        password: rows[0].password,
        role: rows[0].role.toLowerCase() // Normalizamos 'Admin'/'Cliente' a 'admin'/'cliente'
      };
    }
    return null;
  },

  /**
   * Busca un usuario por su número de teléfono.
   */
  async findByPhone(phone: string): Promise<UserRow | null> {
    const rows = await query(
      "SELECT correo as username, password, rol as role, telefono FROM usuario WHERE telefono = ?",
      [phone]
    );
    if (rows && rows.length > 0) {
      return {
        username: rows[0].username,
        password: rows[0].password,
        role: rows[0].role.toLowerCase(),
        telefono: rows[0].telefono
      };
    }
    return null;
  },

  /**
   * Crea un nuevo usuario en la base de datos.
   */
  async createUser(user: UserRow): Promise<void> {
    // Para insertar, volvemos a capitalizar el rol para cumplir con el ENUM
    const roleToCapitalize = user.role || 'cliente';
    const capitalizedRole = roleToCapitalize.charAt(0).toUpperCase() + roleToCapitalize.slice(1);
    
    const nombre = user.nombre || user.username.split('@')[0];
    const telefono = user.telefono || `tel-${Math.random().toString(36).slice(2, 12)}`;
    const direccion = user.direccion || 'Dirección por defecto';

    await query(
      "INSERT INTO usuario (nombre, telefono, correo, password, rol, direccion) VALUES (?, ?, ?, ?, ?, ?)",
      [
        nombre,
        telefono,
        user.username,
        user.password,
        capitalizedRole,
        direccion
      ]
    );
  }
};

