import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️ ATENCIÓN: SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no están definidos en las variables de entorno (.env).');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function initializeDatabase() {
  console.log('🔌 Conectando a Supabase PostgreSQL...');
  try {
    const { data, error } = await supabase.from('camera_config').select('count(*)', { count: 'exact', head: true });
    if (error) {
      console.warn('⚠️ Nota de Supabase:', error.message);
    } else {
      console.log('✅ Conexión con Supabase establecida correctamente.');
    }
  } catch (err: any) {
    console.error('❌ Error inicializando Supabase:', err?.message || err);
  }
}
