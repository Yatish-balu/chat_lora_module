/**
 * AuthPage.tsx — Simplified Nickname login page (no password required)
 */

import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ParticleBackground } from '../components/common/ParticleBackground';
import { useAuthStore } from '../store/authStore';
import { User, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

export const AuthPage: React.FC = () => {
  const { login, isLoading, isAuthenticated } = useAuthStore();
  const [username, setUsername] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/chat" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim();
    if (!cleanUsername) {
      toast.error('Please enter a username or nickname');
      return;
    }
    if (cleanUsername.length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }
    try {
      // Use existing login with a dummy password since any name and password works
      await login({ email: cleanUsername, password: 'default_password_123' });
      toast.success(`Welcome to Chatter, ${cleanUsername}! 🚀`);
    } catch (err) {
      toast.error('Failed to initialize session');
    }
  };

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4 relative overflow-hidden">
      <ParticleBackground />

      {/* Background glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/8 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo section */}
        <div className="text-center mb-8">
          <motion.div
            className="text-6xl mb-3 inline-block"
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          >
            🛸
          </motion.div>
          <h1 className="text-4xl font-display font-bold gradient-text">
            Chatter
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            Internet + LoRa hybrid messaging platform
          </p>
          {/* Mode badges */}
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-success/10 text-success border border-success/20">
              🟢 Online
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-accent/10 text-accent border border-accent/20">
              📡 LoRa
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-warning/10 text-warning border border-warning/20">
              ⚡ Hybrid
            </span>
          </div>
        </div>

        {/* Auth card */}
        <div className="glass neon-border rounded-2xl p-8 shadow-glass">
          <div className="mb-6">
            <h2 className="text-2xl font-display font-bold text-white mb-2">Get Started</h2>
            <p className="text-gray-400 text-sm">Enter a name to access the chat dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">Choose a Username / Nickname</label>
              <div className="relative">
                <User
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"
                  size={18}
                />
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. Laptop_A, Laptop_B, Arun"
                  className="input-field pl-11"
                  autoComplete="off"
                />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={18} />
                  Enter Chat
                </>
              )}
            </motion.button>
          </form>
        </div>

        <p className="text-center text-gray-700 text-xs mt-4">
          Chatter — Engineering Final Year Project
        </p>
      </motion.div>
    </div>
  );
};
