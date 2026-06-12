import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and anon key must be set');
  }

  if (typeof window === 'undefined' && typeof cookies !== 'undefined') {
    try {
      const { cookies } = require('next/headers');
      const cookieStore = cookies();
      return createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, { ...options });
              });
            } catch (error) { }
          },
        },
      });
    } catch (e) {
      // Fall through to admin client
    }
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceRoleKey) {
    return createAdminClient(supabaseUrl, serviceRoleKey);
  }

  return createAdminClient(supabaseUrl, supabaseAnonKey);
};
