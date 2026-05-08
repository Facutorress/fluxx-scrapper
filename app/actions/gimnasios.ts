'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { StatusProspeccion } from '@/lib/database.types';
import { STATUS_PROSPECCION_VALUES } from '@/lib/database.types';

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function updateStatus(
  placeId: string,
  nuevoStatus: StatusProspeccion,
): Promise<ActionResult> {
  if (!STATUS_PROSPECCION_VALUES.includes(nuevoStatus)) {
    return { ok: false, error: 'Status inválido.' };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from('gimnasios')
    .update({ status_prospeccion: nuevoStatus })
    .eq('place_id', placeId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath('/dashboard');
  return { ok: true };
}

export async function updateGimnasio(
  placeId: string,
  data: { notas: string | null; fecha_ultimo_contacto: string | null },
): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase
    .from('gimnasios')
    .update({
      notas: data.notas,
      fecha_ultimo_contacto: data.fecha_ultimo_contacto,
    })
    .eq('place_id', placeId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath('/dashboard');
  return { ok: true };
}
