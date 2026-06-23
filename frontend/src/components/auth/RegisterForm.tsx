/**
 * RegisterForm.tsx
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, UserPlus } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

interface RegisterFormProps {
  onSwitch: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitch }) => {
  const [form, setForm] = useState({
    username: '',
    email: '',
    displayName: '',
    password: '',
    confirmPassword: '',
  });
  const [showPass, setShowPass] = useState(false);
  const { register, isLoading } = useAuthStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.username || !form.email || !form.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
      toast.error('Username can only contain letters, numbers and underscores');
      return;
    }

    try {
      await register({
        username: form.username,
        email: form.email,
        password: form.password,
        displayName: form.displayName || form.username,
      });
      toast.success('Account created! Welcome to Chatter 🛸');
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      toast.error(error.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-6">
        <h2 className="text-3xl font-display font-bold text-white mb-2">Create account</h2>
        <p className="text-gray-400">Join the Chatter network</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Username *</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              id="reg-username"
              name="username"
              type="text"
              value={form.username}
              onChange={handleChange}
              placeholder="yatish_cool"
              className="input-field pl-11"
            />
          </div>
        </div>

        {/* Display Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Display Name</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              id="reg-displayname"
              name="displayName"
              type="text"
              value={form.displayName}
              onChange={handleChange}
              placeholder="Yatish"
              className="input-field pl-11"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Email *</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              id="reg-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="your@email.com"
              className="input-field pl-11"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Password *</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              id="reg-password"
              name="password"
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange}
              placeholder="Min 6 characters"
              className="input-field pl-11 pr-11"
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

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirm Password *</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              id="reg-confirm-password"
              name="confirmPassword"
              type={showPass ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Repeat password"
              className="input-field pl-11"
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
              <UserPlus size={18} />
              Create Account
            </>
          )}
        </motion.button>
      </form>

      <p className="mt-5 text-center text-gray-500 text-sm">
        Already have an account?{' '}
        <button
          onClick={onSwitch}
          className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
        >
          Sign in
        </button>
      </p>
    </motion.div>
  );
};
