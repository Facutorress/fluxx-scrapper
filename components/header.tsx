import Image from 'next/image';
import Link from 'next/link';
import { Nav } from '@/components/nav';

/**
 * Header minimalista (60px) — solo logo + nav.
 *
 * Email + cerrar sesión se movieron al PageHeader (Fase 6) para liberar
 * espacio acá y dejar el nav limpio.
 *
 * Sin props: no necesita el email del usuario, lo muestra el PageHeader.
 */
export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface">
      <div className="mx-auto flex h-[60px] max-w-7xl items-center gap-8 px-6">
        <Link href="/dashboard" aria-label="Fluxx · ir al dashboard">
          <Image
            src="/fluxx-logo.svg"
            alt="Fluxx"
            width={109}
            height={32}
            priority
            className="h-8 w-auto"
          />
        </Link>
        <Nav />
      </div>
    </header>
  );
}
