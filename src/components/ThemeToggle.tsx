'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  
  return (
    <button
      onClick={toggleTheme}
      className="relative w-10 h-10 rounded-xl glass flex items-center justify-center
                 hover:bg-white/10 dark:hover:bg-white/10 transition-all duration-300
                 group overflow-hidden"
      aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {/* Sun icon */}
      <Sun 
        className={`w-5 h-5 absolute transition-all duration-500 ease-out
          ${resolvedTheme === 'dark' 
            ? 'rotate-90 scale-0 opacity-0' 
            : 'rotate-0 scale-100 opacity-100 text-amber-500'
          }`}
      />
      
      {/* Moon icon */}
      <Moon 
        className={`w-5 h-5 absolute transition-all duration-500 ease-out
          ${resolvedTheme === 'dark' 
            ? 'rotate-0 scale-100 opacity-100 text-indigo-300' 
            : '-rotate-90 scale-0 opacity-0'
          }`}
      />
      
      {/* Hover glow effect */}
      <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300
        ${resolvedTheme === 'dark' 
          ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20' 
          : 'bg-gradient-to-br from-amber-500/20 to-orange-500/20'
        }`} 
      />
    </button>
  );
}
