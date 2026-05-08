'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { analizarConversacion } from '@/app/actions/analisis-ia';

type Sentiment = 'positivo' | 'neutral' | 'negativo' | null;
type Intencion = 'alta' | 'media' | 'baja' | 'nula' | null;

export type AnalisisData = {
  sentiment: Sentiment;
  intencion_compra: Intencion;
  objeciones: string[] | null;
  temas_clave: string[] | null;
  resumen: string | null;
  modelo_usado: string | null;
} | null;

const SENTIMENT_STYLES: Record<NonNullable<Sentiment>, string> = {
  positivo: 'border-green-live text-green-live',
  neutral: 'border-text-muted text-text-muted',
  negativo: 'border-destructive text-destructive',
};

const INTENCION_STYLES: Record<NonNullable<Intencion>, string> = {
  alta: 'border-violet text-violet',
  media: 'border-cyan text-cyan',
  baja: 'border-text-muted text-text-muted',
  nula: 'border-text-dim text-text-dim',
};

export function AnalisisSection({
  conversacionId,
  analisis,
}: {
  conversacionId: string;
  analisis: AnalisisData;
}) {
  const [pending, startTransition] = useTransition();
  const [hasAttempted, setHasAttempted] = useState(false);

  function handleAnalizar() {
    startTransition(async () => {
      setHasAttempted(true);
      const result = await analizarConversacion(conversacionId);
      if (result.ok) {
        toast.success('Análisis generado.');
      } else {
        toast.error(`No se pudo analizar: ${result.error}`);
      }
    });
  }

  // ── Estado: sin análisis ────────────────────────────────────────────────
  if (!analisis) {
    return (
      <div className="border border-border bg-bg p-5">
        <div className="flex items-start gap-3">
          <AlertCircle
            strokeWidth={1.5}
            className="mt-0.5 h-5 w-5 shrink-0 text-text-dim"
          />
          <div className="flex-1">
            <p className="font-medium text-text-muted">Análisis no disponible</p>
            <p className="mt-1 text-xs font-light text-text-dim">
              {hasAttempted
                ? 'El análisis falló. Probá de nuevo.'
                : 'Aún no se generó un análisis para esta conversación.'}
            </p>
            <button
              onClick={handleAnalizar}
              disabled={pending}
              className="mt-3 inline-flex h-8 items-center gap-2 bg-violet px-3 text-xs font-medium text-text transition-colors duration-150 hover:bg-violet-deep disabled:opacity-60 active:scale-[0.98]"
            >
              <Sparkles strokeWidth={1.5} className="h-3.5 w-3.5" />
              {pending ? 'Generando…' : 'Generar análisis'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Estado: con análisis ────────────────────────────────────────────────
  return (
    <div className="space-y-4 border-l-[3px] border-l-violet border-y border-r border-border bg-bg p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles strokeWidth={1.5} className="h-4 w-4 text-violet" />
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
            Análisis IA
          </p>
        </div>
        <button
          onClick={handleAnalizar}
          disabled={pending}
          title="Re-analizar (sobreescribe el análisis actual)"
          className="flex items-center gap-1 text-[11px] text-text-dim transition-colors duration-150 hover:text-text disabled:opacity-50"
        >
          <RefreshCw
            strokeWidth={1.5}
            className={`h-3 w-3 ${pending ? 'animate-spin' : ''}`}
          />
          {pending ? 'Reanalizando…' : 'Re-analizar'}
        </button>
      </div>

      {analisis.resumen && (
        <p className="text-sm italic leading-relaxed text-text">{analisis.resumen}</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {analisis.sentiment && (
          <Badge
            variant="outline"
            className={`text-[10px] uppercase tracking-wider ${SENTIMENT_STYLES[analisis.sentiment]}`}
          >
            {analisis.sentiment}
          </Badge>
        )}
        {analisis.intencion_compra && (
          <Badge
            variant="outline"
            className={`text-[10px] uppercase tracking-wider ${INTENCION_STYLES[analisis.intencion_compra]}`}
          >
            Intención: {analisis.intencion_compra}
          </Badge>
        )}
        {analisis.modelo_usado && (
          <span className="font-mono-data text-[10px] text-text-dim">
            {analisis.modelo_usado}
          </span>
        )}
      </div>

      {analisis.objeciones && analisis.objeciones.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
            Objeciones
          </p>
          <ul className="space-y-1">
            {analisis.objeciones.map((o, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-text">
                <span className="mt-1 inline-block h-1 w-1 shrink-0 bg-violet" />
                <span>{o}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {analisis.temas_clave && analisis.temas_clave.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
            Temas clave
          </p>
          <div className="flex flex-wrap gap-1.5">
            {analisis.temas_clave.map((t, i) => (
              <span
                key={i}
                className="border border-border bg-overlay px-2 py-0.5 text-[11px] text-text-muted"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
