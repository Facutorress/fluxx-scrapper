import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/page-header';
import { FadeInSection } from '@/components/fade-in-section';
import { NuevaConversacionForm } from './form';

export const dynamic = 'force-dynamic';

export default async function NuevaConversacionPage() {
  const supabase = createClient();

  const [gimnasiosResult, conversacionesResult, estrategiasResult] = await Promise.all([
    supabase
      .from('gimnasios')
      .select('place_id, nombre, ciudad')
      .order('nombre')
      .limit(2000),
    supabase.from('conversaciones').select('gimnasio_place_id'),
    supabase.from('estrategias').select('id, nombre').eq('activa', true).order('nombre'),
  ]);

  const usadas = new Set(
    (conversacionesResult.data ?? []).map((c) => c.gimnasio_place_id),
  );
  const gimnasiosDisponibles = (gimnasiosResult.data ?? []).filter(
    (g) => !usadas.has(g.place_id),
  );
  const estrategias = estrategiasResult.data ?? [];

  return (
    <div className="space-y-8">
      <Link
        href="/conversaciones"
        className="inline-flex items-center gap-1 text-xs text-text-muted transition-colors hover:text-text"
      >
        <ChevronLeft strokeWidth={1.5} className="h-3.5 w-3.5" />
        Volver a conversaciones
      </Link>

      <PageHeader
        kicker="REGISTRO · NUEVO"
        title="Cargar conversación"
        subtitle="Al guardar, el gimnasio pasa automáticamente a status “prospectado”."
      />

      <FadeInSection index={0}>
        <div className="panel-card p-6">
          <NuevaConversacionForm
            gimnasios={gimnasiosDisponibles}
            estrategias={estrategias}
          />
        </div>
      </FadeInSection>
    </div>
  );
}
