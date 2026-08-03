import { createClient } from '@supabase/supabase-js';

// --- Cliente Supabase propio (para persistencia de datos) ---
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'placeholder-key';

if (!process.env.SUPABASE_URL || (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_ANON_KEY)) {
  console.warn('⚠️ ATENCIÓN: SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no están definidos en las variables de entorno (.env).');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// --- Cliente Supabase del compañero (SOLO para verificar tokens de su auth) ---
// Sus credenciales son públicas por diseño (se usan en el frontend sin problema)
const companionUrl = process.env.COMPANION_SUPABASE_URL || '';
const companionAnonKey = process.env.COMPANION_SUPABASE_ANON_KEY || '';

export const companionSupabase = companionUrl && companionAnonKey
  ? createClient(companionUrl, companionAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null;

if (!companionUrl || !companionAnonKey) {
  console.warn('⚠️ COMPANION_SUPABASE_URL o COMPANION_SUPABASE_ANON_KEY no configurados. El endpoint /api/camera/stream-token no estará disponible.');
}

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
