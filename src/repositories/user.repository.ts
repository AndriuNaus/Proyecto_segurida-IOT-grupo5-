import { supabase } from '../config/supabase.js';

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
    const { data, error } = await supabase
      .from('usuario')
      .select('correo, password, rol')
      .eq('correo', username)
      .maybeSingle();

    if (error || !data) return null;

    return {
      username: data.correo,
      password: data.password,
      role: data.rol ? data.rol.toLowerCase() : 'cliente'
    };
  },

  /**
   * Busca un usuario por su número de teléfono.
   */
  async findByPhone(phone: string): Promise<UserRow | null> {
    const { data, error } = await supabase
      .from('usuario')
      .select('correo, password, rol, telefono')
      .eq('telefono', phone)
      .maybeSingle();

    if (error || !data) return null;

    return {
      username: data.correo,
      password: data.password,
      role: data.rol ? data.rol.toLowerCase() : 'cliente',
      telefono: data.telefono
    };
  },

  /**
   * Crea un nuevo usuario en la base de datos.
   */
  async createUser(user: UserRow): Promise<void> {
    const roleToCapitalize = user.role || 'cliente';
    const capitalizedRole = (roleToCapitalize.charAt(0).toUpperCase() + roleToCapitalize.slice(1)) as 'Cliente' | 'Admin' | 'Tecnico';

    const nombre = user.nombre || user.username.split('@')[0];
    const telefono = user.telefono || `tel-${Math.random().toString(36).slice(2, 12)}`;
    const direccion = user.direccion || 'Dirección por defecto';

    const { error } = await supabase
      .from('usuario')
      .insert({
        nombre,
        telefono,
        correo: user.username,
        password: user.password,
        rol: capitalizedRole,
        direccion
      });

    if (error) {
      console.error('Error insertando usuario en Supabase:', error);
      throw new Error(error.message);
    }
  }
};
