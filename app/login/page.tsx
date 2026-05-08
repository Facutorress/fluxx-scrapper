import Image from 'next/image';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAllowed } from '@/lib/auth';
import { LoginForm } from './login-form';

export const dynamic = 'force-dynamic';

const ERROR_MESSAGES: Record<string, string> = {
  not_allowed: 'Tu cuenta no está autorizada para acceder a Fluxx Dashboard.',
  missing_code: 'No se recibió el código de autenticación. Probá de nuevo.',
  exchange_failed: 'No pudimos completar el inicio de sesión. Probá de nuevo.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && isAllowed(user.email)) {
    redirect('/dashboard');
  }

  const errorMessage = searchParams.error ? ERROR_MESSAGES[searchParams.error] : null;

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/fluxx-logo.svg"
            alt="Fluxx"
            width={272}
            height={80}
            priority
            className="h-16 w-auto"
          />
          <h1 className="mt-6 font-display text-3xl text-text">FLUXX DASHBOARD</h1>
          <p className="mt-2 text-xs text-text-muted">Acceso restringido al equipo</p>
        </div>

        <div className="border border-border bg-surface p-6">
          {errorMessage && (
            <div className="mb-5 border-l-[3px] border-destructive bg-overlay px-4 py-3 text-sm text-text">
              {errorMessage}
            </div>
          )}

          <LoginForm />
        </div>

        <p className="mt-6 text-center font-mono text-[11px] text-text-dim">
          v0.1.0 · interno
        </p>
      </div>
    </div>
  );
}
