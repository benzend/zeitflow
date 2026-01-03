import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const SlackIcon: React.FC<IconProps> = ({
  className = '',
  size = 18,
}) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="3" y="7" width="3" height="8" rx="1" fill="var(--foreground)" />
    <rect x="7" y="4" width="3" height="11" rx="1" fill="var(--foreground)" />
    <rect x="11" y="6" width="3" height="9" rx="1" fill="var(--foreground)" />
    <rect x="15" y="9" width="2" height="6" rx="1" fill="var(--foreground)" />
  </svg>
);