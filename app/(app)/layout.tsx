import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAllowed } from '@/lib/auth';
import { Header } from '@/components/header';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // El middleware ya bloquea, pero esto es defense-in-depth — y si por alguna razón
  // el middleware no aplica (matcher excluye, env mal seteada, etc.) la página igual protege.
  if (!user || !isAllowed(user.email)) {
    redirect('/login');
  }

  return (
    <div className="relative min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
