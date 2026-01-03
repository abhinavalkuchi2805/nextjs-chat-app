'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Compass, Plus, Menu, LogOut, User as UserIcon, Sparkles } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { StatsData } from '@/types';
import { User } from '@/types/auth-types';

interface ChatHeaderProps {
  stats: StatsData | null;
  sidebarOpen: boolean;
  onToggleSidebar?: () => void;
  onNewChat?: () => void;
  showThemeToggle?: boolean;
}

export function ChatHeader({
  stats,
  sidebarOpen,
  onToggleSidebar,
  onNewChat,
  showThemeToggle = true,
}: ChatHeaderProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

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

          {/* Brand Logo */}
          <div className="relative group cursor-default">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center animate-float bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] shadow-lg shadow-[var(--gradient-start)]/20 group-hover:shadow-[var(--gradient-mid)]/40 transition-all duration-300">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="absolute inset-0 w-10 h-10 rounded-xl blur-lg opacity-40 bg-[var(--gradient-start)] group-hover:opacity-60 transition-opacity duration-300"></div>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--gradient-start)] via-[var(--gradient-mid)] to-[var(--gradient-end)]">
              DataPilot
            </h1>
            {stats && stats.totalRecords > 0 && (
              <span className="text-xs text-[var(--muted)] font-medium">
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
          {showThemeToggle && <ThemeToggle />}

          {/* User Menu */}
          {user && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 rounded-lg cursor-pointer
                           text-[var(--foreground)] bg-[var(--glass-bg)]
                           hover:bg-[var(--glass-border)] transition-all duration-200
                           border border-[var(--glass-border)]"
                title={user.name}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] 
                                flex items-center justify-center text-white font-medium text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 glass-strong rounded-xl shadow-2xl 
                                border border-[var(--glass-border)] overflow-hidden animate-fade-in-up">
                  <div className="px-4 py-3 border-b border-[var(--glass-border)]">
                    <p className="text-sm font-medium text-[var(--foreground)]">{user.name}</p>
                    <p className="text-xs text-[var(--muted)] truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--foreground)]
                               hover:bg-[var(--glass-bg)] transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Subtle separator line */}
      <div className="h-px bg-[var(--glass-border)]"></div>
    </>
  );
}
