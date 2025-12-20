'use client';

import { useState } from 'react';
import { MessageCircle, Plus, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { ChatSession } from '@/types';

interface HistorySidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  isOpen: boolean;
  onToggle: () => void;
  onSelectSession: (sessionId: string) => void;
  onNewChat?: () => void;
  onDeleteSession?: (sessionId: string) => void;
}

export function HistorySidebar({
  sessions,
  currentSessionId,
  isOpen,
  onToggle,
  onSelectSession,
  onNewChat,
  onDeleteSession,
}: HistorySidebarProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const handleDelete = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDeleteSession) return;
    
    if (deleteConfirm === sessionId) {
      onDeleteSession(sessionId);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(sessionId);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  return (
    <>
      {/* Toggle button when closed */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-50
                     w-6 h-16 glass rounded-r-lg flex items-center justify-center
                     text-[var(--muted)] hover:text-[var(--foreground)]
                     transition-all duration-200 hover:w-8 cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full z-40 transition-all duration-300 ease-out
          ${isOpen ? 'w-72 translate-x-0' : 'w-72 -translate-x-full'}`}
      >
        <div className="h-full glass-strong flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-[var(--glass-border)] flex items-center justify-between">
            <h2 className="font-semibold text-[var(--foreground)]">Chat History</h2>
            <button
              onClick={onToggle}
              className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)]
                         hover:bg-[var(--glass-bg)] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>



          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {sessions.length === 0 ? (
              <div className="text-center py-8 text-[var(--muted)]">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No conversations yet</p>
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={`group relative p-3 rounded-xl cursor-pointer transition-all duration-200
                    ${currentSessionId === session.id
                      ? ''
                      : 'hover:bg-[var(--glass-bg)]'
                    }`}
                  style={currentSessionId === session.id ? {background: 'var(--accent-gradient)'} : {}}
                >
                  <div className="flex items-start gap-3">
                    <MessageCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                      currentSessionId === session.id ? 'text-[var(--gradient-start)]' : 'text-[var(--muted)]'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-[var(--foreground)]">
                        {session.title}
                      </p>
                      <p className="text-xs text-[var(--muted)] mt-0.5">
                        {formatDate(session.updatedAt)}
                      </p>
                    </div>
                  </div>

                  {/* Delete button */}
                  {onDeleteSession && (
                    <button
                      onClick={(e) => handleDelete(session.id, e)}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg
                                 transition-all duration-200 cursor-pointer
                                 ${deleteConfirm === session.id
                                   ? 'bg-red-500/20 text-red-400'
                                   : 'opacity-0 group-hover:opacity-100 text-[var(--muted)] hover:text-red-400 hover:bg-red-500/10'
                                 }`}
                    >
                      {deleteConfirm === session.id ? (
                        <X className="w-4 h-4" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
}
