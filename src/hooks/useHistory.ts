'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChatMessage, ChatSession } from '@/types';

const STORAGE_KEY = 'chat-history';

// Helper to generate unique IDs
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Helper to generate title from first message
const generateTitle = (messages: ChatMessage[]): string => {
  const firstUserMessage = messages.find(m => m.isUser);
  if (firstUserMessage) {
    const text = firstUserMessage.text;
    return text.length > 40 ? text.substring(0, 40) + '...' : text;
  }
  return 'New Conversation';
};

// Serialize session for storage (convert Date objects)
const serializeSession = (session: ChatSession): string => {
  return JSON.stringify({
    ...session,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    messages: session.messages.map(m => ({
      ...m,
      timestamp: m.timestamp.toISOString(),
    })),
  });
};

// Deserialize session from storage
const deserializeSession = (data: string): ChatSession => {
  const parsed = JSON.parse(data);
  return {
    ...parsed,
    createdAt: new Date(parsed.createdAt),
    updatedAt: new Date(parsed.updatedAt),
    messages: parsed.messages.map((m: { timestamp: string } & Omit<ChatMessage, 'timestamp'>) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    })),
  };
};

export function useHistory() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load sessions from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        const loadedSessions = parsed.map(deserializeSession);
        setSessions(loadedSessions.sort((a, b) => 
          b.updatedAt.getTime() - a.updatedAt.getTime()
        ));
        
        // Set current session to most recent or create new
        if (loadedSessions.length > 0) {
          setCurrentSessionId(loadedSessions[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
    setIsLoaded(true);
  }, []);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const serialized = sessions.map(serializeSession);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  }, [sessions, isLoaded]);

  // Get current session
  const currentSession = sessions.find(s => s.id === currentSessionId) || null;

  // Create a new session
  const createSession = useCallback((initialMessage?: ChatMessage): ChatSession => {
    const now = new Date();
    const newSession: ChatSession = {
      id: generateId(),
      title: 'New Conversation',
      messages: initialMessage ? [initialMessage] : [],
      createdAt: now,
      updatedAt: now,
    };
    
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    return newSession;
  }, []);

  // Update current session with new messages
  const updateSession = useCallback((messages: ChatMessage[]) => {
    if (!currentSessionId) return;
    
    setSessions(prev => prev.map(session => {
      if (session.id === currentSessionId) {
        return {
          ...session,
          messages,
          title: generateTitle(messages),
          updatedAt: new Date(),
        };
      }
      return session;
    }));
  }, [currentSessionId]);

  // Delete a session
  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== sessionId);
      
      // If we deleted the current session, switch to another or null
      if (currentSessionId === sessionId) {
        setCurrentSessionId(filtered.length > 0 ? filtered[0].id : null);
      }
      
      return filtered;
    });
  }, [currentSessionId]);

  // Switch to a different session
  const switchSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
  }, []);

  // Start a new conversation (creates new session)
  const startNewConversation = useCallback(() => {
    createSession();
  }, [createSession]);

  return {
    sessions,
    currentSession,
    currentSessionId,
    isLoaded,
    createSession,
    updateSession,
    deleteSession,
    switchSession,
    startNewConversation,
  };
}
