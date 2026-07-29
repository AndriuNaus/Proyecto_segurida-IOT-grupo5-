import { supabase } from '../config/supabase.js';

export interface Resident {
  id: number;
  full_name: string;
  role: string;
  is_at_home: boolean;
  emergency_contact?: string;
  created_at?: string;
}

export const ResidentRepository = {
  async getAll(): Promise<Resident[]> {
    const { data, error } = await supabase
      .from('residents')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error al obtener residentes:', error.message);
      return [];
    }
    return data as Resident[];
  },

  async create(data: Omit<Resident, 'id' | 'created_at'>): Promise<Resident> {
    const { data: created, error } = await supabase
      .from('residents')
      .insert({
        full_name: data.full_name,
        role: data.role || 'Familiar',
        is_at_home: data.is_at_home ?? true,
        emergency_contact: data.emergency_contact || null,
      })
      .select()
      .single();

    if (error || !created) throw new Error(error?.message || 'Error creando residente');
    return created as Resident;
  },

  async updatePresence(id: number, is_at_home: boolean): Promise<Resident | null> {
    const { data, error } = await supabase
      .from('residents')
      .update({ is_at_home })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) return null;
    return data as Resident;
  },

  async delete(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('residents')
      .delete()
      .eq('id', id);

    return !error;
  },

  async getSummary() {
    const residents = await this.getAll();
    const total = residents.length;
    const atHome = residents.filter(r => r.is_at_home).length;
    return {
      total,
      atHome,
      isAnyoneHome: atHome > 0,
      mode: atHome > 0 ? 'EN_CASA' : 'AUSENTE',
    };
  }
};
