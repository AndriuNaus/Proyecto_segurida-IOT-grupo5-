import { supabase } from '../config/supabase.js';

export interface UserRow {
  id?: number;
  username: string; // Se mapea a 'correo' en la base de datos
  password: string;
  role: string;     // Se mapea a 'rol' en la base de datos (se normaliza a minúsculas)
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  telefono?: string;
  direccion?: string;
  is_verified?: boolean;
  verification_token?: string;
}

export const UserRepository = {
  /**
   * Busca un usuario por su correo (nombre de usuario para login).
   */
  async findByUsername(username: string): Promise<UserRow | null> {
    try {
      const { data, error } = await supabase
        .from('usuario')
        .select('correo, password, rol, is_verified, verification_token')
        .eq('correo', username)
        .maybeSingle();

      if (error) {
        console.error('❌ Error de Supabase al buscar usuario:', error.message);
        return null;
      }

      if (!data) return null;

      return {
        username: data.correo,
        password: data.password,
        role: data.rol ? data.rol.toLowerCase() : 'cliente',
        primer_nombre: '',
        primer_apellido: '',
        is_verified: data.is_verified,
        verification_token: data.verification_token
      };
    } catch (err: any) {
      console.error('❌ Excepción al consultar usuario en Supabase:', err?.message || err);
      return null;
    }
  },

  /**
   * Busca un usuario por su número de teléfono.
   */
  async findByPhone(phone: string): Promise<UserRow | null> {
    try {
      const { data, error } = await supabase
        .from('usuario')
        .select('correo, password, rol, telefono, is_verified')
        .eq('telefono', phone)
        .maybeSingle();

      if (error) {
        console.error('❌ Error de Supabase al buscar teléfono:', error.message);
        return null;
      }

      if (!data) return null;

      return {
        username: data.correo,
        password: data.password,
        role: data.rol ? data.rol.toLowerCase() : 'cliente',
        telefono: data.telefono,
        primer_nombre: '',
        primer_apellido: '',
        is_verified: data.is_verified
      };
    } catch (err: any) {
      console.error('❌ Excepción al consultar teléfono en Supabase:', err?.message || err);
      return null;
    }
  },

  /**
   * Crea un nuevo usuario en la base de datos.
   */
  async createUser(user: UserRow): Promise<void> {
    const roleToCapitalize = user.role || 'cliente';
    const capitalizedRole = (roleToCapitalize.charAt(0).toUpperCase() + roleToCapitalize.slice(1)) as 'Cliente' | 'Admin' | 'Tecnico';

    const telefono = user.telefono || `tel-${Math.random().toString(36).slice(2, 12)}`;
    const direccion = user.direccion || 'Dirección por defecto';
    const nombreCompleto = `${user.primer_nombre} ${user.primer_apellido}`; // Fallback temporal para la tabla actual si no la han migrado

    const { error } = await supabase
      .from('usuario')
      .insert({
        nombre: nombreCompleto, // Mantenemos para compatibilidad hasta que se aplique la migración
        primer_nombre: user.primer_nombre,
        segundo_nombre: user.segundo_nombre,
        primer_apellido: user.primer_apellido,
        segundo_apellido: user.segundo_apellido,
        telefono,
        correo: user.username,
        password: user.password,
        rol: capitalizedRole,
        direccion,
        is_verified: user.is_verified ?? false,
        verification_token: user.verification_token
      });

    if (error) {
      console.error('Error insertando usuario en Supabase:', error.message);
      throw new Error(error.message);
    }
  },

  /**
   * Verifica el correo electrónico de un usuario usando el token
   */
  async verifyUser(token: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('usuario')
      .update({ is_verified: true, verification_token: null })
      .eq('verification_token', token)
      .select();

    if (error) {
      console.error('Error verificando usuario:', error.message);
      return false;
    }

    return data && data.length > 0;
  }
};
