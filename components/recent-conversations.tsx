import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Kicker } from '@/components/kicker';

/**
 * RecentConversations — últimas N conversaciones cargadas.
 * Server Component: recibe la data ya joineada desde el dashboard page.
 *
 * Por ahora navega a /conversaciones?id={id}. La ruta /conversaciones todavía
 * no parsea el query param (lo dejaremos para una iteración futura), pero el
 * link queda preparado.
 */
export type RecentConversationItem = {
  id: string;
  fecha: string;
  transcripcion: string;
  gimnasio_nombre: string | null;
  estrategia_nombre: string | null;
};

export function RecentConversations({
  items,
  totalCount,
  limit = 5,
}: {
  items: RecentConversationItem[];
  totalCount: number;
  limit?: number;
}) {
  const shown = items.slice(0, limit);

  return (
    <div className="panel-card">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <Kicker>CONVERSACIONES RECIENTES</Kicker>
        <span className="font-mono-data text-xs text-text-muted">
          {shown.length} de {totalCount}
        </span>
      </div>

      {shown.length === 0 ? (
        <div className="px-6 py-10 text-center text-sm text-text-dim">
          Aún no cargaste conversaciones.
        </div>
      ) : (
        <ul>
          {shown.map((c) => (
            <li
              key={c.id}
              className="border-t border-border first:border-t-0"
            >
              <Link
                href={`/conversaciones?id=${c.id}`}
                className="block px-6 py-3 transition-colors hover:bg-overlay"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-text">
                        {c.gimnasio_nombre ?? 'Sin gimnasio'}
                      </span>
                      {c.estrategia_nombre && (
                        <Badge
                          variant="outline"
                          className="border-violet text-[10px] uppercase tracking-wider text-violet"
                        >
                          {c.estrategia_nombre}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1.5 line-clamp-1 text-xs text-text-muted">
                      {c.transcripcion.slice(0, 80)}
                      {c.transcripcion.length > 80 && '…'}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] text-text-dim">
                    <span className="mr-1.5 text-violet" aria-hidden="true">
                      ·
                    </span>
                    {relativeTime(c.fecha)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const RTF = new Intl.RelativeTimeFormat('es', { numeric: 'auto', style: 'long' });

/**
 * Formato relativo en español usando Intl.RelativeTimeFormat.
 * `numeric: 'auto'` produce "ayer" / "hace 2 días" / "hace 1 mes" según corresponda.
 */
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const diffSec = Math.round((then - Date.now()) / 1000);
  const absSec = Math.abs(diffSec);

  if (absSec < 60) return RTF.format(diffSec, 'second');
  if (absSec < 3600) return RTF.format(Math.round(diffSec / 60), 'minute');
  if (absSec < 86400) return RTF.format(Math.round(diffSec / 3600), 'hour');
  if (absSec < 86400 * 30) return RTF.format(Math.round(diffSec / 86400), 'day');
  if (absSec < 86400 * 365) return RTF.format(Math.round(diffSec / (86400 * 30)), 'month');
  return RTF.format(Math.round(diffSec / (86400 * 365)), 'year');
}
