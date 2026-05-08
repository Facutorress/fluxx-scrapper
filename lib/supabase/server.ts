import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/database.types';

/**
 * Supabase client para Server Components, Server Actions y Route Handlers.
 * Usa cookies() de next/headers — no funciona en middleware (ahí va el de middleware.ts).
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Llamado desde un Server Component — el set falla silenciosamente.
            // El middleware refresca la sesión, así que esto es seguro.
          }
        },
      },
    },
  );
}
