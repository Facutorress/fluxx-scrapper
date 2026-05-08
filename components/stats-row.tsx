'use client';

import { useEffect, useState } from 'react';
import { Kicker } from '@/components/kicker';

/**
 * StatsRow — fila de stats secundarias.
 *
 * Cards con la misma visual base que MetricCardV2 (glow + gradient + border)
 * pero sin el value gigante: muestran un valor (string o número) + barra
 * de progreso pill violet→cyan animada al montar (0% → target en 800ms).
 *
 * Strings cortos (≤20 chars): DM Sans 600 28-32px.
 * Strings largos: DM Sans 600 24px + truncate.
 * Números: JetBrains Mono 500 32px (queda más "data").
 */
export type StatsRowData = {
  topTipo: { label: string; value: number; total: number } | null;
  topCiudad: { label: string; value: number; total: number } | null;
  totalContactados: { value: number; total: number };
};

export function StatsRow({ data }: { data: StatsRowData }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <StatCard
        kicker="TOP TIPO"
        value={data.topTipo?.label ?? '—'}
        valueKind="string"
        ratio={
          data.topTipo && data.topTipo.total > 0
            ? data.topTipo.value / data.topTipo.total
            : 0
        }
        subtext={
          data.topTipo
            ? `${data.topTipo.value} de ${data.topTipo.total} (${pct(data.topTipo.value, data.topTipo.total)}%)`
            : 'Sin datos'
        }
      />
      <StatCard
        kicker="TOP CIUDAD"
        value={data.topCiudad?.label ?? '—'}
        valueKind="string"
        ratio={
          data.topCiudad && data.topCiudad.total > 0
            ? data.topCiudad.value / data.topCiudad.total
            : 0
        }
        subtext={
          data.topCiudad
            ? `${data.topCiudad.value} de ${data.topCiudad.total} (${pct(data.topCiudad.value, data.topCiudad.total)}%)`
            : 'Sin datos'
        }
      />
      <StatCard
        kicker="CONTACTADOS"
        value={String(data.totalContactados.value)}
        valueKind="number"
        ratio={
          data.totalContactados.total > 0
            ? data.totalContactados.value / data.totalContactados.total
            : 0
        }
        subtext={
          data.totalContactados.total > 0
            ? `${pct(data.totalContactados.value, data.totalContactados.total)}% del total (${data.totalContactados.total})`
            : 'Sin datos'
        }
      />
    </div>
  );
}

function pct(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

const LONG_STRING_THRESHOLD = 20;

function StatCard({
  kicker,
  value,
  valueKind,
  ratio,
  subtext,
}: {
  kicker: string;
  value: string;
  valueKind: 'string' | 'number';
  ratio: number;
  subtext: string;
}) {
  const targetPct = Math.max(0, Math.min(1, ratio)) * 100;
  const isLong = valueKind === 'string' && value.length > LONG_STRING_THRESHOLD;

  // Animar el width de la barra de 0 → target al montar.
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(targetPct), 60);
    return () => clearTimeout(t);
  }, [targetPct]);

  const valueClass =
    valueKind === 'number'
      ? 'font-mono-data text-[32px]'
      : isLong
        ? 'font-sans text-2xl font-semibold'
        : 'font-sans text-[28px] font-semibold';

  return (
    <div className="metric-card">
      <div className="metric-card-glow" />
      <Kicker>{kicker}</Kicker>
      <p
        className={`mt-3 truncate leading-tight text-text ${valueClass}`}
        title={isLong ? value : undefined}
      >
        {value}
      </p>

      <div className="mt-5 stats-bar-track">
        <div className="stats-bar-fill" style={{ width: `${width}%` }} />
      </div>

      <p className="mt-3 text-xs font-light text-text-dim">{subtext}</p>
    </div>
  );
}
