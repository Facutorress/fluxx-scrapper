'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Eye, Inbox } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { AnalisisData } from '@/components/analisis-section';
import { WhatsappConversationViewer } from '@/components/whatsapp-conversation-viewer';
import type { Estrategia } from '@/lib/database.types';
import type { ConversacionRow } from './page';

const ALL = '__all__';

export function ConversacionesList({
  conversaciones,
  estrategias,
}: {
  conversaciones: ConversacionRow[];
  estrategias: Pick<Estrategia, 'id' | 'nombre'>[];
}) {
  const [filter, setFilter] = useState<string>(ALL);
  const [openViewer, setOpenViewer] = useState(false);
  const [selected, setSelected] = useState<ConversacionRow | null>(null);

  const filtered = useMemo(() => {
    if (filter === ALL) return conversaciones;
    return conversaciones.filter((c) => c.estrategia_id === filter);
  }, [conversaciones, filter]);

  function openOne(c: ConversacionRow) {
    setSelected(c);
    setOpenViewer(true);
  }

  // Extraemos analisis_ia (array de length 0 o 1) al shape que espera AnalisisData.
  const selectedAnalisis: AnalisisData =
    selected?.analisis_ia && selected.analisis_ia.length > 0
      ? (selected.analisis_ia[0] as AnalisisData)
      : null;

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-64 border-border bg-surface text-text">
            <SelectValue placeholder="Filtrar por estrategia" />
          </SelectTrigger>
          <SelectContent className="border-border bg-overlay">
            <SelectItem value={ALL}>Todas las estrategias</SelectItem>
            {estrategias.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <p className="font-mono text-xs text-text-dim">
          {filtered.length} de {conversaciones.length} conversaciones
        </p>
      </div>

      <div className="panel-card">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableHead className="text-xs uppercase tracking-wider text-text-muted">
                Gimnasio
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-text-muted">
                Estrategia
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-text-muted">
                Fecha
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-text-muted">
                Transcripción
              </TableHead>
              <TableHead className="text-right text-xs uppercase tracking-wider text-text-muted">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="py-16">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <Inbox
                      strokeWidth={1.25}
                      className="h-12 w-12 text-text-dim"
                    />
                    {conversaciones.length === 0 ? (
                      <>
                        <p className="font-medium text-text-muted">
                          Aún no cargaste conversaciones.
                        </p>
                        <p className="max-w-sm text-xs font-light text-text-dim">
                          Cuando cargues tu primera conversación, aparece acá. El gimnasio
                          asociado pasa automáticamente a “prospectado”.
                        </p>
                        <Link
                          href="/conversaciones/nueva"
                          className="mt-2 inline-flex h-9 items-center gap-2 bg-violet px-4 text-xs font-medium text-text transition-colors hover:bg-violet-deep active:scale-[0.98]"
                        >
                          Cargar primera conversación
                        </Link>
                      </>
                    ) : (
                      <p className="text-sm text-text-muted">
                        No hay conversaciones que coincidan con el filtro.
                      </p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow
                  key={c.id}
                  onClick={() => openOne(c)}
                  className="cursor-pointer border-b border-border transition-colors hover:bg-overlay"
                >
                  <TableCell className="font-medium text-text">
                    {c.gimnasios?.nombre ?? <em className="text-text-dim">—</em>}
                    {c.gimnasios?.ciudad && (
                      <span className="ml-1 text-xs text-text-dim">
                        · {c.gimnasios.ciudad}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {c.estrategias?.nombre ? (
                      <Badge
                        variant="outline"
                        className="border-violet text-violet"
                      >
                        {c.estrategias.nombre}
                      </Badge>
                    ) : (
                      <span className="text-text-dim">—</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-text-muted">
                    {new Date(c.fecha).toLocaleString('es-AR', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </TableCell>
                  <TableCell className="max-w-md text-text-muted">
                    <span className="line-clamp-1 text-xs">
                      {c.transcripcion.slice(0, 100)}
                      {c.transcripcion.length > 100 && '…'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openOne(c);
                      }}
                      className="inline-flex h-8 items-center gap-1.5 px-3 text-xs text-text-muted transition-colors hover:text-text"
                    >
                      <Eye strokeWidth={1.5} className="h-3.5 w-3.5" />
                      Ver
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selected && (
        <WhatsappConversationViewer
          open={openViewer}
          onOpenChange={setOpenViewer}
          conversacionId={selected.id}
          gimnasioNombre={selected.gimnasios?.nombre ?? null}
          fecha={selected.fecha}
          transcripcion={selected.transcripcion}
          analisis={selectedAnalisis}
        />
      )}
    </>
  );
}
