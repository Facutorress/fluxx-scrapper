/**
 * Tipos manuales del schema de Supabase para Fluxx Dashboard.
 * Mantener en sync con migrations en Supabase. No se generan con la CLI por ahora.
 */

export type StatusProspeccion =
  | 'no_contactado'
  | 'en_conversacion'
  | 'prospectado'
  | 'descartado';

export const STATUS_PROSPECCION_VALUES: StatusProspeccion[] = [
  'no_contactado',
  'en_conversacion',
  'prospectado',
  'descartado',
];

export const STATUS_PROSPECCION_LABELS: Record<StatusProspeccion, string> = {
  no_contactado: 'No contactado',
  en_conversacion: 'En conversación',
  prospectado: 'Prospectado',
  descartado: 'Descartado',
};

export const STATUS_ACTIVOS: StatusProspeccion[] = ['no_contactado', 'en_conversacion'];
export const STATUS_HISTORICO: StatusProspeccion[] = ['prospectado', 'descartado'];

export type Database = {
  public: {
    Tables: {
      gimnasios: {
        Row: {
          place_id: string;
          // Columnas que el scraper popula:
          nombre: string | null;
          tipo: string | null;
          ciudad: string | null;
          direccion: string | null;
          telefono: string | null;
          whatsapp_link: string | null;
          web: string | null;
          instagram: string | null;
          google_maps_url: string | null;
          rating: number | null;
          cantidad_reviews: number | null;
          lat: number | null;
          lng: number | null;
          fecha_scrapeo: string | null;
          // Columnas que maneja el dashboard:
          status_prospeccion: StatusProspeccion;
          fecha_ultimo_contacto: string | null;
          notas: string | null;
          // Trigger:
          updated_at: string;
        };
        Insert: {
          place_id: string;
          nombre?: string | null;
          tipo?: string | null;
          ciudad?: string | null;
          direccion?: string | null;
          telefono?: string | null;
          whatsapp_link?: string | null;
          web?: string | null;
          instagram?: string | null;
          google_maps_url?: string | null;
          rating?: number | null;
          cantidad_reviews?: number | null;
          lat?: number | null;
          lng?: number | null;
          fecha_scrapeo?: string | null;
          status_prospeccion?: StatusProspeccion;
          fecha_ultimo_contacto?: string | null;
          notas?: string | null;
          updated_at?: string;
        };
        Update: {
          place_id?: string;
          nombre?: string | null;
          tipo?: string | null;
          ciudad?: string | null;
          direccion?: string | null;
          telefono?: string | null;
          whatsapp_link?: string | null;
          web?: string | null;
          instagram?: string | null;
          google_maps_url?: string | null;
          rating?: number | null;
          cantidad_reviews?: number | null;
          lat?: number | null;
          lng?: number | null;
          fecha_scrapeo?: string | null;
          status_prospeccion?: StatusProspeccion;
          fecha_ultimo_contacto?: string | null;
          notas?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      estrategias: {
        Row: {
          id: string;
          nombre: string;
          descripcion: string | null;
          activa: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          descripcion?: string | null;
          activa?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          descripcion?: string | null;
          activa?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      conversaciones: {
        Row: {
          id: string;
          gimnasio_place_id: string;
          estrategia_id: string;
          transcripcion: string;
          fecha: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          gimnasio_place_id: string;
          estrategia_id: string;
          transcripcion: string;
          fecha?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          gimnasio_place_id?: string;
          estrategia_id?: string;
          transcripcion?: string;
          fecha?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'conversaciones_gimnasio_place_id_fkey';
            columns: ['gimnasio_place_id'];
            referencedRelation: 'gimnasios';
            referencedColumns: ['place_id'];
          },
          {
            foreignKeyName: 'conversaciones_estrategia_id_fkey';
            columns: ['estrategia_id'];
            referencedRelation: 'estrategias';
            referencedColumns: ['id'];
          },
        ];
      };
      analisis_ia: {
        Row: {
          id: string;
          conversacion_id: string;
          sentiment: 'positivo' | 'neutral' | 'negativo' | null;
          intencion_compra: 'alta' | 'media' | 'baja' | 'nula' | null;
          objeciones: string[] | null;
          temas_clave: string[] | null;
          resumen: string | null;
          raw_response: Record<string, unknown> | null;
          modelo_usado: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversacion_id: string;
          sentiment?: 'positivo' | 'neutral' | 'negativo' | null;
          intencion_compra?: 'alta' | 'media' | 'baja' | 'nula' | null;
          objeciones?: string[] | null;
          temas_clave?: string[] | null;
          resumen?: string | null;
          raw_response?: Record<string, unknown> | null;
          modelo_usado?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversacion_id?: string;
          sentiment?: 'positivo' | 'neutral' | 'negativo' | null;
          intencion_compra?: 'alta' | 'media' | 'baja' | 'nula' | null;
          objeciones?: string[] | null;
          temas_clave?: string[] | null;
          resumen?: string | null;
          raw_response?: Record<string, unknown> | null;
          modelo_usado?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'analisis_ia_conversacion_id_fkey';
            columns: ['conversacion_id'];
            referencedRelation: 'conversaciones';
            referencedColumns: ['id'];
          },
        ];
      };
      chatbot_conversaciones: {
        Row: {
          id: string;
          user_id: string;
          titulo: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          titulo?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          titulo?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      chatbot_mensajes: {
        Row: {
          id: string;
          conversacion_id: string;
          rol: 'user' | 'assistant';
          contenido: string;
          tool_calls: Record<string, unknown>[] | null;
          tool_results: Record<string, unknown>[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversacion_id: string;
          rol: 'user' | 'assistant';
          contenido: string;
          tool_calls?: Record<string, unknown>[] | null;
          tool_results?: Record<string, unknown>[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversacion_id?: string;
          rol?: 'user' | 'assistant';
          contenido?: string;
          tool_calls?: Record<string, unknown>[] | null;
          tool_results?: Record<string, unknown>[] | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'chatbot_mensajes_conversacion_id_fkey';
            columns: ['conversacion_id'];
            referencedRelation: 'chatbot_conversaciones';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Gimnasio = Database['public']['Tables']['gimnasios']['Row'];
export type GimnasioInsert = Database['public']['Tables']['gimnasios']['Insert'];
export type GimnasioUpdate = Database['public']['Tables']['gimnasios']['Update'];

export type Estrategia = Database['public']['Tables']['estrategias']['Row'];
export type EstrategiaInsert = Database['public']['Tables']['estrategias']['Insert'];
export type EstrategiaUpdate = Database['public']['Tables']['estrategias']['Update'];

export type Conversacion = Database['public']['Tables']['conversaciones']['Row'];
export type ConversacionInsert = Database['public']['Tables']['conversaciones']['Insert'];

export type AnalisisIA = Database['public']['Tables']['analisis_ia']['Row'];
export type AnalisisIAInsert = Database['public']['Tables']['analisis_ia']['Insert'];

export type ChatbotConversacion =
  Database['public']['Tables']['chatbot_conversaciones']['Row'];
export type ChatbotMensaje = Database['public']['Tables']['chatbot_mensajes']['Row'];
