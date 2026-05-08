'use client';

import CountUp from 'react-countup';
import { Kicker } from '@/components/kicker';

/**
 * MetricCardV2 — card "Fluxx LLC" style.
 *
 * Estructura:
 *   <div .metric-card>
 *     <div .metric-card-glow />        ← glow absolute z-index -1
 *     <Kicker>{kicker}</Kicker>
 *     <div .metric-card-value>{value}</div>
 *     <p>{subtext}</p>
 *
 * Estilos viven en globals.css (@layer components) — más fácil de tunear.
 * Glow: opacity 0.6 default → 1 en hover. Transition 250ms.
 *
 * Number: JetBrains Mono 500, 56px, count-up al montar si es número.
 */
export function MetricCardV2({
  kicker,
  value,
  subtext,
}: {
  kicker: string;
  value: string | number;
  subtext?: string;
}) {
  const isNumeric = typeof value === 'number';

  return (
    <div className="metric-card flex flex-col justify-between">
      <div className="metric-card-glow" />
      <Kicker>{kicker}</Kicker>
      <div className="mt-6">
        <div className="metric-card-value">
          {isNumeric ? (
            <CountUp end={value as number} duration={1.0} useEasing preserveValue />
          ) : (
            value
          )}
        </div>
        {subtext && (
          <p className="mt-3 text-[13px] font-light text-text-dim">{subtext}</p>
        )}
      </div>
    </div>
  );
}
