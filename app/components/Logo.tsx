import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 32 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer Circle */}
      <circle
        cx="50"
        cy="50"
        r="45"
        stroke="#a3e635"
        strokeWidth="4"
        fill="none"
        className="animate-spin-slow stroke-accent"
      />

      {/* Inner Circle */}
      <circle
        cx="50"
        cy="50"
        r="35"
        stroke="#a3e635"
        strokeWidth="2"
        fill="none"
        className="animate-spin-slow stroke-accent"
        style={{ animationDirection: 'reverse' }}
      />

      {/* Connection Lines */}
      <path
        d="M50 15 L50 85"
        stroke="#a3e635"
        strokeWidth="2"
        className="animate-pulse-glow stroke-accent"
      />
      <path
        d="M15 50 L85 50"
        stroke="#a3e635"
        strokeWidth="2"
        className="animate-pulse-glow stroke-accent"
      />

      {/* Decorative Dots */}
      <circle
        cx="50"
        cy="15"
        r="3"
        fill="#a3e635"
        className="animate-pulse-glow fill-accent"
      />
      <circle
        cx="50"
        cy="85"
        r="3"
        fill="#a3e635"
        className="animate-pulse-glow fill-accent"
      />
      <circle
        cx="15"
        cy="50"
        r="3"
        fill="#a3e635"
        className="animate-pulse-glow fill-accent"
      />
      <circle
        cx="85"
        cy="50"
        r="3"
        fill="#a3e635"
        className="animate-pulse-glow fill-accent"
      />

      {/* Center Dot */}
      <circle
        cx="50"
        cy="50"
        r="8"
        fill="#a3e635"
        className="animate-pulse-glow fill-accent"
      />
    </svg>
  );
};

export default Logo;
