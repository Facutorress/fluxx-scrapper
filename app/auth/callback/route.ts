import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAllowed } from '@/lib/auth';

/**
 * Callback de OAuth post-Supabase.
 *
 * Flujo:
 *  1. /login → signInWithOAuth → Supabase → Google → Supabase → ESTA ruta con ?code=...
 *  2. Acá intercambiamos el code por una sesión.
 *  3. Validamos whitelist. Si pasa → /dashboard. Si no → signOut + /login?error=not_allowed.
 *
 * Esta ruta NO está registrada en Google Cloud Console — solo recibe el redirect interno de Supabase.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=exchange_failed`);
  }

  // Whitelist gate post-exchange (para no esperar al middleware del próximo request).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAllowed(user?.email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=not_allowed`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
