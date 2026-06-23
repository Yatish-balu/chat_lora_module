/**
 * MessageBubble.tsx — Renders a single chat message
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Check, CheckCheck, Clock, AlertCircle, Radio, Wifi } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { clsx } from 'clsx';
import type { Message, MessageStatus } from '../../types';
import { useAuthStore } from '../../store/authStore';

interface MessageBubbleProps {
  message: Message;
  showAvatar?: boolean;
  isFirst?: boolean;
}

const StatusIcon: React.FC<{ status: MessageStatus }> = ({ status }) => {
  switch (status) {
    case 'pending':
      return <Clock size={12} className="text-gray-500" />;
    case 'queued':
      return <Clock size={12} className="text-warning animate-pulse" />;
    case 'sent':
      return <Check size={12} className="tick-sent" />;
    case 'delivered':
      return <CheckCheck size={12} className="tick-delivered" />;
    case 'read':
      return <CheckCheck size={12} className="tick-read" />;
    case 'failed':
      return <AlertCircle size={12} className="text-danger" />;
    default:
      return null;
  }
};

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return format(date, 'HH:mm');
};

const formatDateLabel = (dateStr: string) => {
  const date = new Date(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMMM d, yyyy');
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  showAvatar = false,
  isFirst = false,
}) => {
  const { user } = useAuthStore();
  const isSent = message.sender?._id === user?._id || message.sender === user?._id;

  const bubbleVariants = {
    initial: {
      opacity: 0,
      x: isSent ? 20 : -20,
      scale: 0.95,
    },
    animate: {
      opacity: 1,
      x: 0,
      scale: 1,
    },
  };

  return (
    <motion.div
      variants={bubbleVariants}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={clsx('flex', isSent ? 'justify-end' : 'justify-start', 'mb-1 px-4')}
    >
      <div className={clsx('max-w-[70%] md:max-w-[60%]', isSent ? 'items-end' : 'items-start', 'flex flex-col')}>
        {/* Reply preview */}
        {message.replyTo && (
          <div className={clsx(
            'text-xs px-3 py-1.5 rounded-xl mb-1 border-l-2 border-primary-500',
            isSent ? 'bg-primary-500/20' : 'bg-white/5',
          )}>
            <span className="text-gray-400">
              {typeof message.replyTo === 'object' ? message.replyTo.content?.substring(0, 60) : '...'}
            </span>
          </div>
        )}

        {/* Bubble */}
        <div
          className={clsx(
            'relative group px-4 py-2.5 rounded-2xl',
            isSent
              ? 'bubble-sent rounded-br-sm'
              : 'bubble-received rounded-bl-sm'
          )}
        >
          {/* LoRa mode indicator */}
          {message.mode === 'lora' && (
            <div className="flex items-center gap-1 text-xs text-accent/80 mb-1">
              <Radio size={10} />
              <span>LoRa</span>
              {message.loraMetadata?.rssi && (
                <span>{message.loraMetadata.rssi}dBm</span>
              )}
            </div>
          )}

          {/* Content */}
          <p className={clsx('text-sm leading-relaxed break-words', isSent ? 'text-white' : 'text-gray-100')}>
            {message.content}
          </p>

          {/* Timestamp + status */}
          <div
            className={clsx(
              'flex items-center gap-1 mt-1',
              isSent ? 'justify-end' : 'justify-start'
            )}
          >
            <span className={clsx('text-[10px]', isSent ? 'text-white/60' : 'text-gray-500')}>
              {formatTime(message.createdAt)}
            </span>
            {isSent && <StatusIcon status={message.status} />}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ─── Date separator ─── */
export const DateSeparator: React.FC<{ dateStr: string }> = ({ dateStr }) => (
  <div className="flex items-center gap-3 px-4 my-3">
    <div className="flex-1 h-px bg-white/5" />
    <span className="text-xs text-gray-500 font-medium px-2 py-0.5 rounded-full bg-bg-surface border border-white/5">
      {formatDateLabel(dateStr)}
    </span>
    <div className="flex-1 h-px bg-white/5" />
  </div>
);
