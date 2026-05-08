'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { crearConversacion, enviarMensaje } from '@/app/actions/chatbot';

const SUGERENCIAS = [
  '¿Cuáles son las objeciones más comunes en mis conversaciones?',
  'Resumime cómo viene cada estrategia este mes.',
  'Listame los gimnasios con intención de compra alta.',
  'Compará el sentiment entre las distintas estrategias.',
];

export function ChatbotWelcome() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick(prompt: string) {
    startTransition(async () => {
      const created = await crearConversacion();
      if (!created.ok) {
        toast.error(created.error);
        return;
      }
      // Disparamos el primer mensaje y redirigimos.
      router.push(`/chatbot/${created.data.id}`);
      // Fire-and-forget — el mensaje se va procesando mientras navegamos.
      // En la página /chatbot/[id] el cliente verá los mensajes via revalidate.
      void enviarMensaje(created.data.id, prompt);
    });
  }

  return (
    <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-3 md:grid-cols-2">
      {SUGERENCIAS.map((s) => (
        <button
          key={s}
          onClick={() => handleClick(s)}
          disabled={pending}
          className="group flex items-start justify-between gap-2 border border-border bg-bg px-4 py-3 text-left text-sm text-text-muted transition-colors duration-150 hover:border-border-strong hover:bg-overlay hover:text-text disabled:opacity-50 active:scale-[0.99]"
        >
          <span>{s}</span>
          <ArrowRight
            strokeWidth={1.5}
            className="mt-0.5 h-4 w-4 shrink-0 text-text-dim transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-violet"
          />
        </button>
      ))}
    </div>
  );
}
