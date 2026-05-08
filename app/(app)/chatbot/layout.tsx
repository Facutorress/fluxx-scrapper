import { createClient } from '@/lib/supabase/server';
import { ChatbotSidebar } from '@/components/chatbot-sidebar';

export const dynamic = 'force-dynamic';

export default async function ChatbotLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: conversaciones } = await supabase
    .from('chatbot_conversaciones')
    .select('id, titulo, updated_at')
    .order('updated_at', { ascending: false })
    .limit(50);

  return (
    <div className="grid h-[calc(100vh-60px-2rem)] grid-cols-[280px_1fr] gap-4">
      <ChatbotSidebar conversaciones={conversaciones ?? []} />
      <div className="flex min-w-0 flex-col">{children}</div>
    </div>
  );
}
