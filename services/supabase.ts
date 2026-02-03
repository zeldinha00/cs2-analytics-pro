import { createClient } from '@supabase/supabase-js';

// Supabase credentials from environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ygwzooovjfltqdqksgqe.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlnd3pvb292amZsdHFkcWtzZ3FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMzIzMzgsImV4cCI6MjA4NDcwODMzOH0.u2Q242QR4DhBCW7BqQtL66oz4eykinkwXf2VbIw-Ats';

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export default supabase;
