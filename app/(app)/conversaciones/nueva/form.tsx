'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createConversacion } from '@/app/actions/conversaciones';
import type { Estrategia, Gimnasio } from '@/lib/database.types';

const MIN_TRANSCRIPCION = 200;

function nowLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function NuevaConversacionForm({
  gimnasios,
  estrategias,
}: {
  gimnasios: Pick<Gimnasio, 'place_id' | 'nombre' | 'ciudad'>[];
  estrategias: Pick<Estrategia, 'id' | 'nombre'>[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [gimnasioId, setGimnasioId] = useState<string>('');
  const [estrategiaId, setEstrategiaId] = useState<string>('');
  const [fecha, setFecha] = useState(nowLocal());
  const [transcripcion, setTranscripcion] = useState('');
  const [search, setSearch] = useState('');

  const gimnasiosFiltrados = search.trim()
    ? gimnasios.filter((g) =>
        (g.nombre ?? '').toLowerCase().includes(search.trim().toLowerCase()),
      )
    : gimnasios;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!gimnasioId) {
      toast.error('Elegí un gimnasio.');
      return;
    }
    if (!estrategiaId) {
      toast.error('Elegí una estrategia.');
      return;
    }
    if (transcripcion.trim().length < MIN_TRANSCRIPCION) {
      toast.error(
        `La transcripción tiene que tener al menos ${MIN_TRANSCRIPCION} caracteres.`,
      );
      return;
    }

    startTransition(async () => {
      const result = await createConversacion({
        gimnasio_place_id: gimnasioId,
        estrategia_id: estrategiaId,
        transcripcion,
        fecha: new Date(fecha).toISOString(),
      });
      if (result.ok) {
        toast.success('Conversación cargada.');
        router.push('/conversaciones');
      } else {
        toast.error(result.error);
      }
    });
  }

  const charCount = transcripcion.trim().length;

  if (gimnasios.length === 0) {
    return (
      <p className="text-sm text-text-muted">
        Todos los gimnasios scrapeados ya tienen una conversación cargada.
      </p>
    );
  }
  if (estrategias.length === 0) {
    return (
      <p className="text-sm text-text-muted">
        No hay estrategias activas. Creá una en{' '}
        <a href="/estrategias" className="text-cyan hover:underline">
          /estrategias
        </a>
        .
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="gimnasio-search" className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
          Buscar gimnasio
        </Label>
        <Input
          id="gimnasio-search"
          placeholder="Filtrá por nombre…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={pending}
          className="border-border bg-bg text-text transition-colors duration-150 placeholder:text-text-dim focus-visible:border-cyan focus-visible:ring-0"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="gimnasio" className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
          Gimnasio
        </Label>
        <Select value={gimnasioId} onValueChange={setGimnasioId} disabled={pending}>
          <SelectTrigger id="gimnasio" className="border-border bg-bg text-text transition-colors duration-150 focus:border-cyan">
            <SelectValue placeholder="Elegí un gimnasio…" />
          </SelectTrigger>
          <SelectContent className="max-h-72 border-border bg-overlay">
            {gimnasiosFiltrados.length === 0 ? (
              <div className="px-3 py-2 text-xs text-text-dim">
                Ningún gimnasio coincide con la búsqueda.
              </div>
            ) : (
              gimnasiosFiltrados.map((g) => (
                <SelectItem key={g.place_id} value={g.place_id}>
                  {g.nombre ?? 'sin nombre'}
                  {g.ciudad && (
                    <span className="ml-2 text-text-dim">— {g.ciudad}</span>
                  )}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <p className="font-mono text-[10px] text-text-dim">
          {gimnasios.length} gimnasios sin conversación cargada
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="estrategia" className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
          Estrategia
        </Label>
        <Select value={estrategiaId} onValueChange={setEstrategiaId} disabled={pending}>
          <SelectTrigger id="estrategia" className="border-border bg-bg text-text transition-colors duration-150 focus:border-cyan">
            <SelectValue placeholder="Elegí una estrategia…" />
          </SelectTrigger>
          <SelectContent className="border-border bg-overlay">
            {estrategias.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fecha" className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
          Fecha y hora
        </Label>
        <Input
          id="fecha"
          type="datetime-local"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          disabled={pending}
          className="border-border bg-bg text-text transition-colors duration-150 focus:border-cyan"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <Label htmlFor="transcripcion" className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
            Transcripción
          </Label>
          <span
            className={`font-mono-data text-xs transition-colors duration-200 ${
              charCount < MIN_TRANSCRIPCION
                ? 'text-text-dim'
                : 'text-green-live'
            }`}
          >
            {charCount} de {MIN_TRANSCRIPCION} mínimos
          </span>
        </div>
        <Textarea
          id="transcripcion"
          value={transcripcion}
          onChange={(e) => setTranscripcion(e.target.value)}
          placeholder="Pegá la transcripción completa…"
          rows={14}
          disabled={pending}
          className="font-mono-data resize-none border-border bg-bg text-sm text-text transition-colors duration-150 placeholder:text-text-dim focus-visible:border-cyan focus-visible:ring-0"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          onClick={() => router.push('/conversaciones')}
          disabled={pending}
          className="bg-transparent text-text-muted hover:bg-bg hover:text-text"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={
            pending || !gimnasioId || !estrategiaId || charCount < MIN_TRANSCRIPCION
          }
          className="bg-violet text-text hover:bg-violet-deep disabled:opacity-60"
        >
          {pending ? 'Guardando…' : 'Cargar conversación'}
        </Button>
      </div>
    </form>
  );
}
