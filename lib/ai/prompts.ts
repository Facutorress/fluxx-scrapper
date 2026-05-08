/**
 * Prompts y schemas para los flujos de IA de Fluxx.
 * - Analisis (Sonnet 4.6): single-shot, structured outputs.
 * - Chatbot (Opus 4.7): tool use loop con system prompt fijo (cacheable).
 */

import type { Estrategia } from '@/lib/database.types';

// ─── ANALISIS ───────────────────────────────────────────────────────────────

export type AnalisisResult = {
  sentiment: 'positivo' | 'neutral' | 'negativo';
  intencion_compra: 'alta' | 'media' | 'baja' | 'nula';
  objeciones: string[];
  temas_clave: string[];
  resumen: string;
};

/**
 * JSON schema for the analysis output. Used by the Sonnet 4.6 call via
 * output_config.format → guarantees the model returns valid structured JSON.
 */
export const ANALISIS_JSON_SCHEMA = {
  type: 'object',
  properties: {
    sentiment: {
      type: 'string',
      enum: ['positivo', 'neutral', 'negativo'],
      description: 'Sentimiento general del prospecto.',
    },
    intencion_compra: {
      type: 'string',
      enum: ['alta', 'media', 'baja', 'nula'],
      description: 'Probabilidad estimada de que compre.',
    },
    objeciones: {
      type: 'array',
      items: { type: 'string' },
      maxItems: 5,
      description:
        'Objeciones planteadas, frases cortas (ej "precio alto", "ya tiene proveedor").',
    },
    temas_clave: {
      type: 'array',
      items: { type: 'string' },
      maxItems: 5,
      description: 'Temas principales de la conversación.',
    },
    resumen: {
      type: 'string',
      description: '1-2 oraciones que resuman la conversación y el resultado.',
    },
  },
  required: ['sentiment', 'intencion_compra', 'objeciones', 'temas_clave', 'resumen'],
  additionalProperties: false,
} as const;

export function getAnalisisPrompt(
  transcripcion: string,
  estrategia: Pick<Estrategia, 'nombre' | 'descripcion'>,
): string {
  const desc = estrategia.descripcion?.trim() || '(sin descripción)';
  return `Sos un analista de ventas para Fluxx, una agencia de automatización con IA.
Te doy una transcripción de una conversación de prospección comercial con un dueño de gimnasio.
La estrategia usada fue: ${estrategia.nombre} — ${desc}

Tu tarea es analizar la conversación y devolver un JSON estricto con:

1. sentiment: el sentimiento general del prospecto.
2. intencion_compra: qué tan probable es que compre.
3. objeciones: las objeciones que planteó (máximo 5, frases cortas tipo "precio alto", "ya tiene proveedor").
4. temas_clave: los temas principales que se discutieron (máximo 5).
5. resumen: 1-2 oraciones que resuman la conversación y el resultado.

Transcripción:
---
${transcripcion}
---`;
}

// ─── CHATBOT ────────────────────────────────────────────────────────────────

/**
 * System prompt del chatbot. Es estable entre llamadas → cacheable.
 * El cache_control top-level de Anthropic lo hace prefix-cache automáticamente.
 */
export const CHATBOT_SYSTEM_PROMPT = `Sos el asistente de Fluxx, agencia de automatización con IA para pymes argentinas. Tu rol es ayudar a Franco y su socio a entender la data de prospección de gimnasios que tienen cargada en su sistema.

Tenés acceso a tools que consultan la base de datos:
- buscar_conversaciones: filtros por estrategia, gimnasio, sentiment, intencion_compra, fecha
- obtener_conversacion: detalle completo de una conversación (transcripción + análisis IA)
- obtener_metricas: counts agrupados (por estrategia, sentiment, tipo, ciudad, status)
- listar_estrategias: todas las estrategias activas con count de conversaciones
- obtener_gimnasio: detalle de un gimnasio + su conversación si tiene

Reglas:
1. Antes de inventar nada, USÁ las tools para obtener data real.
2. Si la pregunta es ambigua, pediles clarificación antes de buscar.
3. Cuando reportes datos, sé específico (números, nombres, no genérico).
4. Si una pregunta requiere razonamiento sobre múltiples conversaciones (ej "qué patrones hay"), usá obtener_conversacion en varias y comparalas.
5. Tono: directo, español rioplatense (vos, no tú). Profesional pero conversacional.
6. NO inventes data. Si la tool no devuelve nada, decílo.
7. Si te piden algo que no podés hacer (ej cambiar status, crear conversaciones), explicá que tu acceso es solo de lectura.

Limitaciones: solo lectura. No modificás conversaciones, gimnasios ni estrategias.`;

/**
 * Prompt mini para autogenerar el título de una conversación de chatbot
 * a partir del primer mensaje del usuario.
 */
export function getTituloChatbotPrompt(primerMensajeUsuario: string): string {
  return `Resumí el siguiente pedido del usuario en 4 a 6 palabras (sin comillas, sin punto final, en español rioplatense). Devolvé solo el título.

Pedido: ${primerMensajeUsuario}`;
}
