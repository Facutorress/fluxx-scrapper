'use client';

import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

export function LoginForm() {
  const [loading, setLoading] = useState(false);

  async function signInWithGoogle() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error('OAuth error:', error);
      setLoading(false);
    }
    // Si arrancó OK, el browser ya está navegando a Google — no reseteo loading.
  }

  return (
    <Button
      onClick={signInWithGoogle}
      disabled={loading}
      className="h-11 w-full bg-violet font-medium text-text hover:bg-violet-deep disabled:opacity-60"
    >
      <LogIn strokeWidth={1.5} className="mr-2 h-4 w-4" />
      {loading ? 'Redirigiendo…' : 'Iniciar sesión con Google'}
    </Button>
  );
}
