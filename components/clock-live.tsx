'use client';

import { useEffect, useState } from 'react';

const TIME_FMT = new Intl.DateTimeFormat('es-AR', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

const DATE_FMT = new Intl.DateTimeFormat('es-AR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

function format(now: Date) {
  // es-AR ya devuelve weekday en minúscula. Mantenemos lowercase consistente.
  return {
    time: TIME_FMT.format(now),
    date: DATE_FMT.format(now),
  };
}

/**
 * ClockLive — reloj sutil, lowercase.
 *
 * Layout:
 *   ● en vivo · 04:25 p. m.       ← dot cyan + halo, "en vivo" muted, hora en mono text
 *   viernes, 8 de mayo            ← --text-dim peso 400 12px lowercase
 *
 * El verde quedó liberado para success states.
 */
export function ClockLive() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) {
    return (
      <div className="flex flex-col items-end gap-1 text-right">
        <div className="h-[14px] w-44 bg-overlay" />
        <div className="h-[12px] w-56 bg-overlay" />
      </div>
    );
  }

  const { time, date } = format(now);

  return (
    <div className="flex flex-col items-end gap-1 text-right">
      <div className="flex items-center gap-2 text-xs lowercase tracking-wider">
        <span className="relative inline-block h-2 w-2" aria-hidden="true">
          <span className="absolute inset-0 animate-pulse-halo bg-cyan" />
          <span className="absolute inset-0 bg-cyan" />
        </span>
        <span className="font-medium text-text-muted">en vivo</span>
        <span className="text-violet" aria-hidden="true">
          ·
        </span>
        <span className="font-mono-data text-text">{time}</span>
      </div>
      <div className="text-[12px] font-normal lowercase text-text-dim">{date}</div>
    </div>
  );
}
