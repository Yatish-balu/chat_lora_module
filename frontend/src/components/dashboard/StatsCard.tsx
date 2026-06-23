/**
 * StatsCard.tsx — Animated stat card for dashboard
 */

import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  color?: 'primary' | 'accent' | 'success' | 'warning' | 'danger';
  delay?: number;
}

const colorMap = {
  primary: {
    bg: 'bg-primary-500/10',
    border: 'border-primary-500/20',
    icon: 'text-primary-400',
    glow: 'shadow-neon-sm',
  },
  accent: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    icon: 'text-cyan-400',
    glow: 'shadow-[0_0_10px_rgba(0,229,255,0.2)]',
  },
  success: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    icon: 'text-green-400',
    glow: 'shadow-[0_0_10px_rgba(34,197,94,0.2)]',
  },
  warning: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    icon: 'text-amber-400',
    glow: 'shadow-[0_0_10px_rgba(245,158,11,0.2)]',
  },
  danger: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    icon: 'text-red-400',
    glow: '',
  },
};

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  trend,
  trendUp,
  color = 'primary',
  delay = 0,
}) => {
  const c = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      className={clsx(
        'glass-card rounded-2xl p-5 border transition-all duration-300',
        'hover:scale-[1.02] hover:border-primary-500/30',
        c.border,
        c.glow
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={clsx('p-2.5 rounded-xl', c.bg)}>
          <span className={c.icon}>{icon}</span>
        </div>
        {trend && (
          <span
            className={clsx(
              'text-xs font-medium px-2 py-0.5 rounded-full',
              trendUp ? 'text-success bg-success/10' : 'text-danger bg-danger/10'
            )}
          >
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>

      <motion.p
        className="text-3xl font-display font-bold text-white mb-1"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: delay + 0.1, type: 'spring', stiffness: 200 }}
      >
        {value}
      </motion.p>
      <p className="text-sm text-gray-500">{title}</p>
    </motion.div>
  );
};
