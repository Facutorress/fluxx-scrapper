import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/page-header';
import { FadeInSection } from '@/components/fade-in-section';
import { EstrategiasManager } from './estrategias-manager';
import type { Estrategia } from '@/lib/database.types';

export const dynamic = 'force-dynamic';

export type EstrategiaConCount = Estrategia & { conversaciones_count: number };

export default async function EstrategiasPage() {
  const supabase = createClient();

  const { data: estrategias, error: errorEstrategias } = await supabase
    .from('estrategias')
    .select('*')
    .order('created_at', { ascending: true });

  const { data: conversaciones, error: errorConv } = await supabase
    .from('conversaciones')
    .select('estrategia_id');

  const counts = new Map<string, number>();
  for (const c of conversaciones ?? []) {
    counts.set(c.estrategia_id, (counts.get(c.estrategia_id) ?? 0) + 1);
  }

  const enriched: EstrategiaConCount[] = (estrategias ?? []).map((e) => ({
    ...e,
    conversaciones_count: counts.get(e.id) ?? 0,
  }));

  const errorMsg = errorEstrategias?.message ?? errorConv?.message ?? null;

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="CONFIGURACIÓN"
        title="Estrategias"
        subtitle="Enfoques que probás para prospectar. No se pueden borrar si tienen conversaciones asociadas."
      />

      {errorMsg && (
        <div className="border-l-[3px] border-destructive bg-surface px-4 py-3 text-sm text-text">
          Error al leer Supabase: <span className="font-mono">{errorMsg}</span>
        </div>
      )}

      <FadeInSection index={0}>
        <EstrategiasManager estrategias={enriched} />
      </FadeInSection>
    </div>
  );
}
