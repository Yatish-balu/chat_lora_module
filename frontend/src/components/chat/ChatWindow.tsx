/**
 * ChatWindow.tsx — Scrollable message list
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown, MessageSquare } from 'lucide-react';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { MessageBubble, DateSeparator } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { Loader } from '../common/Loader';
import { format, isSameDay } from 'date-fns';

export const ChatWindow: React.FC = () => {
  const { activeChat, messages, typingUsers, isLoadingMessages, fetchMessages, markActiveChatRead } =
    useChatStore();
  const { user } = useAuthStore();
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const chatMessages = activeChat ? messages[activeChat._id] || [] : [];
  const typingList = activeChat ? typingUsers[activeChat._id] || [] : [];

  // Fetch messages when active chat changes
  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat._id);
      markActiveChatRead();
    }
  }, [activeChat?._id]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isAtBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages.length, typingList.length]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsAtBottom(distFromBottom < 100);
    setShowScrollBtn(distFromBottom > 300);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollBtn(false);
  };

  if (!activeChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
        <motion.div
          className="text-7xl"
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 3 }}
        >
          🛸
        </motion.div>
        <div>
          <h3 className="text-xl font-display font-semibold text-white mb-2">
            Chatter
          </h3>
          <p className="text-gray-500 text-sm max-w-xs">
            Select a conversation from the sidebar or start a new chat to begin messaging
          </p>
        </div>
        <div className="flex items-center gap-2 text-gray-600 text-xs mt-2">
          <MessageSquare size={14} />
          <span>Internet + LoRa hybrid messaging</span>
        </div>
      </div>
    );
  }

  if (isLoadingMessages) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader size="md" text="Loading messages..." />
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-hidden flex flex-col">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto scroll-area py-4 space-y-0.5"
        style={{ scrollbarGutter: 'stable' }}
      >
        {chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
              <MessageSquare size={28} className="text-primary-400" />
            </div>
            <p className="text-gray-500 text-sm">
              No messages yet. Say hello! 👋
            </p>
          </div>
        ) : (
          <>
            {chatMessages.map((msg, idx) => {
              const prev = chatMessages[idx - 1];
              const showDate =
                idx === 0 ||
                !isSameDay(new Date(msg.createdAt), new Date(prev.createdAt));

              return (
                <React.Fragment key={msg._id}>
                  {showDate && <DateSeparator dateStr={msg.createdAt} />}
                  <MessageBubble
                    message={msg}
                    isFirst={idx === 0}
                  />
                </React.Fragment>
              );
            })}
          </>
        )}

        {/* Typing indicator */}
        <TypingIndicator usernames={typingList} />

        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 w-10 h-10 rounded-full
                       bg-primary-500 text-white shadow-neon-primary
                       flex items-center justify-center hover:bg-primary-400 transition-colors"
          >
            <ArrowDown size={18} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
