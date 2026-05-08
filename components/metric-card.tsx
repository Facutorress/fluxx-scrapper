import { cn } from '@/lib/utils';

/**
 * MetricCard — la card "signature" de Fluxx.
 * Borde izquierdo violeta de 3px. Esquinas cuadradas. Número en JetBrains Mono.
 */
export function MetricCard({
  label,
  value,
  className,
}: {
  label: string;
  value: number | string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'border-l-[3px] border-l-violet bg-surface px-6 py-5',
        'border-y border-r border-border',
        className,
      )}
    >
      <div className="text-xs font-medium uppercase tracking-wider text-text-muted">
        {label}
      </div>
      <div className="mt-2 font-mono text-3xl font-medium text-text">{value}</div>
    </div>
  );
}
