import { query } from '../config/database.js';

export interface UserRow {
  id?: number;
  username: string; // Se mapea a 'correo' en la base de datos
  password: string;
  role: string;     // Se mapea a 'rol' en la base de datos (se normaliza a minúsculas)
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
   * Crea un nuevo usuario en la base de datos.
   */
  async createUser(user: UserRow): Promise<void> {
    // Para insertar, volvemos a capitalizar el rol para cumplir con el ENUM
    const capitalizedRole = user.role.charAt(0).toUpperCase() + user.role.slice(1);
    await query(
      "INSERT INTO usuario (nombre, telefono, correo, password, rol, direccion) VALUES (?, ?, ?, ?, ?, ?)",
      [
        user.username.split('@')[0], // nombre simple por defecto
        `tel-${Date.now()}`,        // teléfono temporal único
        user.username,
        user.password,
        capitalizedRole,
        'Dirección por defecto'
      ]
    );
  }
};
