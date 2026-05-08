'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, X, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { parseTranscripcion } from '@/lib/parse-transcripcion';
import { AnalisisSection, type AnalisisData } from '@/components/analisis-section';
import { Badge } from '@/components/ui/badge';

const HEADER_DATE_FMT = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

type Sentiment = 'positivo' | 'neutral' | 'negativo' | null;
type Intencion = 'alta' | 'media' | 'baja' | 'nula' | null;

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

/**
 * WhatsappConversationViewer — modal estilo chat de WhatsApp.
 *
 * Layout:
 *   ┌──────────────────────────────────┐
 *   │ HEADER violet gradient    [📋][X]│
 *   ├──────────────────────────────────┤
 *   │ BODY #E5DDD5 (clásico WA)        │
 *   │ Burbujas verdes (out) + blancas  │
 *   │ con border-l cyan (in) — el cyan │
 *   │ es el detalle Fluxx que distingue│
 *   │ del WhatsApp real.               │
 *   ├──────────────────────────────────┤
 *   │ FOOTER análisis IA (chips + link)│
 *   └──────────────────────────────────┘
 *
 * Behavior:
 *  - ESC cierra
 *  - Click fuera del modal cierra
 *  - Click en el modal NO se propaga
 *  - Botón copy → navigator.clipboard + toast
 */
export function WhatsappConversationViewer({
  open,
  onOpenChange,
  conversacionId,
  gimnasioNombre,
  fecha,
  transcripcion,
  analisis,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversacionId: string;
  gimnasioNombre: string | null;
  fecha: string;
  transcripcion: string;
  analisis: AnalisisData;
}) {
  const [showFullAnalisis, setShowFullAnalisis] = useState(false);

  const parseResult = useMemo(() => parseTranscripcion(transcripcion), [transcripcion]);

  // Cantidad de mensajes (parsed) o null si fallback.
  const messageCount =
    parseResult.kind === 'parsed' ? parseResult.messages.length : null;
  const durationMinutes =
    parseResult.kind === 'parsed' ? parseResult.durationMinutes : null;

  // ESC para cerrar.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onOpenChange]);

  // Bloquea scroll del body mientras está abierto.
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  // Reset del toggle de análisis cuando cambia conversación.
  useEffect(() => {
    setShowFullAnalisis(false);
  }, [conversacionId]);

  function handleCopy() {
    navigator.clipboard
      .writeText(transcripcion)
      .then(() => toast.success('Conversación copiada'))
      .catch(() => toast.error('No se pudo copiar'));
  }

  // Header subtitle: fecha + count + duración.
  const fechaFormatted = HEADER_DATE_FMT.format(new Date(fecha));
  const countLabel =
    messageCount === null
      ? 'formato no detectado'
      : `${messageCount} mensaje${messageCount === 1 ? '' : 's'}`;
  const durationLabel =
    durationMinutes !== null
      ? `${durationMinutes} min`
      : null;
  const subtitle = [fechaFormatted, countLabel, durationLabel]
    .filter(Boolean)
    .join(' · ');

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Conversación con ${gimnasioNombre ?? 'gimnasio'}`}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-[800px] flex-col overflow-hidden rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
            style={{ height: '85vh' }}
          >
            {/* HEADER violet gradient */}
            <div
              className="flex items-start justify-between gap-4 px-6 py-5"
              style={{
                background:
                  'linear-gradient(135deg, var(--violet) 0%, #5046E5 100%)',
              }}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono-data text-base text-white">
                  {gimnasioNombre ?? 'Sin nombre'}
                </p>
                <p className="mt-1 font-mono text-xs font-normal text-white/70">
                  {subtitle}
                </p>
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  onClick={handleCopy}
                  title="Copiar conversación"
                  className="flex h-9 w-9 items-center justify-center rounded-md bg-white/10 text-white transition-colors duration-150 hover:bg-white/20 active:scale-[0.95]"
                >
                  <Copy strokeWidth={1.5} className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onOpenChange(false)}
                  title="Cerrar (ESC)"
                  className="flex h-9 w-9 items-center justify-center rounded-md bg-white/10 text-white transition-colors duration-150 hover:bg-white/20 active:scale-[0.95]"
                >
                  <X strokeWidth={1.5} className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* BODY chat */}
            <div
              className="flex-1 overflow-y-auto px-6 py-5"
              style={{ background: '#E5DDD5' }}
            >
              {parseResult.kind === 'parsed' ? (
                <ul className="space-y-2">
                  {parseResult.messages.map((m, i) => (
                    <Bubble key={i} message={m} />
                  ))}
                </ul>
              ) : (
                <FallbackBlock text={parseResult.text} />
              )}
            </div>

            {/* FOOTER análisis IA */}
            <div
              className="border-t border-black/10 px-6 py-4"
              style={{ background: '#F0F0F0' }}
            >
              {showFullAnalisis ? (
                <div className="space-y-2">
                  <button
                    onClick={() => setShowFullAnalisis(false)}
                    className="text-[11px] uppercase tracking-wider text-text-dim hover:text-text-muted"
                  >
                    ▴ Cerrar análisis completo
                  </button>
                  {/* Reusamos AnalisisSection — vive sobre bg --bg, no F0F0F0,
                      pero la sección tiene su propio bg-bg interno. */}
                  <div className="rounded-md bg-[#0a0a0f] p-2">
                    <AnalisisSection
                      conversacionId={conversacionId}
                      analisis={analisis}
                    />
                  </div>
                </div>
              ) : (
                <CompactAnalisis
                  analisis={analisis}
                  onShowFull={() => setShowFullAnalisis(true)}
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Bubble ─────────────────────────────────────────────────────────────────

function Bubble({ message }: { message: { side: 'out' | 'in'; text: string; time: string | null } }) {
  const isOut = message.side === 'out';
  return (
    <li className={cn('flex', isOut ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'relative max-w-[70%] rounded-lg px-3 py-2 text-sm leading-snug shadow-sm',
          isOut ? 'bg-[#DCF8C6] text-black' : 'bg-white text-black border-l-[3px] border-l-cyan',
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.text}</p>
        {message.time && (
          <span className="mt-1 block text-right font-mono-data text-[10px] text-black/40">
            {message.time}
          </span>
        )}
      </div>
    </li>
  );
}

function FallbackBlock({ text }: { text: string }) {
  return (
    <div className="space-y-3">
      <p className="rounded-md bg-white/80 px-3 py-2 text-[11px] text-black/60">
        Formato no detectado, mostrando texto plano.
      </p>
      <pre className="whitespace-pre-wrap break-words rounded-lg bg-white px-4 py-3 text-sm leading-relaxed text-black shadow-sm">
        {text}
      </pre>
    </div>
  );
}

// ─── Footer compacto ────────────────────────────────────────────────────────

function CompactAnalisis({
  analisis,
  onShowFull,
}: {
  analisis: AnalisisData;
  onShowFull: () => void;
}) {
  if (!analisis) {
    return (
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-text-dim">
          <Sparkles strokeWidth={1.5} className="h-3.5 w-3.5" />
          Análisis IA pendiente.
        </div>
        <button
          onClick={onShowFull}
          className="inline-flex h-8 items-center gap-1.5 bg-violet px-3 text-[11px] font-medium uppercase tracking-wider text-white transition-colors duration-150 hover:bg-violet-deep active:scale-[0.98]"
        >
          <Sparkles strokeWidth={1.5} className="h-3.5 w-3.5" />
          Generar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Sparkles strokeWidth={1.5} className="h-3.5 w-3.5 text-violet" />
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-dim">
          Análisis IA
        </span>
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
      </div>
      {analisis.resumen && (
        <p className="line-clamp-2 text-xs italic text-black/70">{analisis.resumen}</p>
      )}
      <button
        onClick={onShowFull}
        className="text-[11px] uppercase tracking-wider text-violet hover:text-violet-deep"
      >
        Ver análisis completo ▾
      </button>
    </div>
  );
}
