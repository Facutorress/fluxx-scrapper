import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Kicker — antetítulo minimalista.
 *
 * Estilo único: uppercase, tracking [0.2em], peso 500, 11px, text-text-muted.
 * Acepta children (string o nodos). Sin `//`, sin bullets violetas, sin pulse —
 * versiones anteriores tenían eso, removido en Fase 6.
 *
 * Recibe className opcional para override (ej. cambiar tracking en algún caso).
 */
export function Kicker({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'text-[11px] font-medium uppercase tracking-[0.2em] text-text-muted',
        className,
      )}
    >
      {children}
    </div>
  );
}
