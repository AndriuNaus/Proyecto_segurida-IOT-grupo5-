import { supabase } from '../config/supabase.js';

export interface Mascota {
  id_mascota: number;
  nombre: string;
  tipo: string;
  owner_id: number;
  fecha_registro?: string;
}

export const MascotaRepository = {
  async getAllByOwner(ownerId: number): Promise<Mascota[]> {
    const { data, error } = await supabase
      .from('mascota')
      .select('*')
      .eq('owner_id', ownerId)
      .order('fecha_registro', { ascending: true });

    if (error) {
      console.error('Error al obtener mascotas:', error.message);
      return [];
    }
    return data as Mascota[];
  },

  async create(data: Omit<Mascota, 'id_mascota' | 'fecha_registro'>): Promise<Mascota> {
    const { data: created, error } = await supabase
      .from('mascota')
      .insert({
        nombre: data.nombre,
        tipo: data.tipo || 'Mascota',
        owner_id: data.owner_id,
      })
      .select()
      .single();

    if (error || !created) throw new Error(error?.message || 'Error creando mascota');
    return created as Mascota;
  },

  async delete(id_mascota: number, ownerId: number): Promise<boolean> {
    const { error } = await supabase
      .from('mascota')
      .delete()
      .eq('id_mascota', id_mascota)
      .eq('owner_id', ownerId);

    return !error;
  }
};
