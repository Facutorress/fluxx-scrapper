'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function createEstrategia(input: {
  nombre: string;
  descripcion: string | null;
}): Promise<ActionResult> {
  if (!input.nombre.trim()) return { ok: false, error: 'El nombre es obligatorio.' };

  const supabase = createClient();
  const { error } = await supabase.from('estrategias').insert({
    nombre: input.nombre.trim(),
    descripcion: input.descripcion?.trim() || null,
    activa: true,
  });

  if (error) {
    if (error.code === '23505') {
      return { ok: false, error: 'Ya existe una estrategia con ese nombre.' };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath('/estrategias');
  return { ok: true };
}

export async function updateEstrategia(
  id: string,
  input: { nombre: string; descripcion: string | null },
): Promise<ActionResult> {
  if (!input.nombre.trim()) return { ok: false, error: 'El nombre es obligatorio.' };

  const supabase = createClient();
  const { error } = await supabase
    .from('estrategias')
    .update({
      nombre: input.nombre.trim(),
      descripcion: input.descripcion?.trim() || null,
    })
    .eq('id', id);

  if (error) {
    if (error.code === '23505') {
      return { ok: false, error: 'Ya existe una estrategia con ese nombre.' };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath('/estrategias');
  return { ok: true };
}

export async function toggleActiva(id: string, activa: boolean): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase.from('estrategias').update({ activa }).eq('id', id);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/estrategias');
  revalidatePath('/conversaciones/nueva');
  return { ok: true };
}

export async function deleteEstrategia(id: string): Promise<ActionResult> {
  const supabase = createClient();

  // Guard: no permitir borrar si hay conversaciones asociadas.
  const { count, error: countError } = await supabase
    .from('conversaciones')
    .select('*', { count: 'exact', head: true })
    .eq('estrategia_id', id);

  if (countError) return { ok: false, error: countError.message };

  if (count && count > 0) {
    return {
      ok: false,
      error: 'No se puede borrar una estrategia con conversaciones asociadas.',
    };
  }

  const { error } = await supabase.from('estrategias').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/estrategias');
  return { ok: true };
}
