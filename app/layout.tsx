import type { Metadata } from 'next';
import { Anton, DM_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/sonner';

const anton = Anton({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-anton',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Fluxx Dashboard',
  description: 'Dashboard interno de Fluxx para gestión de prospección',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={cn('dark', anton.variable, dmSans.variable, jetbrainsMono.variable)}
    >
      <body>
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          duration={4000}
          toastOptions={{
            unstyled: false,
            classNames: {
              toast:
                'group border border-border bg-overlay text-text font-sans !rounded-none !shadow-none',
              title: 'font-medium text-text',
              description: 'text-text-muted text-xs',
              success: 'border-l-[3px] border-l-green-live',
              error: 'border-l-[3px] border-l-destructive',
              info: 'border-l-[3px] border-l-violet',
              warning: 'border-l-[3px] border-l-cyan',
              actionButton: 'bg-violet text-text hover:bg-violet-deep',
              cancelButton: 'bg-transparent text-text-muted hover:text-text',
            },
          }}
        />
      </body>
    </html>
  );
}
