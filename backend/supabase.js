/**
 * Configuração Supabase para o Backend
 * Use as mesmas credenciais do frontend
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'sua-url-supabase';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sua-chave-anon';

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
