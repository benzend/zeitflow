import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const QueueIcon: React.FC<IconProps> = ({
  className = '',
  size = 40,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Background Circle */}
    <circle cx="50" cy="50" r="45" fill="#18181b" />

    {/* List Items */}
    <rect
      x="25"
      y="20"
      width="50"
      height="8"
      rx="2"
      fill="#a3e635"
      className="animate-pulse-glow"
    />
    <rect
      x="25"
      y="35"
      width="50"
      height="8"
      rx="2"
      fill="#a3e635"
      className="animate-pulse-glow delay-100"
    />
    <rect
      x="25"
      y="50"
      width="50"
      height="8"
      rx="2"
      fill="#a3e635"
      className="animate-pulse-glow delay-200"
    />
    <rect
      x="25"
      y="65"
      width="50"
      height="8"
      rx="2"
      fill="#a3e635"
      className="animate-pulse-glow delay-300"
    />

    {/* Progress Indicators */}
    <circle
      cx="15"
      cy="24"
      r="3"
      fill="#a3e635"
      className="animate-pulse-glow"
    />
    <circle
      cx="15"
      cy="39"
      r="3"
      fill="#a3e635"
      className="animate-pulse-glow delay-100"
    />
    <circle
      cx="15"
      cy="54"
      r="3"
      fill="#a3e635"
      className="animate-pulse-glow delay-200"
    />
    <circle
      cx="15"
      cy="69"
      r="3"
      fill="#a3e635"
      className="animate-pulse-glow delay-300"
    />
  </svg>
);

export const ChainIcon: React.FC<IconProps> = ({
  className = '',
  size = 40,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Background Circle */}
    <circle cx="50" cy="50" r="45" fill="#18181b" />

    {/* Connected Tasks */}
    <path
      d="M20 50 L35 35 L65 35 L80 50 L65 65 L35 65 Z"
      stroke="#a3e635"
      strokeWidth="3"
      fill="none"
      className="animate-pulse-glow"
    />

    {/* Connection Lines */}
    <path
      d="M35 35 L35 65"
      stroke="#a3e635"
      strokeWidth="2"
      className="animate-pulse-glow delay-100"
    />
    <path
      d="M65 35 L65 65"
      stroke="#a3e635"
      strokeWidth="2"
      className="animate-pulse-glow delay-200"
    />

    {/* Progress Dots */}
    <circle
      cx="35"
      cy="35"
      r="4"
      fill="#a3e635"
      className="animate-pulse-glow"
    />
    <circle
      cx="65"
      cy="35"
      r="4"
      fill="#a3e635"
      className="animate-pulse-glow delay-100"
    />
    <circle
      cx="65"
      cy="65"
      r="4"
      fill="#a3e635"
      className="animate-pulse-glow delay-200"
    />
    <circle
      cx="35"
      cy="65"
      r="4"
      fill="#a3e635"
      className="animate-pulse-glow delay-300"
    />
  </svg>
);

export const StepIcon: React.FC<IconProps> = ({
  className = '',
  size = 40,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Background Circle */}
    <circle cx="50" cy="50" r="45" fill="#18181b" />

    {/* Building Block */}
    <rect
      x="25"
      y="25"
      width="50"
      height="50"
      rx="5"
      stroke="#a3e635"
      strokeWidth="3"
      fill="none"
      className="animate-pulse-glow"
    />

    {/* Prompt Lines */}
    <path
      d="M35 40 L65 40"
      stroke="#a3e635"
      strokeWidth="2"
      className="animate-pulse-glow delay-100"
    />
    <path
      d="M35 50 L65 50"
      stroke="#a3e635"
      strokeWidth="2"
      className="animate-pulse-glow delay-200"
    />
    <path
      d="M35 60 L65 60"
      stroke="#a3e635"
      strokeWidth="2"
      className="animate-pulse-glow delay-300"
    />

    {/* Connection Points */}
    <circle
      cx="25"
      cy="50"
      r="3"
      fill="#a3e635"
      className="animate-pulse-glow"
    />
    <circle
      cx="75"
      cy="50"
      r="3"
      fill="#a3e635"
      className="animate-pulse-glow delay-300"
    />
  </svg>
);

export const ResultIcon: React.FC<IconProps> = ({
  className = '',
  size = 40,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Background Circle */}
    <circle cx="50" cy="50" r="45" fill="#18181b" />

    {/* Output Window */}
    <rect
      x="20"
      y="20"
      width="60"
      height="60"
      rx="5"
      stroke="#a3e635"
      strokeWidth="3"
      fill="none"
      className="animate-pulse-glow"
    />

    {/* Text Lines */}
    <path
      d="M30 35 L70 35"
      stroke="#a3e635"
      strokeWidth="2"
      className="animate-pulse-glow delay-100"
    />
    <path
      d="M30 45 L70 45"
      stroke="#a3e635"
      strokeWidth="2"
      className="animate-pulse-glow delay-200"
    />
    <path
      d="M30 55 L70 55"
      stroke="#a3e635"
      strokeWidth="2"
      className="animate-pulse-glow delay-300"
    />
    <path
      d="M30 65 L50 65"
      stroke="#a3e635"
      strokeWidth="2"
      className="animate-pulse-glow delay-400"
    />

    {/* Output Indicator */}
    <path
      d="M55 65 L65 65 L60 70 L55 65"
      stroke="#a3e635"
      strokeWidth="2"
      fill="#a3e635"
      className="animate-pulse-glow delay-400"
    />
  </svg>
);
