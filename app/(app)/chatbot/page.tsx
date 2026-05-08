import { Sparkles } from 'lucide-react';
import { ChatbotWelcome } from '@/components/chatbot-welcome';
import { Kicker } from '@/components/kicker';

export const dynamic = 'force-dynamic';

export default function ChatbotIndexPage() {
  return (
    <div className="panel-card flex h-full flex-col">
      <div className="border-b border-border px-6 py-4">
        <Kicker>ASISTENTE IA</Kicker>
        <h1 className="mt-1 font-display text-2xl text-text">
          Chatbot <span className="text-violet">·</span> Análisis
        </h1>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <Sparkles strokeWidth={1.25} className="h-12 w-12 text-violet" />
        <h2 className="mt-6 text-center font-sans text-lg font-semibold text-text">
          ¿En qué te ayudo hoy?
        </h2>
        <p className="mt-2 max-w-md text-center text-sm text-text-muted">
          Hago consultas a tu base de gimnasios y conversaciones. Tengo acceso de lectura
          a la data — no puedo editarla.
        </p>

        <ChatbotWelcome />
      </div>
    </div>
  );
}
