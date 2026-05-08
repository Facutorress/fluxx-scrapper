'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * FadeInSection — wrapper para hacer entrar secciones del dashboard con
 * fade + slide-up sutil. Usar `index` para escalonar (stagger).
 *
 * delay total = index * 0.06s. Para cinco secciones: 0, 60, 120, 180, 240ms.
 * Duración: 400ms ease-out. Suficientemente perceptible sin distraer.
 */
export function FadeInSection({
  children,
  index = 0,
  className,
}: {
  children: ReactNode;
  index?: number;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: index * 0.06 }}
      className={className}
    >
      {children}
    </motion.section>
  );
}
