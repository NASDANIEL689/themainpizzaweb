import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  // Fallback mock so the rest of the UI still works when env vars are missing
  console.warn('Supabase environment variables are not set; using mock client');
  supabase = {
    from() {
      return {
        select() {
          return {
            async order() {
              return { data: [], error: null };
            }
          };
        },
        async insert() {
          return { data: [], error: null };
        }
      };
    },
    async rpc() {
      return {
        data: null,
        error: new Error('Supabase environment variables are not set')
      };
    }
  };
}

export { supabase };
