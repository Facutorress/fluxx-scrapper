import Image from 'next/image';
import { LogOut } from 'lucide-react';
import { ClockLive } from '@/components/clock-live';
import { Kicker } from '@/components/kicker';
import { logout } from '@/app/actions/auth';
import { createClient } from '@/lib/supabase/server';

/**
 * PageHeader — header rico con logo + título a la izquierda, identidad +
 * reloj + cerrar sesión a la derecha.
 *
 * Server Component async: hace su propio fetch del user (para mostrar email
 * y exponer la action de logout). El (app) layout también lo hace pero el
 * doble fetch es despreciable y mantiene el componente self-contained.
 *
 * Layout:
 *  ┌ Logo 80px ┬ kicker          ┐  ┌ email muted          ┐
 *  │           │ TÍTULO ANTON     │  │ ● en vivo · 04:25 pm │
 *  │           │ subtitle         │  │ viernes, 8 de mayo   │
 *  │           │                  │  │ [CERRAR SESIÓN]      │
 *  └─────────────────────────────────── divider ──────────────────────────
 */
export async function PageHeader({
  kicker,
  title,
  subtitle,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="pb-6 pt-2">
      <div className="flex items-start justify-between gap-6">
        {/* Izquierda: logo + kicker/título */}
        <div className="flex min-w-0 items-center gap-6">
          <Image
            src="/fluxx-logo.svg"
            alt="Fluxx"
            width={272}
            height={80}
            priority
            className="h-20 w-auto shrink-0"
          />

          <div className="min-w-0 space-y-1">
            <Kicker>{kicker}</Kicker>
            <h1
              className="truncate whitespace-nowrap font-display text-text"
              style={{ fontSize: 'clamp(32px, 4vw, 48px)', lineHeight: 1.05 }}
              title={title}
            >
              <TitleWithBullets text={title} />
            </h1>
            {subtitle && (
              <p className="truncate pt-1 text-xs text-text-muted">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Derecha: email + ClockLive + cerrar sesión */}
        <div className="flex shrink-0 flex-col items-end gap-2">
          {user?.email && (
            <p className="font-mono-data text-[11px] text-text-dim">{user.email}</p>
          )}
          <ClockLive />
          <form action={logout}>
            <button
              type="submit"
              className="mt-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted transition-colors duration-150 hover:text-text"
              title="Cerrar sesión"
            >
              <LogOut strokeWidth={1.5} className="h-3.5 w-3.5" />
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>

      <div className="section-divider mt-6" />
    </div>
  );
}

/**
 * Pinta el carácter `·` en violeta — separador inline en titulares.
 */
function TitleWithBullets({ text }: { text: string }) {
  if (!text.includes('·')) return <>{text}</>;
  const parts = text.split('·');
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            <span className="mx-1.5 text-violet" aria-hidden="true">
              ·
            </span>
          )}
        </span>
      ))}
    </>
  );
}
