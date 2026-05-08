'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { crearConversacion, borrarConversacion } from '@/app/actions/chatbot';

type SidebarItem = {
  id: string;
  titulo: string | null;
  updated_at: string;
};

const RTF = new Intl.RelativeTimeFormat('es', { numeric: 'auto', style: 'short' });

function relTime(iso: string): string {
  const t = new Date(iso).getTime();
  const diff = Math.round((t - Date.now()) / 1000);
  const abs = Math.abs(diff);
  if (abs < 60) return 'ahora';
  if (abs < 3600) return RTF.format(Math.round(diff / 60), 'minute');
  if (abs < 86400) return RTF.format(Math.round(diff / 3600), 'hour');
  if (abs < 86400 * 30) return RTF.format(Math.round(diff / 86400), 'day');
  return RTF.format(Math.round(diff / (86400 * 30)), 'month');
}

export function ChatbotSidebar({ conversaciones }: { conversaciones: SidebarItem[] }) {
  const params = useParams<{ id?: string }>();
  const activeId = params?.id;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleNueva() {
    startTransition(async () => {
      const result = await crearConversacion();
      if (result.ok) {
        router.push(`/chatbot/${result.data.id}`);
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleBorrar(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('¿Borrar esta conversación?')) return;
    setDeletingId(id);
    startTransition(async () => {
      const result = await borrarConversacion(id);
      setDeletingId(null);
      if (result.ok) {
        if (activeId === id) router.push('/chatbot');
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <aside className="panel-card flex flex-col">
      <div className="border-b border-border p-3">
        <button
          onClick={handleNueva}
          disabled={pending}
          className="flex h-9 w-full items-center gap-2 bg-violet px-3 text-xs font-medium text-text transition-colors duration-150 hover:bg-violet-deep disabled:opacity-60 active:scale-[0.98]"
        >
          <Plus strokeWidth={1.5} className="h-4 w-4" />
          Nueva conversación
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversaciones.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <MessageSquare
              strokeWidth={1.25}
              className="mx-auto h-8 w-8 text-text-dim"
            />
            <p className="mt-3 text-xs text-text-dim">Sin conversaciones todavía.</p>
          </div>
        ) : (
          <ul>
            {conversaciones.map((c) => {
              const isActive = activeId === c.id;
              return (
                <li key={c.id}>
                  <Link
                    href={`/chatbot/${c.id}`}
                    className={cn(
                      'group relative flex items-start gap-2 border-l-[3px] border-transparent px-3 py-3 transition-colors duration-150',
                      isActive
                        ? 'border-l-violet bg-overlay'
                        : 'hover:bg-overlay',
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'truncate text-xs',
                          isActive ? 'font-medium text-text' : 'text-text-muted',
                        )}
                      >
                        {c.titulo || 'Sin título'}
                      </p>
                      <p className="mt-0.5 font-mono-data text-[10px] text-text-dim">
                        {relTime(c.updated_at)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleBorrar(c.id, e)}
                      disabled={pending}
                      className={cn(
                        'invisible shrink-0 p-1 text-text-dim transition-colors hover:text-destructive group-hover:visible',
                        deletingId === c.id && 'visible animate-pulse',
                      )}
                      title="Borrar"
                    >
                      <Trash2 strokeWidth={1.5} className="h-3.5 w-3.5" />
                    </button>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
