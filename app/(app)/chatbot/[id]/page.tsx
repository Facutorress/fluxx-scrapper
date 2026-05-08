import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ChatbotPanel } from '@/components/chatbot-panel';
import type { ChatbotMensaje } from '@/lib/database.types';

export const dynamic = 'force-dynamic';

export default async function ChatbotConversacionPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const [convResult, mensajesResult] = await Promise.all([
    supabase
      .from('chatbot_conversaciones')
      .select('id, titulo, created_at')
      .eq('id', params.id)
      .single(),
    supabase
      .from('chatbot_mensajes')
      .select('*')
      .eq('conversacion_id', params.id)
      .order('created_at', { ascending: true }),
  ]);

  if (convResult.error || !convResult.data) {
    notFound();
  }

  return (
    <ChatbotPanel
      conversacionId={params.id}
      titulo={convResult.data.titulo}
      mensajesIniciales={(mensajesResult.data ?? []) as ChatbotMensaje[]}
    />
  );
}
