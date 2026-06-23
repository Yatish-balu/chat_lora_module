/**
 * LeftSidebar.tsx — Main navigation sidebar
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Settings, LogOut, MessageSquare, Users,
  LayoutDashboard, Radio, Wifi, Zap, X, ChevronDown,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Avatar } from '../common/Avatar';
import { ChatList } from './ChatList';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { useUIStore } from '../../store/uiStore';
import { clsx } from 'clsx';
import type { CommunicationMode } from '../../types';
import toast from 'react-hot-toast';

const MODES: { id: CommunicationMode; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'online', label: 'Online', icon: <Wifi size={14} />, color: 'text-success' },
  { id: 'lora', label: 'LoRa', icon: <Radio size={14} />, color: 'text-accent' },
  { id: 'hybrid', label: 'Hybrid', icon: <Zap size={14} />, color: 'text-warning' },
];

export const LeftSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, mode, setMode, logout } = useAuthStore();
  const { chats, allUsers, searchResults, isSearching, searchUsers, clearSearch, openChatWithUser, fetchChats, fetchAllUsers } = useChatStore();
  const { loraConnected } = useUIStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<'chats' | 'users'>('chats');

  useEffect(() => {
    fetchChats();
    fetchAllUsers();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchUsers(searchQuery);
      } else {
        clearSearch();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/auth');
  };

  const handleOpenChat = async (targetUser: typeof allUsers[0]) => {
    const chat = await openChatWithUser(targetUser);
    setSearchQuery('');
    clearSearch();
    navigate('/chat');
  };

  const currentMode = MODES.find((m) => m.id === mode) || MODES[0];

  const displayList = searchQuery.trim() ? searchResults : [];

  return (
    <div className="h-full flex flex-col glass-dark border-r border-white/5 w-72 flex-shrink-0">
      {/* ─── Header ─── */}
      <div className="px-4 py-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🛸</span>
            <div>
              <h1 className="font-display font-bold text-white text-sm leading-none">Chatter</h1>
              <p className="text-[10px] text-gray-500">Platform</p>
            </div>
          </div>

          {/* Mode selector */}
          <div className="relative">
            <button
              onClick={() => setShowModeDropdown(!showModeDropdown)}
              className={clsx(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium',
                'bg-white/5 border border-white/10 hover:border-white/20 transition-all',
                currentMode.color
              )}
            >
              {currentMode.icon}
              {currentMode.label}
              <ChevronDown size={12} />
              {mode === 'lora' && !loraConnected && (
                <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
              )}
            </button>

            <AnimatePresence>
              {showModeDropdown && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  className="absolute right-0 top-full mt-1 w-36 glass-card rounded-xl border border-white/10 shadow-glass z-50 overflow-hidden"
                >
                  {MODES.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setMode(m.id);
                        setShowModeDropdown(false);
                        toast.success(`Switched to ${m.label} mode`);
                      }}
                      className={clsx(
                        'w-full flex items-center gap-2 px-3 py-2 text-xs font-medium',
                        'hover:bg-white/5 transition-colors',
                        mode === m.id ? `${m.color} bg-white/5` : 'text-gray-400'
                      )}
                    >
                      {m.icon}
                      {m.label}
                      {m.id === 'lora' && (
                        <span
                          className={clsx(
                            'ml-auto w-1.5 h-1.5 rounded-full',
                            loraConnected ? 'bg-success' : 'bg-danger'
                          )}
                        />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* User profile row */}
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5">
          <Avatar
            src={user?.avatar}
            username={user?.username || '?'}
            size="sm"
            status={user?.status}
            showStatus
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.displayName || user?.username}
            </p>
            <p className="text-xs text-gray-500 truncate">@{user?.username}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-icon p-1.5"
              title="Dashboard"
            >
              <LayoutDashboard size={15} />
            </button>
            <button onClick={handleLogout} className="btn-icon p-1.5 text-gray-500 hover:text-danger" title="Logout">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Search ─── */}
      <div className="px-4 py-3 border-b border-white/5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={15} />
          <input
            id="sidebar-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500/50 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); clearSearch(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ─── Search results overlay ─── */}
      <AnimatePresence>
        {searchQuery.trim() && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-3 py-2 border-b border-white/5 flex-1 overflow-y-auto scroll-area"
          >
            {isSearching ? (
              <p className="text-xs text-gray-500 text-center py-4">Searching...</p>
            ) : displayList.length === 0 ? (
              <p className="text-xs text-gray-600 text-center py-4">No users found</p>
            ) : (
              <div className="space-y-0.5">
                {displayList.map((u) => (
                  <motion.div
                    key={u._id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => handleOpenChat(u)}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <Avatar src={u.avatar} username={u.username} size="sm" status={u.status} showStatus />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{u.displayName || u.username}</p>
                      <p className="text-xs text-gray-500">@{u.username}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Tabs ─── */}
      {!searchQuery && (
        <>
          <div className="flex mx-4 mt-3 mb-1 gap-1 p-1 bg-white/5 rounded-xl">
            {(['chats', 'users'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={clsx(
                  'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                  activeTab === tab
                    ? 'bg-primary-500 text-white shadow-neon-sm'
                    : 'text-gray-500 hover:text-gray-300'
                )}
              >
                {tab === 'chats' ? <MessageSquare size={13} /> : <Users size={13} />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === 'chats' && chats.filter(c => (c.myUnread || 0) > 0).length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-danger text-white text-[9px] flex items-center justify-center">
                    {chats.filter(c => (c.myUnread || 0) > 0).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ─── Content ─── */}
          <div className="flex-1 overflow-y-auto scroll-area px-3 py-2">
            {activeTab === 'chats' ? (
              <ChatList chats={chats} />
            ) : (
              <div className="space-y-0.5">
                <p className="text-[10px] text-gray-600 uppercase tracking-widest px-2 mb-2">
                  All Users ({allUsers.length})
                </p>
                {allUsers.map((u) => (
                  <motion.div
                    key={u._id}
                    onClick={() => handleOpenChat(u)}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer hover:bg-white/5 transition-colors group"
                  >
                    <Avatar src={u.avatar} username={u.username} size="sm" status={u.status} showStatus />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{u.displayName || u.username}</p>
                      <p className="text-xs text-gray-600">
                        {u.status === 'online' ? '🟢 Online' : u.status === 'away' ? '🟡 Away' : '⚫ Offline'}
                      </p>
                    </div>
                    <span className="text-xs text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      Chat →
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ─── Footer: LoRa status ─── */}
      <div className="px-4 py-2 border-t border-white/5">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Radio size={12} className={loraConnected ? 'text-accent' : 'text-gray-600'} />
          <span>LoRa:</span>
          <span className={loraConnected ? 'text-accent' : 'text-danger'}>
            {loraConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
    </div>
  );
};
