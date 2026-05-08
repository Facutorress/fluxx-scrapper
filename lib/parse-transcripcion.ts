/**
 * Parser de transcripciones de conversaciones de WhatsApp.
 *
 * Formatos soportados (matching case-insensitive):
 *   - "Yo: texto"        → out
 *   - "Yo - texto"       → out
 *   - "Vos: texto"       → out
 *   - "Usuario: texto"   → out
 *   - "User: texto"      → out
 *   - "Ellos: texto"     → in
 *   - "Cliente: texto"   → in
 *   - "Gimnasio: texto"  → in
 *   - "Bot: texto"       → in
 *
 * Timestamp opcional al inicio: `[HH:MM]` o `HH:MM` antes del speaker.
 * Líneas sin prefijo de speaker se appendean al último mensaje (multi-línea).
 *
 * Si NO se detecta ningún prefijo en toda la transcripción → fallback con
 * el texto crudo, para mostrar como bloque único en la UI.
 */

export type ParsedMessage = {
  side: 'out' | 'in';
  speaker: string;
  text: string;
  time: string | null;
};

export type ParseResult =
  | { kind: 'parsed'; messages: ParsedMessage[]; durationMinutes: number | null }
  | { kind: 'fallback'; text: string };

const OUT_SPEAKERS = ['Yo', 'Vos', 'User', 'Usuario'];
const IN_SPEAKERS = ['Ellos', 'Cliente', 'Gimnasio', 'Bot'];

// Timestamp opcional: [12:25] o 12:25 al inicio.
// Speaker: una de las palabras conocidas.
// Separador: ":" o " - " (con espacios variables).
function buildSpeakerRegex(speakers: string[]): RegExp {
  const speakerAlt = speakers.join('|');
  return new RegExp(
    `^(?:\\[?(\\d{1,2}:\\d{2})\\]?\\s+)?(?:(${speakerAlt}))\\s*(?::|-)\\s*(.*)$`,
    'i',
  );
}

const OUT_RE = buildSpeakerRegex(OUT_SPEAKERS);
const IN_RE = buildSpeakerRegex(IN_SPEAKERS);

export function parseTranscripcion(raw: string): ParseResult {
  const lines = raw.split(/\r?\n/);
  const messages: ParsedMessage[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const outMatch = OUT_RE.exec(line);
    if (outMatch) {
      messages.push({
        side: 'out',
        speaker: outMatch[2],
        time: outMatch[1] ?? null,
        text: outMatch[3].trim(),
      });
      continue;
    }

    const inMatch = IN_RE.exec(line);
    if (inMatch) {
      messages.push({
        side: 'in',
        speaker: inMatch[2],
        time: inMatch[1] ?? null,
        text: inMatch[3].trim(),
      });
      continue;
    }

    // Línea sin prefijo: append al último mensaje (continuación multi-línea).
    const last = messages[messages.length - 1];
    if (last) {
      last.text = `${last.text}\n${line}`.trim();
    }
    // Si no hay mensaje previo, ignoramos la línea (suele ser preámbulo).
  }

  if (messages.length === 0) {
    return { kind: 'fallback', text: raw.trim() };
  }

  // Duración estimada: diff entre primer y último timestamp si los hay.
  const durationMinutes = computeDuration(messages);

  return { kind: 'parsed', messages, durationMinutes };
}

function computeDuration(messages: ParsedMessage[]): number | null {
  const withTime = messages.filter((m) => m.time);
  if (withTime.length < 2) return null;
  const firstTime = withTime[0].time;
  const lastTime = withTime[withTime.length - 1].time;
  if (!firstTime || !lastTime) return null;

  const toMinutes = (hhmm: string): number | null => {
    const [h, m] = hhmm.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
  };

  const a = toMinutes(firstTime);
  const b = toMinutes(lastTime);
  if (a === null || b === null) return null;

  // Si la conversación cruza medianoche, b < a → asumimos +24h.
  const diff = b - a;
  return diff < 0 ? diff + 24 * 60 : diff;
}
