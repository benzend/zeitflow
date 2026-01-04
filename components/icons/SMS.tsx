import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const SMSIcon: React.FC<IconProps> = ({
  className = '',
  size = 18,
}) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Message bubble */}
    <rect x="2" y="3" width="14" height="10" rx="2" stroke="var(--foreground)" strokeWidth="1" fill="none" />
    {/* Message lines */}
    <line x1="5" y1="6" x2="13" y2="6" stroke="var(--foreground)" strokeWidth="1" />
    <line x1="5" y1="8.5" x2="11" y2="8.5" stroke="var(--foreground)" strokeWidth="1" />
    {/* Tail of message bubble */}
    <path d="M6 13 L5 15 L7 13" stroke="var(--foreground)" strokeWidth="1" fill="none" />
  </svg>
);
