'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Layers } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import {
  createEstrategia,
  updateEstrategia,
  toggleActiva,
  deleteEstrategia,
} from '@/app/actions/estrategias';
import type { EstrategiaConCount } from './page';

export function EstrategiasManager({
  estrategias,
}: {
  estrategias: EstrategiaConCount[];
}) {
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState<EstrategiaConCount | null>(null);
  const [pending, startTransition] = useTransition();

  function openNueva() {
    setEditing(null);
    setOpenDialog(true);
  }

  function openEditar(e: EstrategiaConCount) {
    setEditing(e);
    setOpenDialog(true);
  }

  function handleToggle(e: EstrategiaConCount) {
    startTransition(async () => {
      const result = await toggleActiva(e.id, !e.activa);
      if (!result.ok) toast.error(result.error);
    });
  }

  function handleDelete(e: EstrategiaConCount) {
    if (!confirm(`¿Borrar la estrategia "${e.nombre}"?`)) return;
    startTransition(async () => {
      const result = await deleteEstrategia(e.id);
      if (result.ok) {
        toast.success('Estrategia borrada.');
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      <div className="flex justify-end">
        <Button
          onClick={openNueva}
          className="gap-2 bg-violet text-text hover:bg-violet-deep"
        >
          <Plus strokeWidth={1.5} className="h-4 w-4" />
          Nueva estrategia
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {estrategias.length === 0 ? (
          <div className="panel-card flex flex-col items-center gap-3 px-6 py-16 text-center lg:col-span-2">
            <Layers strokeWidth={1.25} className="h-12 w-12 text-text-dim" />
            <p className="font-medium text-text-muted">
              No hay estrategias creadas todavía.
            </p>
            <p className="max-w-sm text-xs font-light text-text-dim">
              Las estrategias son los enfoques que probás para prospectar. Creá la
              primera para empezar a cargar conversaciones.
            </p>
            <button
              onClick={openNueva}
              className="mt-2 inline-flex h-9 items-center gap-2 bg-violet px-4 text-xs font-medium text-text transition-colors duration-150 hover:bg-violet-deep active:scale-[0.98]"
            >
              <Plus strokeWidth={1.5} className="h-3.5 w-3.5" />
              Crear primera estrategia
            </button>
          </div>
        ) : (
          estrategias.map((e) => (
            <div key={e.id} className="metric-card !p-5">
              <div className="metric-card-glow" />
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-sans text-base font-semibold text-text">
                    {e.nombre}
                  </h3>
                  <div className="mt-1.5 flex items-center gap-2">
                    {e.activa ? (
                      <Badge
                        variant="outline"
                        className="border-cyan text-xs uppercase tracking-wider text-cyan"
                      >
                        Activa
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-text-dim text-xs uppercase tracking-wider text-text-dim"
                      >
                        Inactiva
                      </Badge>
                    )}
                    <span className="font-mono text-xs text-text-dim">
                      {e.conversaciones_count} conversación
                      {e.conversaciones_count === 1 ? '' : 'es'}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => handleToggle(e)}
                    disabled={pending}
                    className="px-2 py-1 text-xs text-text-muted hover:text-text disabled:opacity-50"
                    title={e.activa ? 'Desactivar' : 'Activar'}
                  >
                    {e.activa ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    onClick={() => openEditar(e)}
                    disabled={pending}
                    className="p-2 text-text-muted hover:text-text disabled:opacity-50"
                    title="Editar"
                  >
                    <Pencil strokeWidth={1.5} className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(e)}
                    disabled={pending}
                    className="p-2 text-text-muted hover:text-destructive disabled:opacity-50"
                    title="Borrar"
                  >
                    <Trash2 strokeWidth={1.5} className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {e.descripcion && (
                <p className="mt-3 text-sm text-text-muted">{e.descripcion}</p>
              )}

              <p className="mt-3 font-mono text-[10px] text-text-dim">
                {e.id}
              </p>
            </div>
          ))
        )}
      </div>

      <EstrategiaDialog
        key={editing?.id ?? 'nueva'}
        open={openDialog}
        onOpenChange={setOpenDialog}
        editing={editing}
      />
    </>
  );
}

function EstrategiaDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: EstrategiaConCount | null;
}) {
  const [nombre, setNombre] = useState(editing?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(editing?.descripcion ?? '');
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error('El nombre es obligatorio.');
      return;
    }

    startTransition(async () => {
      const result = editing
        ? await updateEstrategia(editing.id, {
            nombre,
            descripcion: descripcion || null,
          })
        : await createEstrategia({ nombre, descripcion: descripcion || null });

      if (result.ok) {
        toast.success(editing ? 'Estrategia actualizada.' : 'Estrategia creada.');
        onOpenChange(false);
        setNombre('');
        setDescripcion('');
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          setNombre('');
          setDescripcion('');
        }
      }}
    >
      <DialogContent className="border border-border bg-overlay">
        <DialogHeader>
          <DialogTitle className="font-sans text-lg font-semibold text-text">
            {editing ? 'Editar estrategia' : 'Nueva estrategia'}
          </DialogTitle>
          <DialogDescription className="text-text-muted">
            Las estrategias son los enfoques que probás para prospectar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre" className="text-xs text-text-muted">
              Nombre
            </Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Estrategia A — directa por WhatsApp"
              disabled={pending}
              className="border-border bg-bg text-text placeholder:text-text-dim"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion" className="text-xs text-text-muted">
              Descripción
            </Label>
            <Textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Cómo se ejecuta esta estrategia, qué supuestos tiene…"
              rows={5}
              disabled={pending}
              className="resize-none border-border bg-bg text-sm text-text placeholder:text-text-dim"
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
              disabled={pending || !nombre.trim()}
              className="bg-violet text-text hover:bg-violet-deep disabled:opacity-60"
            >
              {pending ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear estrategia'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
