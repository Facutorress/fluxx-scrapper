'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/conversaciones', label: 'Conversaciones' },
  { href: '/estrategias', label: 'Estrategias' },
  { href: '/chatbot', label: 'Chatbot' },
];

/**
 * Nav inline: tabs horizontales para usar dentro del Header.
 */
export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {ITEMS.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'relative px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors',
              isActive ? 'text-text' : 'text-text-muted hover:text-text',
            )}
          >
            {item.label}
            {isActive && (
              <span className="absolute inset-x-3 bottom-0 h-[2px] bg-violet" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
