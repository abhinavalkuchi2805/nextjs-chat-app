'use client';

import { Compass, Plus, Menu } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { StatsData } from '@/types';

interface ChatHeaderProps {
  stats: StatsData | null;
  sidebarOpen: boolean;
  onToggleSidebar?: () => void;
  onNewChat?: () => void;
}

export function ChatHeader({ 
  stats, 
  sidebarOpen, 
  onToggleSidebar, 
  onNewChat,
}: ChatHeaderProps) {
  return (
    <>
      <header className="glass-strong px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          {/* Sidebar toggle button - shows when sidebar is closed */}
          {!sidebarOpen && onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)]
                         hover:bg-[var(--glass-bg)] transition-colors cursor-pointer"
              title="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          
          <div className="relative">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center animate-float bg-[var(--btn-primary-bg)]">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <div className="absolute inset-0 w-10 h-10 rounded-xl blur-lg opacity-50 bg-[var(--btn-primary-bg)]"></div>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[var(--foreground)]">DataPilot</h1>
            {stats && stats.totalRecords > 0 && (
              <span className="text-xs text-[var(--muted)]">
                {stats.totalRecords.toLocaleString()} records loaded
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* New Chat button */}
          {onNewChat && (
            <button
              onClick={onNewChat}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer
                         text-[var(--btn-primary-text)] bg-[var(--btn-primary-bg)]
                         hover:bg-[var(--btn-primary-hover)] transition-all duration-200 
                         hover:shadow-md active:scale-95"
              title="New Chat"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          )}
          <ThemeToggle />
        </div>
      </header>

      {/* Subtle separator line */}
      <div className="h-px bg-[var(--glass-border)]"></div>
    </>
  );
}
