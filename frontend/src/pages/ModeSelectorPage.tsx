/**
 * ModeSelectorPage.tsx — Choose Online / LoRa / Hybrid after login
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wifi, Radio, Zap, ArrowRight, CheckCircle } from 'lucide-react';
import { ParticleBackground } from '../components/common/ParticleBackground';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { clsx } from 'clsx';
import type { CommunicationMode } from '../types';

const MODES = [
  {
    id: 'online' as CommunicationMode,
    label: 'Online Network',
    description: 'Real-time messaging over the internet using Socket.IO. Full features including message history, read receipts, and media sharing.',
    icon: <Wifi size={32} />,
    color: 'from-green-500/20 to-green-500/5',
    border: 'border-green-500/30',
    iconColor: 'text-success',
    glow: 'hover:shadow-[0_0_30px_rgba(34,197,94,0.2)]',
    badge: '🟢',
    features: ['Real-time delivery', 'Message history', 'Read receipts', 'Typing indicators'],
  },
  {
    id: 'lora' as CommunicationMode,
    label: 'LoRa Network',
    description: 'Long-range radio communication using SX1278 LoRa module. Works without internet — perfect for remote areas or field deployments.',
    icon: <Radio size={32} />,
    color: 'from-cyan-500/20 to-cyan-500/5',
    border: 'border-cyan-500/30',
    iconColor: 'text-accent',
    glow: 'hover:shadow-[0_0_30px_rgba(0,229,255,0.2)]',
    badge: '📡',
    features: ['No internet needed', 'Up to 10km range', 'ACK confirmation', 'RSSI monitoring'],
  },
  {
    id: 'hybrid' as CommunicationMode,
    label: 'Hybrid Mode',
    description: 'Automatically switches between internet and LoRa based on availability. Best for reliability in unpredictable environments.',
    icon: <Zap size={32} />,
    color: 'from-amber-500/20 to-amber-500/5',
    border: 'border-amber-500/30',
    iconColor: 'text-warning',
    glow: 'hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]',
    badge: '⚡',
    features: ['Auto-switching', 'Best reliability', 'Fallback support', 'Mode indicator'],
  },
];

export const ModeSelectorPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, mode, setMode } = useAuthStore();
  const { loraConnected } = useUIStore();

  const handleSelect = (selectedMode: CommunicationMode) => {
    setMode(selectedMode);
    navigate('/chat');
  };

  return (
    <div className="min-h-screen bg-mesh flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <ParticleBackground />

      {/* Glow orbs */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-5xl">🛸</span>
          </div>
          <h1 className="text-4xl font-display font-bold text-white mb-2">
            Welcome, <span className="gradient-text">{user?.displayName || user?.username}</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Choose your communication mode to get started
          </p>
        </motion.div>

        {/* Mode cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {MODES.map((m, idx) => {
            const isSelected = mode === m.id;
            const isLoraUnavailable = m.id === 'lora' && !loraConnected;

            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.12, duration: 0.5, ease: 'easeOut' }}
                onClick={() => handleSelect(m.id)}
                className={clsx(
                  'relative cursor-pointer rounded-2xl p-6 border transition-all duration-300',
                  `bg-gradient-to-br ${m.color}`,
                  m.border,
                  m.glow,
                  isSelected && 'ring-2 ring-primary-500 scale-[1.02]',
                  'hover:scale-[1.02]'
                )}
              >
                {/* Selected badge */}
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <CheckCircle size={20} className="text-primary-400" />
                  </div>
                )}

                {/* LoRa disconnected warning */}
                {isLoraUnavailable && (
                  <div className="absolute top-4 right-4 text-xs text-danger bg-danger/10 border border-danger/20 rounded-full px-2 py-0.5">
                    Disconnected
                  </div>
                )}

                {/* Icon */}
                <div className={clsx('mb-4', m.iconColor)}>
                  {m.icon}
                </div>

                <h3 className="text-xl font-display font-semibold text-white mb-2">
                  {m.badge} {m.label}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">
                  {m.description}
                </p>

                {/* Features */}
                <ul className="space-y-1.5 mb-5">
                  {m.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="w-1 h-1 rounded-full bg-primary-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className={clsx(
                  'flex items-center gap-2 text-sm font-medium transition-colors',
                  m.iconColor
                )}>
                  <span>Select {m.label}</span>
                  <ArrowRight size={16} />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Current selection hint */}
        {mode && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-gray-600 text-sm"
          >
            Current mode: <span className="text-primary-400 font-medium">{mode}</span> — you can switch anytime from the sidebar
          </motion.p>
        )}
      </div>
    </div>
  );
};
