'use client';

import React, { useState, useEffect } from 'react';

const AnimatedBackground: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Ring 1 - top right */}
      <div className="absolute -top-96 -right-96 opacity-3">
        <svg
          width="2200"
          height="2200"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ overflow: 'visible' }}
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="animate-spin-slow text-accent"
            style={{ animationDuration: '180s', animationDelay: '0s' }}
          />
          <circle
            cx="50"
            cy="50"
            r="35"
            stroke="currentColor"
            strokeWidth="2.5"
            fill="none"
            className="animate-spin-slow text-accent"
            style={{ animationDirection: 'reverse', animationDuration: '180s', animationDelay: '0s' }}
          />
        </svg>
      </div>

      {/* Ring 2 - bottom left */}
      <div className="absolute -bottom-80 -left-80 opacity-2">
        <svg
          width="2400"
          height="2400"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ overflow: 'visible' }}
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="5"
            fill="none"
            className="animate-spin-slow text-accent"
            style={{ animationDirection: 'reverse', animationDuration: '200s', animationDelay: '-60s' }}
          />
          <circle
            cx="50"
            cy="50"
            r="35"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            className="animate-spin-slow text-accent"
            style={{ animationDuration: '200s', animationDelay: '-60s' }}
          />
          <circle
            cx="50"
            cy="50"
            r="25"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            className="animate-spin-slow text-accent"
            style={{ animationDirection: 'reverse', animationDuration: '200s', animationDelay: '-60s' }}
          />
        </svg>
      </div>

      {/* Ring 3 - center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-2">
        <svg
          width="2500"
          height="2500"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ overflow: 'visible' }}
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="animate-spin-slow text-accent"
            style={{ animationDuration: '190s', animationDelay: '-120s' }}
          />
          <circle
            cx="50"
            cy="50"
            r="35"
            stroke="currentColor"
            strokeWidth="2.5"
            fill="none"
            className="animate-spin-slow text-accent"
            style={{ animationDirection: 'reverse', animationDuration: '190s', animationDelay: '-120s' }}
          />
        </svg>
      </div>

      {/* Ring 4 - mid left */}
      <div className="absolute top-1/3 -left-64 opacity-2">
        <svg
          width="2000"
          height="2000"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ overflow: 'visible' }}
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="4.5"
            fill="none"
            className="animate-spin-slow text-accent"
            style={{ animationDuration: '170s', animationDelay: '-45s' }}
          />
          <circle
            cx="50"
            cy="50"
            r="35"
            stroke="currentColor"
            strokeWidth="2.5"
            fill="none"
            className="animate-spin-slow text-accent"
            style={{ animationDirection: 'reverse', animationDuration: '170s', animationDelay: '-45s' }}
          />
        </svg>
      </div>

      {/* Cursor-following rings */}
      <div
        className="absolute opacity-30"
        style={{
          left: mousePos.x - 10,
          top: mousePos.y - 10,
          transition: 'left 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), top 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ overflow: 'visible' }}
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            className="text-accent"
          />
        </svg>
      </div>

      <div
        className="absolute opacity-20"
        style={{
          left: mousePos.x - 20,
          top: mousePos.y - 20,
          transition: 'left 2.0s cubic-bezier(0.25, 0.46, 0.45, 0.94), top 2.0s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ overflow: 'visible' }}
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            className="text-accent"
          />
        </svg>
      </div>

      <div
        className="absolute opacity-20"
        style={{
          left: mousePos.x - 20,
          top: mousePos.y - 20,
          transition: 'left 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94), top 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ overflow: 'visible' }}
        >
          <circle
            cx="50"
            cy="50"
            r="35"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            className="text-accent"
          />
        </svg>
      </div>

    </div>
  );
};

export default AnimatedBackground;
