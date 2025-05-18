'use client';

import { useEffect, useState } from 'react';

export default function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (!isLoading) return null;

  return (
    <div className="min-h-screen bg-[#18181b] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 border-4 border-[#a3e635] rounded-full animate-spin-slow"></div>
          <div className="absolute inset-2 border-4 border-[#a3e635] rounded-full animate-spin-slow-reverse"></div>
          <div className="absolute inset-4 border-4 border-[#a3e635] rounded-full animate-spin-slow"></div>
        </div>
        <div className="text-[#a3e635] text-xl font-bold animate-pulse">
          Loading Joist...
        </div>
      </div>
    </div>
  );
}
