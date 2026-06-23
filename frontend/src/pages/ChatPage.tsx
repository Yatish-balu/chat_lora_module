/**
 * ChatPage.tsx — Main chat layout
 */

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { LeftSidebar } from '../components/sidebar/LeftSidebar';
import { ChatHeader } from '../components/chat/ChatHeader';
import { ChatWindow } from '../components/chat/ChatWindow';
import { MessageInput } from '../components/chat/MessageInput';
import { ParticleBackground } from '../components/common/ParticleBackground';
import { useSocket } from '../hooks/useSocket';
import { useChatStore } from '../store/chatStore';
import { useUIStore } from '../store/uiStore';
import { clsx } from 'clsx';

export const ChatPage: React.FC = () => {
  // Register all socket event listeners
  useSocket();

  const { activeChat, setActiveChat } = useChatStore();
  const { isMobileView, setMobileView } = useUIStore();

  // Responsive detection
  useEffect(() => {
    const handleResize = () => setMobileView(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleBack = () => setActiveChat(null);

  return (
    <div className="h-screen flex relative overflow-hidden bg-mesh">
      <ParticleBackground />

      {/* Main layout */}
      <div className="relative z-10 flex w-full h-full">
        {/* Left Sidebar */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className={clsx(
            'h-full flex-shrink-0',
            isMobileView && activeChat ? 'hidden' : 'flex'
          )}
        >
          <LeftSidebar />
        </motion.div>

        {/* Chat area */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className={clsx(
            'flex-1 flex flex-col min-w-0',
            isMobileView && !activeChat ? 'hidden' : 'flex'
          )}
        >
          {activeChat ? (
            <>
              <ChatHeader onBack={isMobileView ? handleBack : undefined} />
              <ChatWindow />
              <MessageInput />
            </>
          ) : (
            /* Empty state — visible on desktop when no chat is selected */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <motion.div
                className="text-8xl mb-6"
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              >
                🛸
              </motion.div>
              <h2 className="text-2xl font-display font-semibold text-white mb-3">
                Chatter
              </h2>
              <p className="text-gray-500 max-w-sm leading-relaxed">
                Select a conversation from the sidebar to start chatting, or search for a user to begin a new conversation.
              </p>
              <div className="flex items-center gap-3 mt-6">
                <div className="px-3 py-1.5 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
                  🟢 Online Ready
                </div>
                <div className="px-3 py-1.5 rounded-full text-xs font-medium bg-accent/10 text-accent border border-accent/20">
                  📡 LoRa Active
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
