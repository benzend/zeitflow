import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const EmailIcon: React.FC<IconProps> = ({
  className = '',
  size = 18,
}) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="2" y="4" width="14" height="10" rx="1" stroke="var(--foreground)" strokeWidth="1" fill="none" />
    <path d="M2 5 L9 10 L16 5" stroke="var(--foreground)" strokeWidth="1" fill="none" />
  </svg>
);