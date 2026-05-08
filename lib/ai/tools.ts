/**
 * Tools del chatbot — definiciones para Anthropic + handlers contra Supabase.
 *
 * Pattern: cada tool exporta su definition (la que se manda a la API) y su
 * handler (la función que la ejecuta cuando Claude la invoca). El loop del
 * chatbot itera sobre tool_use blocks y dispatch por nombre.
 *
 * Las tools son TODAS de lectura — la RLS asegura que solo se accede a data
 * del usuario logueado (cliente Supabase con cookies de sesión).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, StatusProspeccion } from '@/lib/database.types';

type DB = SupabaseClient<Database>;

// ─── Definitions enviadas a Claude ──────────────────────────────────────────

export const TOOL_DEFINITIONS = [
  {
    name: 'buscar_conversaciones',
    description:
      'Busca conversaciones aplicando filtros opcionales. Devuelve hasta 50 resultados con datos básicos + análisis IA. Útil para preguntas como "qué conversaciones tuve con la estrategia X" o "dame las que terminaron en sentiment negativo".',
    input_schema: {
      type: 'object',
      properties: {
        estrategia_nombre: {
          type: 'string',
          description: 'Filtra por nombre exacto de estrategia.',
        },
        gimnasio_nombre: {
          type: 'string',
          description: 'Filtra por nombre del gimnasio (match parcial, case-insensitive).',
        },
        sentiment: {
          type: 'string',
          enum: ['positivo', 'neutral', 'negativo'],
          description: 'Filtra por sentiment del análisis IA.',
        },
        intencion_compra: {
          type: 'string',
          enum: ['alta', 'media', 'baja', 'nula'],
          description: 'Filtra por intención de compra del análisis IA.',
        },
        fecha_desde: {
          type: 'string',
          description: 'Fecha mínima ISO (YYYY-MM-DD).',
        },
        fecha_hasta: {
          type: 'string',
          description: 'Fecha máxima ISO (YYYY-MM-DD).',
        },
      },
      required: [],
    },
  },
  {
    name: 'obtener_conversacion',
    description:
      'Devuelve el detalle completo de UNA conversación: transcripción + análisis IA + datos del gimnasio + estrategia. Usar cuando hace falta razonar sobre el contenido.',
    input_schema: {
      type: 'object',
      properties: {
        conversacion_id: {
          type: 'string',
          description: 'UUID de la conversación.',
        },
      },
      required: ['conversacion_id'],
    },
  },
  {
    name: 'obtener_metricas',
    description:
      'Counts agrupados por la dimensión pedida. Útil para "cuántos prospectos hay en cada ciudad" o "cuál estrategia tiene más conversaciones".',
    input_schema: {
      type: 'object',
      properties: {
        agrupar_por: {
          type: 'string',
          enum: ['estrategia', 'sentiment', 'tipo_gimnasio', 'ciudad', 'status_prospeccion'],
          description: 'Dimensión por la que agrupar.',
        },
      },
      required: ['agrupar_por'],
    },
  },
  {
    name: 'listar_estrategias',
    description:
      'Devuelve todas las estrategias activas con descripción y count de conversaciones cargadas con cada una.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'obtener_gimnasio',
    description:
      'Devuelve datos completos de UN gimnasio + su conversación si tiene + análisis. Búsqueda por place_id exacto o nombre (match parcial).',
    input_schema: {
      type: 'object',
      properties: {
        nombre_gimnasio: {
          type: 'string',
          description: 'Match parcial case-insensitive sobre nombre.',
        },
        place_id: {
          type: 'string',
          description: 'place_id de Google Places exacto.',
        },
      },
      required: [],
    },
  },
] as const;

// ─── Handlers ───────────────────────────────────────────────────────────────

type BuscarConvInput = {
  estrategia_nombre?: string;
  gimnasio_nombre?: string;
  sentiment?: 'positivo' | 'neutral' | 'negativo';
  intencion_compra?: 'alta' | 'media' | 'baja' | 'nula';
  fecha_desde?: string;
  fecha_hasta?: string;
};

async function buscarConversaciones(input: BuscarConvInput, supabase: DB) {
  let query = supabase
    .from('conversaciones')
    .select(
      `
      id, fecha, transcripcion,
      gimnasios:gimnasio_place_id (place_id, nombre, ciudad, tipo),
      estrategias:estrategia_id (id, nombre),
      analisis_ia (sentiment, intencion_compra, objeciones, temas_clave, resumen)
      `,
    )
    .order('fecha', { ascending: false })
    .limit(50);

  if (input.fecha_desde) query = query.gte('fecha', input.fecha_desde);
  if (input.fecha_hasta) query = query.lte('fecha', input.fecha_hasta);

  const { data, error } = await query;
  if (error) return { error: error.message };

  // Filtros que requieren post-processing (joins).
  let rows = data ?? [];

  if (input.estrategia_nombre) {
    const needle = input.estrategia_nombre.toLowerCase();
    rows = rows.filter((r) => {
      const e = (r as { estrategias: { nombre: string } | null }).estrategias;
      return e?.nombre?.toLowerCase() === needle;
    });
  }
  if (input.gimnasio_nombre) {
    const needle = input.gimnasio_nombre.toLowerCase();
    rows = rows.filter((r) => {
      const g = (r as { gimnasios: { nombre: string | null } | null }).gimnasios;
      return g?.nombre?.toLowerCase().includes(needle);
    });
  }
  if (input.sentiment) {
    rows = rows.filter((r) => {
      const a = (r as { analisis_ia: { sentiment: string | null }[] | null }).analisis_ia;
      return a && a[0]?.sentiment === input.sentiment;
    });
  }
  if (input.intencion_compra) {
    rows = rows.filter((r) => {
      const a = (r as { analisis_ia: { intencion_compra: string | null }[] | null })
        .analisis_ia;
      return a && a[0]?.intencion_compra === input.intencion_compra;
    });
  }

  // Truncamos transcripciones a 200 chars para no inflar el contexto del modelo.
  const compact = rows.map((r) => {
    const row = r as {
      id: string;
      fecha: string;
      transcripcion: string;
      gimnasios: unknown;
      estrategias: unknown;
      analisis_ia: unknown[];
    };
    return {
      id: row.id,
      fecha: row.fecha,
      transcripcion_preview: row.transcripcion.slice(0, 200),
      gimnasio: row.gimnasios,
      estrategia: row.estrategias,
      analisis: Array.isArray(row.analisis_ia) ? row.analisis_ia[0] ?? null : null,
    };
  });

  return { count: compact.length, conversaciones: compact };
}

async function obtenerConversacion(input: { conversacion_id: string }, supabase: DB) {
  const { data, error } = await supabase
    .from('conversaciones')
    .select(
      `
      id, fecha, transcripcion, created_at,
      gimnasios:gimnasio_place_id (place_id, nombre, ciudad, tipo, direccion, telefono, web, rating, cantidad_reviews, status_prospeccion, notas),
      estrategias:estrategia_id (id, nombre, descripcion),
      analisis_ia (sentiment, intencion_compra, objeciones, temas_clave, resumen, modelo_usado, created_at)
      `,
    )
    .eq('id', input.conversacion_id)
    .single();

  if (error) return { error: error.message };
  return { conversacion: data };
}

type AgruparPor =
  | 'estrategia'
  | 'sentiment'
  | 'tipo_gimnasio'
  | 'ciudad'
  | 'status_prospeccion';

async function obtenerMetricas(input: { agrupar_por: AgruparPor }, supabase: DB) {
  switch (input.agrupar_por) {
    case 'status_prospeccion': {
      const { data, error } = await supabase
        .from('gimnasios')
        .select('status_prospeccion');
      if (error) return { error: error.message };
      return { agrupado_por: 'status_prospeccion', counts: countBy(data, 'status_prospeccion') };
    }
    case 'tipo_gimnasio': {
      const { data, error } = await supabase.from('gimnasios').select('tipo');
      if (error) return { error: error.message };
      return { agrupado_por: 'tipo_gimnasio', counts: countBy(data, 'tipo') };
    }
    case 'ciudad': {
      const { data, error } = await supabase.from('gimnasios').select('ciudad');
      if (error) return { error: error.message };
      return { agrupado_por: 'ciudad', counts: countBy(data, 'ciudad') };
    }
    case 'estrategia': {
      const { data, error } = await supabase
        .from('conversaciones')
        .select('estrategia_id, estrategias:estrategia_id (nombre)');
      if (error) return { error: error.message };
      const counts = new Map<string, number>();
      for (const r of data ?? []) {
        const nombre =
          (r as { estrategias: { nombre: string } | null }).estrategias?.nombre ??
          '(sin estrategia)';
        counts.set(nombre, (counts.get(nombre) ?? 0) + 1);
      }
      return {
        agrupado_por: 'estrategia',
        counts: Array.from(counts.entries()).map(([k, v]) => ({ valor: k, count: v })),
      };
    }
    case 'sentiment': {
      const { data, error } = await supabase.from('analisis_ia').select('sentiment');
      if (error) return { error: error.message };
      return { agrupado_por: 'sentiment', counts: countBy(data, 'sentiment') };
    }
  }
}

function countBy<T extends Record<string, unknown>>(
  rows: T[] | null,
  key: keyof T,
): { valor: string; count: number }[] {
  const m = new Map<string, number>();
  for (const r of rows ?? []) {
    const v = String(r[key] ?? '(sin valor)');
    m.set(v, (m.get(v) ?? 0) + 1);
  }
  return Array.from(m.entries()).map(([valor, count]) => ({ valor, count }));
}

async function listarEstrategias(_input: Record<string, never>, supabase: DB) {
  const [estrategiasResult, conversacionesResult] = await Promise.all([
    supabase.from('estrategias').select('*').eq('activa', true).order('nombre'),
    supabase.from('conversaciones').select('estrategia_id'),
  ]);
  if (estrategiasResult.error) return { error: estrategiasResult.error.message };
  if (conversacionesResult.error) return { error: conversacionesResult.error.message };

  const counts = new Map<string, number>();
  for (const c of conversacionesResult.data ?? []) {
    counts.set(c.estrategia_id, (counts.get(c.estrategia_id) ?? 0) + 1);
  }

  return {
    estrategias: (estrategiasResult.data ?? []).map((e) => ({
      id: e.id,
      nombre: e.nombre,
      descripcion: e.descripcion,
      conversaciones_count: counts.get(e.id) ?? 0,
    })),
  };
}

type GimnasioInput = { nombre_gimnasio?: string; place_id?: string };

async function obtenerGimnasio(input: GimnasioInput, supabase: DB) {
  if (!input.place_id && !input.nombre_gimnasio) {
    return { error: 'Pasá place_id o nombre_gimnasio.' };
  }

  let query = supabase.from('gimnasios').select('*');
  if (input.place_id) {
    query = query.eq('place_id', input.place_id);
  } else if (input.nombre_gimnasio) {
    query = query.ilike('nombre', `%${input.nombre_gimnasio}%`).limit(5);
  }

  const { data, error } = await query;
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: 'No encontré ningún gimnasio.' };

  // Si hay múltiples matches, devolvemos la lista resumida.
  if (data.length > 1) {
    return {
      multiple_matches: data.map((g) => ({
        place_id: g.place_id,
        nombre: g.nombre,
        ciudad: g.ciudad,
        status_prospeccion: g.status_prospeccion,
      })),
      hint: 'Pedile al usuario que precise cuál, o usá el place_id exacto.',
    };
  }

  // Match único: agregar conversación + análisis si tiene.
  const gimnasio = data[0];
  const { data: conv } = await supabase
    .from('conversaciones')
    .select(
      `id, fecha, transcripcion, estrategias:estrategia_id (nombre), analisis_ia (sentiment, intencion_compra, objeciones, temas_clave, resumen)`,
    )
    .eq('gimnasio_place_id', gimnasio.place_id)
    .maybeSingle();

  return {
    gimnasio,
    conversacion: conv ?? null,
  };
}

// ─── Dispatch ───────────────────────────────────────────────────────────────

type ToolInput = Record<string, unknown>;
type ToolResult = unknown;

export async function executeTool(
  name: string,
  input: ToolInput,
  supabase: DB,
): Promise<ToolResult> {
  switch (name) {
    case 'buscar_conversaciones':
      return buscarConversaciones(input as BuscarConvInput, supabase);
    case 'obtener_conversacion':
      return obtenerConversacion(input as { conversacion_id: string }, supabase);
    case 'obtener_metricas':
      return obtenerMetricas(input as { agrupar_por: AgruparPor }, supabase);
    case 'listar_estrategias':
      return listarEstrategias(input as Record<string, never>, supabase);
    case 'obtener_gimnasio':
      return obtenerGimnasio(input as GimnasioInput, supabase);
    default:
      return { error: `Tool desconocida: ${name}` };
  }
}

// Re-export para tipos en otros módulos
export type { StatusProspeccion };
