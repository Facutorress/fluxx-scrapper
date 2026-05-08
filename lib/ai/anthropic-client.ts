import Anthropic from '@anthropic-ai/sdk';

/**
 * Anthropic SDK singleton.
 * Lee ANTHROPIC_API_KEY del entorno automáticamente.
 *
 * Models por env (con fallback a los IDs validados):
 * - ANTHROPIC_MODEL_ANALISIS: claude-sonnet-4-6 (single-shot, structured)
 * - ANTHROPIC_MODEL_CHATBOT:  claude-opus-4-7  (tool use + adaptive thinking)
 */
let _client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (_client) return _client;
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY no está seteada. Pegá la key en .env.local.');
  }
  _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

export const MODEL_ANALISIS = process.env.ANTHROPIC_MODEL_ANALISIS ?? 'claude-sonnet-4-6';
export const MODEL_CHATBOT = process.env.ANTHROPIC_MODEL_CHATBOT ?? 'claude-opus-4-7';
