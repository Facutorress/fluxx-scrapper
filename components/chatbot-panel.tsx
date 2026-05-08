'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Send, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { Kicker } from '@/components/kicker';
import { enviarMensaje } from '@/app/actions/chatbot';
import type { ChatbotMensaje } from '@/lib/database.types';

type ToolCall = { id: string; name: string; input: unknown };
type ToolResult = { tool_use_id: string; result: unknown };

export function ChatbotPanel({
  conversacionId,
  titulo,
  mensajesIniciales,
}: {
  conversacionId: string;
  titulo: string | null;
  mensajesIniciales: ChatbotMensaje[];
}) {
  const router = useRouter();
  const [mensajes, setMensajes] = useState<ChatbotMensaje[]>(mensajesIniciales);
  const [input, setInput] = useState('');
  const [pending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync con server cuando cambia la lista (revalidate trae mensajes nuevos).
  useEffect(() => {
    setMensajes(mensajesIniciales);
  }, [mensajesIniciales]);

  // Auto-scroll al fondo cuando llega un mensaje nuevo o estamos pensando.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [mensajes, pending]);

  // Auto-resize del textarea.
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, [input]);

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || pending) return;

    // Optimistic: agregamos el user message inmediatamente.
    const optimistic: ChatbotMensaje = {
      id: `temp-${Date.now()}`,
      conversacion_id: conversacionId,
      rol: 'user',
      contenido: trimmed,
      tool_calls: null,
      tool_results: null,
      created_at: new Date().toISOString(),
    };
    setMensajes((prev) => [...prev, optimistic]);
    setInput('');

    startTransition(async () => {
      const result = await enviarMensaje(conversacionId, trimmed);
      if (!result.ok) {
        toast.error(result.error);
        // Sacamos el optimistic — el server no aceptó el mensaje.
        setMensajes((prev) => prev.filter((m) => m.id !== optimistic.id));
        return;
      }
      // Forzamos refresh del server data — trae user msg real + assistant.
      router.refresh();
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="panel-card flex h-full flex-col">
      <div className="border-b border-border px-6 py-4">
        <Kicker>ASISTENTE IA</Kicker>
        <h1 className="mt-1 truncate font-display text-2xl text-text">
          {titulo || (
            <span className="text-text-dim">Conversación sin título</span>
          )}
        </h1>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {mensajes.length === 0 && !pending && (
            <p className="text-center text-sm text-text-dim">
              Empezá la conversación escribiendo algo abajo.
            </p>
          )}
          {mensajes.map((m) => (
            <MessageBubble key={m.id} mensaje={m} />
          ))}
          {pending && <ThinkingIndicator />}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-border bg-bg px-6 py-4"
      >
        <div className="mx-auto flex max-w-3xl items-end gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Hacé una pregunta sobre tus conversaciones, gimnasios o estrategias…"
            rows={1}
            disabled={pending}
            className="flex-1 resize-none border border-border bg-surface px-3 py-2.5 text-sm text-text transition-colors duration-150 placeholder:text-text-dim focus:border-violet focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={pending || !input.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center bg-violet text-text transition-colors duration-150 hover:bg-violet-deep disabled:opacity-50 active:scale-[0.95]"
            title="Enviar (Enter)"
          >
            {pending ? (
              <Loader2 strokeWidth={1.5} className="h-4 w-4 animate-spin" />
            ) : (
              <Send strokeWidth={1.5} className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="mx-auto mt-2 max-w-3xl font-mono-data text-[10px] text-text-dim">
          Enter envía · Shift+Enter salto de línea
        </p>
      </form>
    </div>
  );
}

function MessageBubble({ mensaje }: { mensaje: ChatbotMensaje }) {
  const isUser = mensaje.rol === 'user';
  const tools = (mensaje.tool_calls ?? []) as unknown as ToolCall[];
  const results = (mensaje.tool_results ?? []) as unknown as ToolResult[];

  return (
    <div
      className={cn('flex flex-col gap-2', isUser ? 'items-end' : 'items-start')}
    >
      {!isUser && tools.length > 0 && <ToolCallsAccordion calls={tools} results={results} />}

      <div
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-2.5',
          isUser
            ? 'bg-violet text-text'
            : 'border border-border bg-bg text-text',
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm">{mensaje.contenido}</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none break-words">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => (
                  <p className="my-2 text-sm leading-relaxed text-text first:mt-0 last:mb-0">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="my-2 list-inside list-disc space-y-1 text-sm">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="my-2 list-inside list-decimal space-y-1 text-sm">
                    {children}
                  </ol>
                ),
                li: ({ children }) => <li className="text-text">{children}</li>,
                code: ({ className, children }) => {
                  const isBlock = className?.includes('language-');
                  return isBlock ? (
                    <code className="block overflow-x-auto border border-border bg-overlay p-3 font-mono-data text-xs text-text">
                      {children}
                    </code>
                  ) : (
                    <code className="bg-overlay px-1 py-0.5 font-mono-data text-[12px] text-cyan">
                      {children}
                    </code>
                  );
                },
                pre: ({ children }) => <pre className="my-3">{children}</pre>,
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet hover:underline"
                  >
                    {children}
                  </a>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-text">{children}</strong>
                ),
                em: ({ children }) => <em className="italic text-text">{children}</em>,
              }}
            >
              {mensaje.contenido}
            </ReactMarkdown>
          </div>
        )}
      </div>
      <p className="font-mono-data text-[10px] text-text-dim">
        {new Date(mensaje.created_at).toLocaleTimeString('es-AR', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </p>
    </div>
  );
}

function ToolCallsAccordion({
  calls,
  results,
}: {
  calls: ToolCall[];
  results: ToolResult[];
}) {
  const [open, setOpen] = useState(false);
  const names = Array.from(new Set(calls.map((c) => c.name)));

  return (
    <div className="max-w-[80%] border-l-[2px] border-l-cyan bg-overlay/50">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] uppercase tracking-wider text-text-muted hover:text-text"
      >
        <span className="text-cyan">{open ? '▾' : '▸'}</span>
        <span>Consultó: {names.join(', ')}</span>
      </button>
      {open && (
        <div className="space-y-3 border-t border-border px-3 py-3">
          {calls.map((c) => {
            const r = results.find((x) => x.tool_use_id === c.id);
            return (
              <div key={c.id}>
                <p className="font-mono-data text-[11px] text-cyan">{c.name}</p>
                <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-words border border-border bg-bg px-2 py-1.5 font-mono-data text-[10px] text-text-muted">
                  input: {JSON.stringify(c.input, null, 2)}
                </pre>
                {r && (
                  <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-words border border-border bg-bg px-2 py-1.5 font-mono-data text-[10px] text-text-muted">
                    {JSON.stringify(r.result, null, 2).slice(0, 800)}
                    {JSON.stringify(r.result, null, 2).length > 800 && '… (truncado)'}
                  </pre>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex items-start">
      <div className="border border-border bg-bg px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Loader2 strokeWidth={1.5} className="h-3.5 w-3.5 animate-spin text-violet" />
          <span>Pensando…</span>
        </div>
      </div>
    </div>
  );
}
