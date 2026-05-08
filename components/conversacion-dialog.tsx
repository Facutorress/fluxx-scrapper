'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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

export function ConversacionDialog({
  gimnasio,
  estrategias,
  open,
  onOpenChange,
}: {
  gimnasio: Pick<Gimnasio, 'place_id' | 'nombre' | 'ciudad'> | null;
  estrategias: Pick<Estrategia, 'id' | 'nombre'>[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [estrategiaId, setEstrategiaId] = useState<string>('');
  const [transcripcion, setTranscripcion] = useState('');
  const [fecha, setFecha] = useState(nowLocal());
  const [pending, startTransition] = useTransition();

  if (!gimnasio) return null;

  function reset() {
    setEstrategiaId('');
    setTranscripcion('');
    setFecha(nowLocal());
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!gimnasio) return;
    if (!estrategiaId) {
      toast.error('Elegí una estrategia.');
      return;
    }
    if (transcripcion.trim().length < MIN_TRANSCRIPCION) {
      toast.error(`La transcripción tiene que tener al menos ${MIN_TRANSCRIPCION} caracteres.`);
      return;
    }

    startTransition(async () => {
      const result = await createConversacion({
        gimnasio_place_id: gimnasio.place_id,
        estrategia_id: estrategiaId,
        transcripcion,
        fecha: new Date(fecha).toISOString(),
      });
      if (result.ok) {
        toast.success('Conversación cargada. Status del gimnasio movido a Prospectado.');
        reset();
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  const charCount = transcripcion.trim().length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border border-border bg-overlay">
        <DialogHeader>
          <DialogTitle className="font-sans text-lg font-semibold text-text">
            Cargar conversación
          </DialogTitle>
          <DialogDescription className="text-text-muted">
            <span className="text-text">{gimnasio.nombre}</span>
            {gimnasio.ciudad && <span className="text-text-dim"> · {gimnasio.ciudad}</span>}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="estrategia" className="text-xs text-text-muted">
              Estrategia usada
            </Label>
            <Select value={estrategiaId} onValueChange={setEstrategiaId} disabled={pending}>
              <SelectTrigger id="estrategia" className="border-border bg-bg text-text">
                <SelectValue placeholder="Elegí una estrategia…" />
              </SelectTrigger>
              <SelectContent className="border-border bg-overlay">
                {estrategias.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-text-dim">
                    No hay estrategias activas.
                  </div>
                ) : (
                  estrategias.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nombre}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fecha" className="text-xs text-text-muted">
              Fecha y hora
            </Label>
            <Input
              id="fecha"
              type="datetime-local"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              disabled={pending}
              className="border-border bg-bg text-text"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="transcripcion" className="text-xs text-text-muted">
                Transcripción
              </Label>
              <span
                className={`font-mono text-xs ${
                  charCount < MIN_TRANSCRIPCION ? 'text-text-dim' : 'text-cyan'
                }`}
              >
                {charCount} / {MIN_TRANSCRIPCION} mín
              </span>
            </div>
            <Textarea
              id="transcripcion"
              value={transcripcion}
              onChange={(e) => setTranscripcion(e.target.value)}
              placeholder="Pegá la transcripción completa de la conversación…"
              rows={10}
              disabled={pending}
              className="resize-none border-border bg-bg font-mono text-sm text-text placeholder:text-text-dim"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={pending}
              className="bg-transparent text-text-muted hover:bg-surface hover:text-text"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={pending || charCount < MIN_TRANSCRIPCION || !estrategiaId}
              className="bg-violet text-text hover:bg-violet-deep disabled:opacity-60"
            >
              {pending ? 'Guardando…' : 'Cargar conversación'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
