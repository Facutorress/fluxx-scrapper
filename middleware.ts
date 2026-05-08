import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { isAllowed } from '@/lib/auth';

const PUBLIC_PATHS = ['/login', '/auth/callback'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas públicas: passthrough sin chequear sesión.
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const { supabase, response } = createClient(request);

  // getUser() valida el token con el server (no solo lee la cookie).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Sin sesión → /login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    return NextResponse.redirect(url);
  }

  // Sesión válida pero email fuera de whitelist:
  // signOut() PRIMERO para limpiar la cookie y evitar loop, después redirect con error.
  if (!isAllowed(user.email)) {
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '?error=not_allowed';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Aplica a todas las rutas EXCEPTO:
     * - _next/static, _next/image (assets internos de Next)
     * - favicon.ico, manifest, robots, sitemap
     * - archivos públicos con extensión (svg, png, jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml|.*\\..*).*)',
  ],
};
