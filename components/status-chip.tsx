'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  STATUS_PROSPECCION_VALUES,
  STATUS_PROSPECCION_LABELS,
  type StatusProspeccion,
} from '@/lib/database.types';
import { updateStatus } from '@/app/actions/gimnasios';

const STATUS_STYLES: Record<StatusProspeccion, string> = {
  no_contactado: 'border-text-dim text-text-muted',
  en_conversacion: 'border-cyan text-cyan',
  prospectado: 'border-violet text-violet',
  descartado: 'border-text-dim/50 text-text-dim',
};

export function StatusChip({
  placeId,
  status,
}: {
  placeId: string;
  status: StatusProspeccion;
}) {
  const [current, setCurrent] = useState<StatusProspeccion>(status);
  const [pending, startTransition] = useTransition();

  function onChange(next: string) {
    const nextStatus = next as StatusProspeccion;
    if (nextStatus === current) return;

    const previous = current;
    setCurrent(nextStatus); // optimista

    startTransition(async () => {
      const result = await updateStatus(placeId, nextStatus);
      if (!result.ok) {
        setCurrent(previous);
        toast.error(`No se pudo actualizar: ${result.error}`);
      } else {
        toast.success(`Status: ${STATUS_PROSPECCION_LABELS[nextStatus]}`);
      }
    });
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Select value={current} onValueChange={onChange} disabled={pending}>
        <SelectTrigger
          className={cn(
            'h-7 min-w-[160px] gap-2 border bg-transparent px-2 text-xs font-medium uppercase tracking-wide',
            STATUS_STYLES[current],
            pending && 'opacity-60',
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="border-border bg-overlay">
          {STATUS_PROSPECCION_VALUES.map((s) => (
            <SelectItem key={s} value={s} className="text-xs uppercase tracking-wide">
              {STATUS_PROSPECCION_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
