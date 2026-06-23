/**
 * LoginForm.tsx
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

interface LoginFormProps {
  onSwitch: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitch }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const { login, isLoading } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    try {
      await login({ email, password });
      toast.success('Welcome back! 🚀');
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      toast.error(error.response?.data?.message || 'Login failed');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-8">
        <h2 className="text-3xl font-display font-bold text-white mb-2">Welcome back</h2>
        <p className="text-gray-400">Sign in to Chatter</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email or Name */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-300">Email or Name</label>
          <div className="relative">
            <Mail
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"
              size={18}
            />
            <input
              id="login-email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com or username"
              className="input-field pl-11"
              autoComplete="username"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-300">Password</label>
          <div className="relative">
            <Lock
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"
              size={18}
            />
            <input
              id="login-password"
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-field pl-11 pr-11"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Submit */}
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
              Sign In
            </>
          )}
        </motion.button>
      </form>

      <p className="mt-6 text-center text-gray-500 text-sm">
        Don't have an account?{' '}
        <button
          onClick={onSwitch}
          className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
        >
          Create one
        </button>
      </p>
    </motion.div>
  );
};
