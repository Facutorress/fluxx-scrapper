'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getAnthropicClient, MODEL_ANALISIS } from '@/lib/ai/anthropic-client';
import {
  ANALISIS_JSON_SCHEMA,
  getAnalisisPrompt,
  type AnalisisResult,
} from '@/lib/ai/prompts';

export type AnalisisActionResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Analiza una conversación con Claude Sonnet 4.6 y persiste el resultado
 * en analisis_ia (upsert por conversacion_id, que tiene UNIQUE).
 *
 * Diseñado para ser fire-and-forget desde createConversacion: si falla,
 * NO levantamos exception — devolvemos { ok: false } y loggeamos.
 *
 * El parsing del JSON usa output_config.format con json_schema → garantiza
 * estructura válida del response de la API. No hay que parsear Markdown.
 */
export async function analizarConversacion(
  conversacionId: string,
): Promise<AnalisisActionResult> {
  try {
    const supabase = createClient();

    // 1. Traer conversación + estrategia con un solo query.
    const { data: conv, error: errConv } = await supabase
      .from('conversaciones')
      .select(
        `
        id, transcripcion,
        estrategias:estrategia_id (nombre, descripcion)
        `,
      )
      .eq('id', conversacionId)
      .single();

    if (errConv || !conv) {
      console.error('[analizarConversacion] no encontré la conversación', errConv);
      return { ok: false, error: errConv?.message ?? 'Conversación no encontrada.' };
    }

    const estrategia = (
      conv as unknown as {
        transcripcion: string;
        estrategias: { nombre: string; descripcion: string | null } | null;
      }
    ).estrategias;

    if (!estrategia) {
      return { ok: false, error: 'La conversación no tiene estrategia asociada.' };
    }

    // 2. Llamada a Claude Sonnet 4.6 con structured outputs.
    const anthropic = getAnthropicClient();
    const prompt = getAnalisisPrompt(conv.transcripcion, estrategia);

    const response = await anthropic.messages.create({
      model: MODEL_ANALISIS,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
      // output_config.format con json_schema → la API garantiza JSON válido.
      // Cast `as never` porque los types públicos del SDK aún no incluyen
      // todos los campos del structured outputs GA — el runtime sí los acepta.
      output_config: {
        format: {
          type: 'json_schema',
          name: 'analisis_conversacion',
          schema: ANALISIS_JSON_SCHEMA,
        },
      },
    } as never);

    // 3. Extraer el texto del primer bloque y parsear.
    const textBlock = (response.content as Array<{ type: string; text?: string }>).find(
      (b) => b.type === 'text',
    );
    if (!textBlock?.text) {
      console.error('[analizarConversacion] response sin text block', response);
      return { ok: false, error: 'La API no devolvió contenido analizable.' };
    }

    let parsed: AnalisisResult;
    try {
      parsed = JSON.parse(textBlock.text) as AnalisisResult;
    } catch (e) {
      console.error('[analizarConversacion] JSON inválido:', textBlock.text, e);
      return { ok: false, error: 'La respuesta del modelo no era JSON válido.' };
    }

    // 4. Upsert en analisis_ia (UNIQUE en conversacion_id permite reanalizar).
    const { error: errUp } = await supabase
      .from('analisis_ia')
      .upsert(
        {
          conversacion_id: conversacionId,
          sentiment: parsed.sentiment,
          intencion_compra: parsed.intencion_compra,
          objeciones: parsed.objeciones,
          temas_clave: parsed.temas_clave,
          resumen: parsed.resumen,
          raw_response: response as unknown as Record<string, unknown>,
          modelo_usado: MODEL_ANALISIS,
        },
        { onConflict: 'conversacion_id' },
      );

    if (errUp) {
      console.error('[analizarConversacion] error al persistir', errUp);
      return { ok: false, error: errUp.message };
    }

    revalidatePath('/conversaciones');
    revalidatePath('/dashboard');
    return { ok: true };
  } catch (e) {
    // Anthropic rate limits, network errors, etc. NO rompemos el flujo del usuario.
    const msg = e instanceof Error ? e.message : 'Error desconocido al analizar.';
    console.error('[analizarConversacion] excepción:', e);
    return { ok: false, error: msg };
  }
}
