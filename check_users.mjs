import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUsers() {
  const { data, error } = await supabase
    .from('usuario')
    .select('correo, rol, is_verified, primer_nombre, primer_apellido')
    .limit(10);
    
  if (error) {
    console.error('Error fetching users:', error.message);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

checkUsers();
