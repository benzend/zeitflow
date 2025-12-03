'use client';

import { Sun, Moon } from 'lucide-react';
import { Button } from './Button';
import { useTheme } from '@/lib/theme-context';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      onClick={toggleTheme}
      variant="tertiary"
      className="!bg-transparent p-2 rounded-full bg-surface hover:bg-surface-hover border border-border hover:border-border-hover transition-all duration-200 group"
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-text-muted group-hover:text-text-muted-hover transition-colors" />
      ) : (
        <Sun className="w-5 h-5 text-text-muted group-hover:text-text-muted-hover transition-colors" />
      )}
    </Button>
  );
}