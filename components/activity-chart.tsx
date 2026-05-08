'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Kicker } from '@/components/kicker';

export type ActivityPoint = {
  fecha: string; // ISO date "YYYY-MM-DD"
  en_conversacion: number;
  prospectado: number;
};

const VIOLET = '#6c63ff';
const CYAN = '#00c2ff';
const TEXT_DIM = '#55556e';
const TEXT_MUTED = '#8888a0';

export function ActivityChart({ data }: { data: ActivityPoint[] }) {
  const chartData = useMemo(
    () => data.map((d) => ({ ...d, label: formatDayLabel(d.fecha) })),
    [data],
  );

  // Y-axis: solo 3 ticks (0, mid, max). Si max es 0 mostramos un dominio chico
  // para que no se vea solo "0" colapsado.
  const maxValue = useMemo(() => {
    const vals = data.flatMap((d) => [d.en_conversacion, d.prospectado]);
    const m = Math.max(0, ...vals);
    return m === 0 ? 1 : m;
  }, [data]);
  const ticks = [0, Math.round(maxValue / 2), maxValue];

  return (
    <div className="panel-card">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <Kicker>ACTIVIDAD 14 DÍAS</Kicker>
        <div className="flex items-center gap-4 text-[11px] font-medium uppercase tracking-wider text-text-muted">
          <span className="flex items-center gap-1.5">
            <span
              className="block h-2.5 w-2.5 rounded-sm"
              style={{ background: CYAN }}
              aria-hidden="true"
            />
            En conversación
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="block h-2.5 w-2.5 rounded-sm"
              style={{ background: VIOLET }}
              aria-hidden="true"
            />
            Prospectado
          </span>
        </div>
      </div>

      <div className="px-3 py-5">
        <p className="px-3 pb-3 text-[10px] uppercase tracking-[0.2em] text-text-dim">
          Cambios de status / día
        </p>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 12, bottom: 8, left: -8 }}
              barCategoryGap={20}
              barGap={3}
            >
              <XAxis
                dataKey="label"
                stroke={TEXT_DIM}
                tickLine={false}
                axisLine={{ stroke: TEXT_DIM, strokeWidth: 1 }}
                tick={{
                  fontSize: 10,
                  fill: TEXT_MUTED,
                  fontFamily: 'var(--font-jetbrains-mono)',
                }}
                interval={0}
              />
              <YAxis
                ticks={ticks}
                allowDecimals={false}
                stroke={TEXT_DIM}
                tickLine={false}
                axisLine={false}
                tick={{
                  fontSize: 10,
                  fill: TEXT_MUTED,
                  fontFamily: 'var(--font-jetbrains-mono)',
                }}
                width={32}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                contentStyle={{
                  background:
                    'linear-gradient(145deg, rgba(22,22,31,0.98), rgba(17,17,24,0.98))',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 4,
                  fontFamily: 'var(--font-dm-sans)',
                  fontSize: 12,
                  color: 'var(--text)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  padding: '8px 12px',
                }}
                labelStyle={{
                  color: 'var(--text-dim)',
                  fontFamily: 'var(--font-jetbrains-mono)',
                  fontSize: 11,
                  marginBottom: 4,
                }}
                itemStyle={{ color: 'var(--text)' }}
                formatter={(value, name) => [
                  value as number,
                  name === 'en_conversacion' ? 'En conversación' : 'Prospectado',
                ]}
              />
              <Bar
                dataKey="en_conversacion"
                fill={CYAN}
                radius={[2, 2, 0, 0]}
                maxBarSize={14}
              />
              <Bar
                dataKey="prospectado"
                fill={VIOLET}
                radius={[2, 2, 0, 0]}
                maxBarSize={14}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

/**
 * "2026-05-08" → "08/05"
 */
function formatDayLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}
