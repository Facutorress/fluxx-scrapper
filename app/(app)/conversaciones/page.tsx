import Link from 'next/link';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { MetricCardV2 } from '@/components/metric-card-v2';
import { FadeInSection } from '@/components/fade-in-section';
import { ConversacionesList } from './conversaciones-list';

export const dynamic = 'force-dynamic';

export default async function ConversacionesPage() {
  const supabase = createClient();

  const [conversacionesResult, estrategiasResult] = await Promise.all([
    supabase
      .from('conversaciones')
      .select(
        `
        id, fecha, transcripcion, estrategia_id, gimnasio_place_id, created_at,
        gimnasios:gimnasio_place_id (nombre, ciudad),
        estrategias:estrategia_id (nombre),
        analisis_ia (sentiment, intencion_compra, objeciones, temas_clave, resumen, modelo_usado, created_at)
        `,
      )
      .order('fecha', { ascending: false })
      .limit(500),
    supabase.from('estrategias').select('id, nombre').order('nombre'),
  ]);

  const conversaciones =
    (conversacionesResult.data as ConversacionRow[] | null) ?? [];
  const estrategias = estrategiasResult.data ?? [];
  const errorMsg =
    conversacionesResult.error?.message ?? estrategiasResult.error?.message ?? null;

  // ── Métricas ────────────────────────────────────────────
  const total = conversaciones.length;

  const estrategiaCounts = new Map<string, number>();
  for (const c of conversaciones) {
    if (c.estrategias?.nombre) {
      estrategiaCounts.set(
        c.estrategias.nombre,
        (estrategiaCounts.get(c.estrategias.nombre) ?? 0) + 1,
      );
    }
  }
  const topEstrategia = Array.from(estrategiaCounts.entries()).sort(
    (a, b) => b[1] - a[1],
  )[0];

  const ultimaCargada = conversaciones[0]; // ya viene ordenada por fecha desc
  const ultimaTexto = ultimaCargada
    ? relativeShort(ultimaCargada.fecha)
    : '—';

  return (
    <div className="space-y-8">
      <PageHeader kicker="REGISTROS" title="Conversaciones" />

      {errorMsg && (
        <div className="border-l-[3px] border-destructive bg-surface px-4 py-3 text-sm text-text">
          Error al leer Supabase: <span className="font-mono">{errorMsg}</span>
        </div>
      )}

      <FadeInSection index={0}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <MetricCardV2 kicker="TOTAL CONVERSACIONES" value={total} />
          <MetricCardV2
            kicker="TOP ESTRATEGIA"
            value={topEstrategia?.[0] ?? '—'}
            subtext={topEstrategia ? `${topEstrategia[1]} cargas` : 'Sin datos'}
          />
          <MetricCardV2
            kicker="ÚLTIMA CARGA"
            value={ultimaTexto}
            subtext={ultimaCargada?.gimnasios?.nombre ?? undefined}
          />
        </div>
      </FadeInSection>

      <FadeInSection index={1}>
        <div className="flex items-center justify-between gap-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-text-muted">
            Listado completo
          </p>
          <Link href="/conversaciones/nueva">
            <Button className="gap-2 bg-violet text-text hover:bg-violet-deep">
              <Plus strokeWidth={1.5} className="h-4 w-4" />
              Nueva conversación
            </Button>
          </Link>
        </div>
      </FadeInSection>

      <FadeInSection index={2}>
        <ConversacionesList conversaciones={conversaciones} estrategias={estrategias} />
      </FadeInSection>
    </div>
  );
}

/**
 * "hace 2 días" / "ayer" / "hoy" — versión corta, server-side.
 */
function relativeShort(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return 'hoy';
  if (days === 1) return 'ayer';
  if (days < 30) return `hace ${days}d`;
  if (days < 365) return `hace ${Math.floor(days / 30)}m`;
  return `hace ${Math.floor(days / 365)}a`;
}

export type ConversacionRow = {
  id: string;
  fecha: string;
  transcripcion: string;
  estrategia_id: string;
  gimnasio_place_id: string;
  created_at: string;
  gimnasios: { nombre: string | null; ciudad: string | null } | null;
  estrategias: { nombre: string } | null;
  // Supabase devuelve la relación 1:1 como array (siempre length 0 o 1).
  analisis_ia:
    | {
        sentiment: 'positivo' | 'neutral' | 'negativo' | null;
        intencion_compra: 'alta' | 'media' | 'baja' | 'nula' | null;
        objeciones: string[] | null;
        temas_clave: string[] | null;
        resumen: string | null;
        modelo_usado: string | null;
        created_at: string;
      }[]
    | null;
};
