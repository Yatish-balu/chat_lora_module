/**
 * MessageInput.tsx — Message composition bar with emoji picker
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Smile, Paperclip, Mic } from 'lucide-react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { useChat } from '../../hooks/useChat';
import { clsx } from 'clsx';

export const MessageInput: React.FC = () => {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const { sendMessage, startTyping, stopTyping } = useChat();

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMessage(trimmed);
    setText('');
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    startTyping();
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setText((prev) => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [text]);

  return (
    <div className="relative glass-dark border-t border-white/5 px-4 py-3">
      {/* Emoji picker */}
      <AnimatePresence>
        {showEmoji && (
          <motion.div
            ref={emojiRef}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-4 mb-2 z-50"
          >
            <EmojiPicker
              onEmojiClick={onEmojiClick}
              theme={Theme.DARK}
              height={380}
              width={320}
              previewConfig={{ showPreview: false }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-2">
        {/* Emoji button */}
        <button
          onClick={() => setShowEmoji(!showEmoji)}
          className={clsx(
            'btn-icon flex-shrink-0 mb-0.5',
            showEmoji && 'text-primary-400 bg-primary-500/10'
          )}
          title="Emoji picker"
        >
          <Smile size={20} />
        </button>

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            id="message-input"
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={stopTyping}
            placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
            rows={1}
            className={clsx(
              'w-full resize-none bg-bg-surface border border-white/10 rounded-xl',
              'px-4 py-2.5 text-sm text-white placeholder-gray-500',
              'focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50',
              'transition-all duration-200 leading-relaxed',
              'max-h-[120px] overflow-y-auto'
            )}
          />
        </div>

        {/* Mic / Send button */}
        <motion.button
          onClick={handleSend}
          disabled={!text.trim()}
          className={clsx(
            'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center',
            'transition-all duration-200 mb-0.5',
            text.trim()
              ? 'bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-neon-sm hover:shadow-neon-primary'
              : 'bg-white/5 text-gray-600 cursor-not-allowed'
          )}
          whileTap={text.trim() ? { scale: 0.9 } : {}}
          title="Send message"
        >
          {text.trim() ? <Send size={18} /> : <Mic size={18} />}
        </motion.button>
      </div>
    </div>
  );
};
