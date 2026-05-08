'use server';

import { revalidatePath } from 'next/cache';
import type Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { getAnthropicClient, MODEL_ANALISIS, MODEL_CHATBOT } from '@/lib/ai/anthropic-client';
import {
  CHATBOT_SYSTEM_PROMPT,
  getTituloChatbotPrompt,
} from '@/lib/ai/prompts';
import { executeTool, TOOL_DEFINITIONS } from '@/lib/ai/tools';

const MAX_AGENT_ITERATIONS = 8;
const MAX_TOKENS_RESPONSE = 16384;

export type ActionOk<T = void> = T extends void
  ? { ok: true }
  : { ok: true; data: T };
export type ActionErr = { ok: false; error: string };
export type ActionResult<T = void> = ActionOk<T> | ActionErr;

// ─── CRUD básico ────────────────────────────────────────────────────────────

export async function crearConversacion(): Promise<ActionResult<{ id: string }>> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'No hay sesión.' };

  const { data, error } = await supabase
    .from('chatbot_conversaciones')
    .insert({ user_id: user.id })
    .select('id')
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath('/chatbot');
  return { ok: true, data: { id: data.id } };
}

export async function borrarConversacion(id: string): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase.from('chatbot_conversaciones').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/chatbot');
  return { ok: true };
}

export async function renombrarConversacion(
  id: string,
  titulo: string,
): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase
    .from('chatbot_conversaciones')
    .update({ titulo: titulo.trim() })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/chatbot');
  revalidatePath(`/chatbot/${id}`);
  return { ok: true };
}

// ─── Loop agéntico ──────────────────────────────────────────────────────────

type StoredAssistantMessage = {
  text: string;
  tool_calls: Array<{ id: string; name: string; input: unknown }>;
  tool_results: Array<{ tool_use_id: string; result: unknown }>;
};

/**
 * Dispara el ciclo de mensajes con Claude Opus 4.7.
 *
 * Flow:
 *  1. INSERT user message en chatbot_mensajes.
 *  2. Trae historial completo + lo arma como `messages` en el formato Anthropic.
 *  3. Loop: API call con tools. Si stop_reason='tool_use', ejecuta y retorna resultados.
 *     Repite hasta end_turn (o max iterations).
 *  4. INSERT assistant message con tool_calls/tool_results en JSONB.
 *  5. Si era el primer turno y la conversación no tiene título, autogenera uno.
 *
 * Caching: top-level cache_control: 'ephemeral' → cachea automáticamente
 * tools + system + mensajes hasta el último turno. El próximo turno reutiliza
 * el prefijo cacheado.
 *
 * Opus 4.7: adaptive thinking + effort 'xhigh' (recomendado para agentic).
 * No `temperature`/`top_p`/`top_k` — devolverían 400.
 */
export async function enviarMensaje(
  conversacionId: string,
  mensajeUsuario: string,
): Promise<ActionResult<{ mensaje: StoredAssistantMessage }>> {
  if (!mensajeUsuario.trim()) {
    return { ok: false, error: 'El mensaje está vacío.' };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'No hay sesión.' };

  // 1. Insert del mensaje del user.
  const { error: insertErr } = await supabase.from('chatbot_mensajes').insert({
    conversacion_id: conversacionId,
    rol: 'user',
    contenido: mensajeUsuario.trim(),
  });
  if (insertErr) return { ok: false, error: insertErr.message };

  // 2. Cargar historial completo (incluye el mensaje recién insertado).
  const { data: historial, error: histErr } = await supabase
    .from('chatbot_mensajes')
    .select('*')
    .eq('conversacion_id', conversacionId)
    .order('created_at', { ascending: true });
  if (histErr) return { ok: false, error: histErr.message };

  const messages: Anthropic.MessageParam[] = (historial ?? []).map((m) => ({
    role: m.rol as 'user' | 'assistant',
    content: m.contenido,
  }));

  const anthropic = getAnthropicClient();
  const allToolCalls: StoredAssistantMessage['tool_calls'] = [];
  const allToolResults: StoredAssistantMessage['tool_results'] = [];
  let finalText = '';

  // 3. Loop agéntico.
  try {
    for (let i = 0; i < MAX_AGENT_ITERATIONS; i++) {
      const response = await anthropic.messages.create({
        model: MODEL_CHATBOT,
        max_tokens: MAX_TOKENS_RESPONSE,
        system: CHATBOT_SYSTEM_PROMPT,
        // Cast: la versión instalada del SDK tipea TOOL_DEFINITIONS estricto;
        // las defs que pasamos cumplen el shape pero TypeScript pierde el match
        // por la inferencia readonly de `as const`.
        tools: TOOL_DEFINITIONS as never,
        thinking: { type: 'adaptive', display: 'summarized' },
        // top-level cache: cachea el prefijo (tools + system + history hasta el último turno).
        cache_control: { type: 'ephemeral' },
        output_config: { effort: 'xhigh' },
        messages,
      } as never);

      // ¿Hubo tool calls? Las ejecutamos y armamos la siguiente request.
      const toolUseBlocks = (response.content as Anthropic.ContentBlock[]).filter(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
      );

      if (response.stop_reason === 'tool_use' && toolUseBlocks.length > 0) {
        // Ejecutar todas las tools del turno en paralelo.
        const toolResults = await Promise.all(
          toolUseBlocks.map(async (b) => {
            allToolCalls.push({ id: b.id, name: b.name, input: b.input });
            const result = await executeTool(
              b.name,
              b.input as Record<string, unknown>,
              supabase,
            );
            allToolResults.push({ tool_use_id: b.id, result });
            return {
              type: 'tool_result' as const,
              tool_use_id: b.id,
              content: JSON.stringify(result),
            };
          }),
        );

        // Append assistant content + nuestros tool_results.
        messages.push({ role: 'assistant', content: response.content });
        messages.push({ role: 'user', content: toolResults });
        continue;
      }

      // end_turn (o cualquier otra terminación) → tomamos el texto final.
      const textBlock = (response.content as Anthropic.ContentBlock[]).find(
        (b): b is Anthropic.TextBlock => b.type === 'text',
      );
      finalText = textBlock?.text ?? '';
      break;
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error de la API.';
    console.error('[enviarMensaje] excepción:', e);
    return { ok: false, error: msg };
  }

  if (!finalText && allToolCalls.length === 0) {
    return {
      ok: false,
      error: 'El modelo no devolvió respuesta. Probá reformular el pedido.',
    };
  }

  if (!finalText) {
    finalText = '(El asistente consultó tools pero no devolvió texto.)';
  }

  // 4. Persistir el mensaje del assistant.
  const { error: assistantErr } = await supabase.from('chatbot_mensajes').insert({
    conversacion_id: conversacionId,
    rol: 'assistant',
    contenido: finalText,
    tool_calls: allToolCalls.length > 0 ? allToolCalls : null,
    tool_results: allToolResults.length > 0 ? allToolResults : null,
  });
  if (assistantErr) return { ok: false, error: assistantErr.message };

  // updated_at para ordenar la sidebar.
  await supabase
    .from('chatbot_conversaciones')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversacionId);

  // 5. Auto-título si es el primer turno.
  await autoGenerarTitulo(conversacionId, mensajeUsuario, supabase);

  revalidatePath(`/chatbot/${conversacionId}`);
  revalidatePath('/chatbot');

  return {
    ok: true,
    data: {
      mensaje: {
        text: finalText,
        tool_calls: allToolCalls,
        tool_results: allToolResults,
      },
    },
  };
}

async function autoGenerarTitulo(
  conversacionId: string,
  primerMensaje: string,
  supabase: ReturnType<typeof createClient>,
) {
  // Solo si no hay título todavía.
  const { data: conv } = await supabase
    .from('chatbot_conversaciones')
    .select('titulo')
    .eq('id', conversacionId)
    .single();
  if (conv?.titulo && conv.titulo.trim().length > 0) return;

  try {
    const anthropic = getAnthropicClient();
    const response = await anthropic.messages.create({
      model: MODEL_ANALISIS, // Sonnet — más barato para esta tarea trivial.
      max_tokens: 64,
      messages: [{ role: 'user', content: getTituloChatbotPrompt(primerMensaje) }],
    });
    const text = (response.content as Anthropic.ContentBlock[]).find(
      (b): b is Anthropic.TextBlock => b.type === 'text',
    )?.text;
    if (!text) return;

    // El modelo a veces agrega comillas o puntos — los limpiamos.
    const titulo = text.trim().replace(/^["'`]+|["'`.]+$/g, '').slice(0, 80);
    if (!titulo) return;

    await supabase
      .from('chatbot_conversaciones')
      .update({ titulo })
      .eq('id', conversacionId);
  } catch (e) {
    // Auto-título es nice-to-have. Si falla, ignoramos.
    console.error('[autoGenerarTitulo] falló:', e);
  }
}
