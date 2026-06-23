/**
 * Avatar.tsx — User avatar with status indicator
 */

import React from 'react';
import { clsx } from 'clsx';
import type { UserStatus } from '../../types';

interface AvatarProps {
  src?: string;
  username: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: UserStatus;
  showStatus?: boolean;
  className?: string;
  onClick?: () => void;
}

const sizeMap = {
  xs: 'w-7 h-7 text-xs',
  sm: 'w-9 h-9 text-sm',
  md: 'w-11 h-11 text-base',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
};

const dotSizeMap = {
  xs: 'w-2 h-2 -bottom-0.5 -right-0.5',
  sm: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5',
  md: 'w-3 h-3 bottom-0 right-0',
  lg: 'w-3.5 h-3.5 bottom-0.5 right-0.5',
  xl: 'w-4 h-4 bottom-1 right-1',
};

const statusColors: Record<UserStatus, string> = {
  online: 'bg-success shadow-[0_0_6px_#22C55E]',
  away: 'bg-warning shadow-[0_0_6px_#F59E0B]',
  offline: 'bg-gray-600',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  username,
  size = 'md',
  status,
  showStatus = false,
  className,
  onClick,
}) => {
  const initial = username?.charAt(0)?.toUpperCase() || '?';

  return (
    <div
      className={clsx('relative flex-shrink-0', className, onClick && 'cursor-pointer')}
      onClick={onClick}
    >
      {src ? (
        <img
          src={src}
          alt={username}
          className={clsx(
            sizeMap[size],
            'rounded-full object-cover ring-2 ring-primary-500/30'
          )}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <div
          className={clsx(
            sizeMap[size],
            'rounded-full flex items-center justify-center font-semibold',
            'bg-gradient-to-br from-primary-500 to-secondary-500 text-white',
            'ring-2 ring-primary-500/30'
          )}
        >
          {initial}
        </div>
      )}

      {showStatus && status && (
        <span
          className={clsx(
            'absolute rounded-full border-2 border-bg-surface',
            dotSizeMap[size],
            statusColors[status]
          )}
        />
      )}
    </div>
  );
};
