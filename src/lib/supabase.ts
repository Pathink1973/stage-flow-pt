import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const PROJECT_ID = import.meta.env.VITE_PROJECT_ID || 'default';

console.log('[Supabase] Initializing with URL:', supabaseUrl ? 'present' : 'MISSING');
console.log('[Supabase] Anon key:', supabaseAnonKey ? 'present' : 'MISSING');
console.log('[Supabase] Project ID:', PROJECT_ID);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 20,
    },
    timeout: 30000,
    heartbeatIntervalMs: 15000,
  },
});
