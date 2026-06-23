/**
 * Loader.tsx — Animated loading spinner
 */

import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export const Loader: React.FC<LoaderProps> = ({
  size = 'md',
  text,
  fullScreen = false,
  className,
}) => {
  const sizeMap = { sm: 24, md: 40, lg: 64 };
  const s = sizeMap[size];

  const spinner = (
    <div className={clsx('flex flex-col items-center gap-4', className)}>
      <div className="relative" style={{ width: s, height: s }}>
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary-500/20"
          style={{ width: s, height: s }}
        />
        {/* Spinning arc */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-t-primary-500 border-r-transparent border-b-transparent border-l-transparent"
          style={{ width: s, height: s }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
        />
        {/* Inner glow dot */}
        <motion.div
          className="absolute rounded-full bg-primary-500"
          style={{
            width: s * 0.25,
            height: s * 0.25,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
        />
      </div>
      {text && (
        <motion.p
          className="text-sm text-gray-400 font-medium"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-bg flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-6">
          <motion.div
            className="text-5xl"
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            🛸
          </motion.div>
          {spinner}
          {!text && (
            <p className="text-gray-500 text-sm">Initializing Chatter...</p>
          )}
        </div>
      </div>
    );
  }

  return spinner;
};
