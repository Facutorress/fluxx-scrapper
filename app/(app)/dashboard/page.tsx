import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/page-header';
import { MetricCardV2 } from '@/components/metric-card-v2';
import { StatsRow, type StatsRowData } from '@/components/stats-row';
import { ActivityChart, type ActivityPoint } from '@/components/activity-chart';
import {
  RecentConversations,
  type RecentConversationItem,
} from '@/components/recent-conversations';
import { GimnasiosTable } from '@/components/gimnasios-table';
import { FadeInSection } from '@/components/fade-in-section';
import type { Gimnasio, StatusProspeccion } from '@/lib/database.types';

export const dynamic = 'force-dynamic';

const ACTIVITY_DAYS = 14;
const RECENT_LIMIT = 5;

type ConversacionWithJoins = {
  id: string;
  fecha: string;
  transcripcion: string;
  gimnasios: { nombre: string | null } | null;
  estrategias: { nombre: string } | null;
};

export default async function DashboardPage() {
  const supabase = createClient();

  const [gimnasiosResult, estrategiasResult, conversacionesResult] = await Promise.all([
    supabase
      .from('gimnasios')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(2000),
    supabase.from('estrategias').select('id, nombre').eq('activa', true).order('nombre'),
    supabase
      .from('conversaciones')
      .select(
        `id, fecha, transcripcion,
         gimnasios:gimnasio_place_id (nombre),
         estrategias:estrategia_id (nombre)`,
      )
      .order('fecha', { ascending: false })
      .limit(RECENT_LIMIT),
  ]);

  const gimnasios: Gimnasio[] = gimnasiosResult.data ?? [];
  const estrategiasActivas = estrategiasResult.data ?? [];
  const conversacionesRaw =
    (conversacionesResult.data as unknown as ConversacionWithJoins[] | null) ?? [];

  // ─── Métricas principales ───────────────────────────────────────────────
  const counts: Record<StatusProspeccion, number> = {
    no_contactado: 0,
    en_conversacion: 0,
    prospectado: 0,
    descartado: 0,
  };
  for (const g of gimnasios) {
    counts[g.status_prospeccion] = (counts[g.status_prospeccion] ?? 0) + 1;
  }
  const total = gimnasios.length;

  // Nuevos esta semana = scrapeados en los últimos 7 días.
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const nowMs = Date.now();
  const nuevosEstaSemana = gimnasios.filter((g) => {
    if (!g.fecha_scrapeo) return false;
    return nowMs - new Date(g.fecha_scrapeo).getTime() < SEVEN_DAYS_MS;
  }).length;

  // ─── Stats secundarias ──────────────────────────────────────────────────
  const tiposCount = new Map<string, number>();
  const ciudadesCount = new Map<string, number>();
  for (const g of gimnasios) {
    if (g.tipo) tiposCount.set(g.tipo, (tiposCount.get(g.tipo) ?? 0) + 1);
    if (g.ciudad) ciudadesCount.set(g.ciudad, (ciudadesCount.get(g.ciudad) ?? 0) + 1);
  }
  const topTipo = topEntry(tiposCount);
  const topCiudad = topEntry(ciudadesCount);
  const contactados = total - counts.no_contactado;

  const statsRowData: StatsRowData = {
    topTipo: topTipo ? { label: topTipo[0], value: topTipo[1], total } : null,
    topCiudad: topCiudad ? { label: topCiudad[0], value: topCiudad[1], total } : null,
    totalContactados: { value: contactados, total },
  };

  // ─── Actividad (chart) ───────────────────────────────────────────────────
  // TODO: cuando tengamos tabla de auditoría, calcular real.
  // Por ahora aproximamos: agrupamos updated_at por día y contamos cuántos quedaron en
  // cada status. Es una aproximación — un gimnasio que pasó por "en_conversacion" → "prospectado"
  // el mismo día solo aparece como "prospectado" porque solo tenemos el último valor.
  const activityData = buildActivitySeries(gimnasios, ACTIVITY_DAYS);

  // ─── Conversaciones recientes ───────────────────────────────────────────
  const recentItems: RecentConversationItem[] = conversacionesRaw.map((c) => ({
    id: c.id,
    fecha: c.fecha,
    transcripcion: c.transcripcion,
    gimnasio_nombre: c.gimnasios?.nombre ?? null,
    estrategia_nombre: c.estrategias?.nombre ?? null,
  }));

  // Total real de conversaciones para el "X de Y" (head=true count).
  const { count: totalConversaciones } = await supabase
    .from('conversaciones')
    .select('*', { count: 'exact', head: true });

  const errorMsg =
    gimnasiosResult.error?.message ??
    estrategiasResult.error?.message ??
    conversacionesResult.error?.message ??
    null;

  // ─── Subtextos para las MetricCardsV2 ────────────────────────────────────
  const pctOf = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  return (
    <div className="space-y-8">
      <PageHeader kicker="DASHBOARD OPERACIONES" title="Prospección · Gimnasios" />

      {errorMsg && (
        <div className="border-l-[3px] border-destructive bg-surface px-4 py-3 text-sm text-text">
          Error al leer Supabase: <span className="font-mono-data">{errorMsg}</span>
        </div>
      )}

      <FadeInSection index={0}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCardV2
            kicker="TOTAL PROSPECTOS"
            value={total}
            subtext={`${nuevosEstaSemana} nuevos esta semana`}
          />
          <MetricCardV2
            kicker="EN CONVERSACIÓN"
            value={counts.en_conversacion}
            subtext={`${pctOf(counts.en_conversacion)}% del total`}
          />
          <MetricCardV2
            kicker="PROSPECTADOS"
            value={counts.prospectado}
            subtext={`${totalConversaciones ?? 0} con conversación`}
          />
          <MetricCardV2
            kicker="DESCARTADOS"
            value={counts.descartado}
            subtext={`${pctOf(counts.descartado)}% del total`}
          />
        </div>
      </FadeInSection>

      <FadeInSection index={1}>
        <StatsRow data={statsRowData} />
      </FadeInSection>

      <FadeInSection index={2}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ActivityChart data={activityData} />
          <RecentConversations
            items={recentItems}
            totalCount={totalConversaciones ?? 0}
            limit={RECENT_LIMIT}
          />
        </div>
      </FadeInSection>

      <FadeInSection index={3}>
        <GimnasiosTable gimnasios={gimnasios} estrategiasActivas={estrategiasActivas} />
      </FadeInSection>
    </div>
  );
}

function topEntry(m: Map<string, number>): [string, number] | null {
  const entries = Array.from(m.entries());
  if (entries.length === 0) return null;
  let best: [string, number] = entries[0];
  for (const entry of entries) {
    if (entry[1] > best[1]) best = entry;
  }
  return best;
}

/**
 * Build una serie de N días para el chart de actividad.
 * Toma updated_at como proxy (no tenemos audit log) y cuenta gimnasios por día/status.
 */
function buildActivitySeries(gimnasios: Gimnasio[], days: number): ActivityPoint[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Map dateKey "YYYY-MM-DD" → counters
  const series = new Map<string, { en_conversacion: number; prospectado: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    series.set(toIsoDate(d), { en_conversacion: 0, prospectado: 0 });
  }

  for (const g of gimnasios) {
    if (!g.updated_at) continue;
    const key = toIsoDate(new Date(g.updated_at));
    const bucket = series.get(key);
    if (!bucket) continue;
    if (g.status_prospeccion === 'en_conversacion') bucket.en_conversacion += 1;
    else if (g.status_prospeccion === 'prospectado') bucket.prospectado += 1;
  }

  return Array.from(series.entries()).map(([fecha, c]) => ({
    fecha,
    en_conversacion: c.en_conversacion,
    prospectado: c.prospectado,
  }));
}

function toIsoDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
