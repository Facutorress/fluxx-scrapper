'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { analizarConversacion } from '@/app/actions/analisis-ia';

export type CreateConversacionInput = {
  gimnasio_place_id: string;
  estrategia_id: string;
  transcripcion: string;
  fecha: string; // ISO
};

export type ActionResult = { ok: true; id: string } | { ok: false; error: string };

const MIN_TRANSCRIPCION = 200;

export async function createConversacion(
  input: CreateConversacionInput,
): Promise<ActionResult> {
  // Validación server-side (la de cliente es complementaria, no fuente de verdad).
  if (!input.gimnasio_place_id) return { ok: false, error: 'Falta el gimnasio.' };
  if (!input.estrategia_id) return { ok: false, error: 'Falta la estrategia.' };
  if (!input.transcripcion || input.transcripcion.trim().length < MIN_TRANSCRIPCION) {
    return {
      ok: false,
      error: `La transcripción tiene que tener al menos ${MIN_TRANSCRIPCION} caracteres.`,
    };
  }

  const supabase = createClient();

  const { data, error } = await supabase
    .from('conversaciones')
    .insert({
      gimnasio_place_id: input.gimnasio_place_id,
      estrategia_id: input.estrategia_id,
      transcripcion: input.transcripcion.trim(),
      fecha: input.fecha,
    })
    .select('id')
    .single();

  if (error) {
    // 23505 = unique_violation. La constraint en gimnasio_place_id evita duplicados.
    if (error.code === '23505') {
      return {
        ok: false,
        error: 'Este gimnasio ya tiene una conversación cargada.',
      };
    }
    return { ok: false, error: error.message };
  }

  // Mover el status del gimnasio a 'prospectado' una vez cargada la conversación.
  const { error: updateError } = await supabase
    .from('gimnasios')
    .update({ status_prospeccion: 'prospectado' })
    .eq('place_id', input.gimnasio_place_id);

  if (updateError) {
    // No revertimos el insert (mantenemos la conversación). Reportamos el problema parcial.
    return {
      ok: false,
      error: `Conversación guardada pero no se pudo mover el status: ${updateError.message}`,
    };
  }

  revalidatePath('/dashboard');
  revalidatePath('/conversaciones');

  // Fire-and-forget: lanzamos el análisis IA pero no esperamos.
  // analizarConversacion atrapa sus propios errores y los loggea —
  // la conversación ya quedó guardada, así que no rompemos el flujo del user.
  void analizarConversacion(data.id);

  return { ok: true, id: data.id };
}
