'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { ExternalLink, Star, MessageCircle, Globe, Phone, AtSign } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { updateGimnasio } from '@/app/actions/gimnasios';
import type { Gimnasio } from '@/lib/database.types';

function toLocalDatetime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  // <input type="datetime-local"> espera "YYYY-MM-DDTHH:mm" en hora local del browser.
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function GimnasioSheet({
  gimnasio,
  open,
  onOpenChange,
}: {
  gimnasio: Gimnasio | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [notas, setNotas] = useState(gimnasio?.notas ?? '');
  const [fechaContacto, setFechaContacto] = useState(
    toLocalDatetime(gimnasio?.fecha_ultimo_contacto ?? null),
  );
  const [pending, startTransition] = useTransition();

  if (!gimnasio) return null;

  function handleSave() {
    if (!gimnasio) return;
    startTransition(async () => {
      const isoFecha = fechaContacto ? new Date(fechaContacto).toISOString() : null;
      const result = await updateGimnasio(gimnasio.place_id, {
        notas: notas.trim() || null,
        fecha_ultimo_contacto: isoFecha,
      });
      if (result.ok) {
        toast.success('Gimnasio actualizado');
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-xl overflow-y-auto border-l border-border bg-overlay p-0 sm:max-w-xl"
      >
        <div className="border-b border-border px-6 py-5">
          <SheetHeader className="space-y-2 text-left">
            <SheetTitle className="font-sans text-lg font-semibold text-text">
              {gimnasio.nombre ?? 'Sin nombre'}
            </SheetTitle>
            <SheetDescription className="font-mono text-xs text-text-dim">
              {gimnasio.place_id}
            </SheetDescription>
            <div className="flex flex-wrap gap-2 pt-1">
              {gimnasio.tipo && (
                <Badge variant="outline" className="border-border-strong text-text-muted">
                  {gimnasio.tipo}
                </Badge>
              )}
              {gimnasio.ciudad && (
                <Badge variant="outline" className="border-border-strong text-text-muted">
                  {gimnasio.ciudad}
                </Badge>
              )}
            </div>
          </SheetHeader>
        </div>

        <div className="space-y-6 px-6 py-6">
          {/* Datos read-only */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Datos del gimnasio
            </h3>
            <DataRow label="Dirección" value={gimnasio.direccion} />
            <DataRow
              label="Rating"
              value={
                gimnasio.rating != null ? (
                  <span className="flex items-center gap-1 font-mono">
                    <Star strokeWidth={1.5} className="h-3.5 w-3.5 text-cyan" />
                    {gimnasio.rating.toFixed(1)}
                    {gimnasio.cantidad_reviews != null && (
                      <span className="text-text-dim">
                        ({gimnasio.cantidad_reviews})
                      </span>
                    )}
                  </span>
                ) : null
              }
            />
            <DataRow
              label="Teléfono"
              value={
                gimnasio.telefono ? (
                  <a
                    href={`tel:${gimnasio.telefono}`}
                    className="flex items-center gap-1 font-mono hover:text-cyan"
                  >
                    <Phone strokeWidth={1.5} className="h-3.5 w-3.5" />
                    {gimnasio.telefono}
                  </a>
                ) : null
              }
            />
            <DataRow
              label="WhatsApp"
              value={
                gimnasio.whatsapp_link ? (
                  <a
                    href={gimnasio.whatsapp_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-cyan"
                  >
                    <MessageCircle strokeWidth={1.5} className="h-3.5 w-3.5" />
                    Abrir chat
                    <ExternalLink strokeWidth={1.5} className="h-3 w-3" />
                  </a>
                ) : null
              }
            />
            <DataRow
              label="Web"
              value={
                gimnasio.web ? (
                  <a
                    href={gimnasio.web}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-cyan"
                  >
                    <Globe strokeWidth={1.5} className="h-3.5 w-3.5" />
                    {new URL(gimnasio.web).hostname.replace('www.', '')}
                    <ExternalLink strokeWidth={1.5} className="h-3 w-3" />
                  </a>
                ) : null
              }
            />
            <DataRow
              label="Instagram"
              value={
                gimnasio.instagram ? (
                  <a
                    href={gimnasio.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-cyan"
                  >
                    <AtSign strokeWidth={1.5} className="h-3.5 w-3.5" />
                    {gimnasio.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, '@').replace(/\/$/, '')}
                    <ExternalLink strokeWidth={1.5} className="h-3 w-3" />
                  </a>
                ) : null
              }
            />
            <DataRow
              label="Maps"
              value={
                gimnasio.google_maps_url ? (
                  <a
                    href={gimnasio.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-cyan"
                  >
                    Ver ubicación
                    <ExternalLink strokeWidth={1.5} className="h-3 w-3" />
                  </a>
                ) : null
              }
            />
            <DataRow
              label="Scrapeado"
              value={
                gimnasio.fecha_scrapeo
                  ? new Date(gimnasio.fecha_scrapeo).toLocaleDateString('es-AR')
                  : null
              }
            />
          </section>

          {/* Editable */}
          <section className="space-y-4 border-t border-border pt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Seguimiento
            </h3>

            <div className="space-y-2">
              <Label htmlFor="fecha-contacto" className="text-xs text-text-muted">
                Fecha último contacto
              </Label>
              <Input
                id="fecha-contacto"
                type="datetime-local"
                value={fechaContacto}
                onChange={(e) => setFechaContacto(e.target.value)}
                className="border-border bg-bg text-text"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notas" className="text-xs text-text-muted">
                Notas
              </Label>
              <Textarea
                id="notas"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Anotá lo que necesites recordar sobre este gimnasio…"
                rows={8}
                className="resize-none border-border bg-bg text-sm text-text placeholder:text-text-dim"
              />
            </div>
          </section>
        </div>

        <SheetFooter className="border-t border-border bg-bg px-6 py-4">
          <Button
            onClick={handleSave}
            disabled={pending}
            className="bg-violet text-text hover:bg-violet-deep disabled:opacity-60"
          >
            {pending ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function DataRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode | null | undefined;
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="shrink-0 text-text-dim">{label}</span>
      <span className="text-right text-text">{value || <em className="text-text-dim">—</em>}</span>
    </div>
  );
}
