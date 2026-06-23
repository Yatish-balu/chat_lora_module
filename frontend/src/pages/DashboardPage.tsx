/**
 * DashboardPage.tsx — System overview and stats
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, MessageSquare, CheckCheck, Eye, Radio, Wifi, Zap,
  ArrowLeft, Activity, Signal, Clock,
} from 'lucide-react';
import { ParticleBackground } from '../components/common/ParticleBackground';
import { StatsCard } from '../components/dashboard/StatsCard';
import { Avatar } from '../components/common/Avatar';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { useUIStore } from '../store/uiStore';
import { loraApi } from '../services/api';
import { clsx } from 'clsx';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, mode } = useAuthStore();
  const { onlineUsers, chats, messages } = useChatStore();
  const { loraStatus, loraConnected, dashboardStats } = useUIStore();
  const [loraInfo, setLoraInfo] = useState<any>(null);

  useEffect(() => {
    loraApi.getStatus().then(setLoraInfo).catch(() => {});
  }, []);

  // Compute real stats from store
  const totalMessages = Object.values(messages).reduce((acc, arr) => acc + arr.length, 0);
  const sentMessages = Object.values(messages)
    .flat()
    .filter((m) => ['sent', 'delivered', 'read'].includes(m.status)).length;
  const deliveredMessages = Object.values(messages)
    .flat()
    .filter((m) => ['delivered', 'read'].includes(m.status)).length;
  const readMessages = Object.values(messages)
    .flat()
    .filter((m) => m.status === 'read').length;
  const loraMessages = Object.values(messages)
    .flat()
    .filter((m) => m.mode === 'lora').length;

  const modeInfo = {
    online: { label: 'Online Mode', icon: <Wifi size={20} />, color: 'text-success', bg: 'bg-success/10', border: 'border-success/20' },
    lora: { label: 'LoRa Mode', icon: <Radio size={20} />, color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20' },
    hybrid: { label: 'Hybrid Mode', icon: <Zap size={20} />, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' },
  }[mode];

  return (
    <div className="min-h-screen bg-mesh relative overflow-hidden">
      <ParticleBackground />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/chat')}
              className="btn-icon"
              title="Back to chat"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
                🛸 Dashboard
              </h1>
              <p className="text-gray-500 text-sm">Chatter — System Overview</p>
            </div>
          </div>

          {/* Current mode indicator */}
          <div className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium',
            modeInfo.bg, modeInfo.border, modeInfo.color
          )}>
            {modeInfo.icon}
            {modeInfo.label}
          </div>
        </motion.div>

        {/* User welcome */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-6 mb-6 border border-primary-500/20 flex items-center gap-4"
        >
          <Avatar src={user?.avatar} username={user?.username || ''} size="lg" status={user?.status} showStatus />
          <div>
            <h2 className="text-xl font-display font-semibold text-white">
              {user?.displayName || user?.username}
            </h2>
            <p className="text-gray-400 text-sm">@{user?.username} · {user?.email}</p>
            <p className="text-gray-600 text-xs mt-1">
              Member since {new Date(user?.createdAt || '').toLocaleDateString()}
            </p>
          </div>
          <div className="ml-auto text-right">
            <div className="text-xs text-gray-600 mb-1">Preferred Mode</div>
            <div className={clsx('text-sm font-semibold', modeInfo.color)}>{modeInfo.label}</div>
          </div>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="Online Users"
            value={onlineUsers.length}
            icon={<Users size={20} />}
            color="success"
            delay={0.15}
          />
          <StatsCard
            title="Active Chats"
            value={chats.length}
            icon={<MessageSquare size={20} />}
            color="primary"
            delay={0.2}
          />
          <StatsCard
            title="Messages Sent"
            value={sentMessages}
            icon={<Activity size={20} />}
            color="primary"
            delay={0.25}
          />
          <StatsCard
            title="LoRa Messages"
            value={loraMessages}
            icon={<Radio size={20} />}
            color="accent"
            delay={0.3}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <StatsCard
            title="Delivered ✓✓"
            value={deliveredMessages}
            icon={<CheckCheck size={20} />}
            color="success"
            delay={0.35}
          />
          <StatsCard
            title="Read ✓✓ Blue"
            value={readMessages}
            icon={<Eye size={20} />}
            color="accent"
            delay={0.4}
          />
          <StatsCard
            title="Total Messages"
            value={totalMessages}
            icon={<MessageSquare size={20} />}
            color="warning"
            delay={0.45}
          />
        </div>

        {/* LoRa Status Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card rounded-2xl p-6 border border-accent/20 mb-6"
        >
          <h3 className="text-lg font-display font-semibold text-white mb-4 flex items-center gap-2">
            <Radio size={20} className="text-accent" />
            LoRa Module Status
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">Connection</p>
              <div className="flex items-center gap-1.5">
                <span className={clsx('w-2 h-2 rounded-full', loraConnected ? 'bg-success animate-pulse' : 'bg-danger')} />
                <span className={clsx('text-sm font-semibold', loraConnected ? 'text-success' : 'text-danger')}>
                  {loraConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">Serial Port</p>
              <p className="text-sm font-semibold text-white">
                {loraInfo?.port || process.env.VITE_LORA_PORT || 'COM3'}
              </p>
            </div>

            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">Baud Rate</p>
              <p className="text-sm font-semibold text-white">
                {loraInfo?.baud || '115200'}
              </p>
            </div>

            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">RX Count</p>
              <p className="text-sm font-semibold text-accent">
                {loraInfo?.stats?.messagesReceived || 0}
              </p>
            </div>
          </div>

          {loraInfo?.stats?.lastActivity && (
            <p className="text-xs text-gray-600 mt-3 flex items-center gap-1.5">
              <Clock size={12} />
              Last activity: {new Date(loraInfo.stats.lastActivity).toLocaleString()}
            </p>
          )}
        </motion.div>

        {/* Online users list */}
        {onlineUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="glass-card rounded-2xl p-6 border border-white/10"
          >
            <h3 className="text-lg font-display font-semibold text-white mb-4 flex items-center gap-2">
              <Signal size={20} className="text-success" />
              Online Users ({onlineUsers.length})
            </h3>
            <div className="flex flex-wrap gap-3">
              {onlineUsers.map((u) => (
                <div key={u._id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/5">
                  <Avatar src={u.avatar} username={u.username} size="xs" status={u.status} showStatus />
                  <span className="text-sm text-white">{u.displayName || u.username}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
