/**
 * TypingIndicator.tsx
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TypingIndicatorProps {
  usernames: string[];
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ usernames }) => {
  if (usernames.length === 0) return null;

  const label =
    usernames.length === 1
      ? `${usernames[0]} is typing`
      : usernames.length === 2
      ? `${usernames[0]} and ${usernames[1]} are typing`
      : `${usernames[0]} and ${usernames.length - 1} others are typing`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.2 }}
        className="flex items-center gap-3 px-4 py-2"
      >
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl rounded-bl-sm bg-bg-card border border-white/10">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
        <span className="text-xs text-gray-500 italic">{label}...</span>
      </motion.div>
    </AnimatePresence>
  );
};
