import { cn } from '@/lib/utils';

/**
 * Skeleton — bloque base con pulse animado para loading states.
 * Usa el bg surface por default, igual que las cards reales — el pulse comunica "cargando".
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse bg-surface', className)}
      aria-hidden="true"
    />
  );
}

/**
 * SkeletonText — bloque de texto placeholder con varias líneas.
 */
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3"
          // Última línea más corta para que parezca natural.
        />
      ))}
    </div>
  );
}
