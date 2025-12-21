'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChatMessage, ChatSession } from '@/types';

// Helper to generate title from first message
const generateTitle = (messages: ChatMessage[]): string => {
  const firstUserMessage = messages.find(m => m.isUser);
  if (firstUserMessage) {
    const text = firstUserMessage.text;
    return text.length > 40 ? text.substring(0, 40) + '...' : text;
  }
  return 'New Conversation';
};

export function useHistory() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load conversations from API on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/conversations', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to load conversations');
      }

      const data = await response.json();

      if (data.success && data.conversations) {
        // Convert API format to ChatSession format
        const convertedSessions: ChatSession[] = data.conversations.map((conv: any) => ({
          id: conv.id.toString(),
          title: conv.title,
          messages: [], // Messages loaded separately when needed
          createdAt: new Date(conv.created_at),
          updatedAt: new Date(conv.updated_at),
        }));

        setSessions(convertedSessions);

        // Set current session to most recent
        if (convertedSessions.length > 0) {
          setCurrentSessionId(convertedSessions[0].id);
        }
      }

      setIsLoaded(true);
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setError('Failed to load chat history');
      setIsLoaded(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Get current session with messages
  const currentSession = sessions.find(s => s.id === currentSessionId) || null;

  // Load messages for a specific conversation
  const loadConversationMessages = async (conversationId: string): Promise<ChatMessage[]> => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to load conversation');
      }

      const data = await response.json();

      if (data.success && data.conversation && data.conversation.messages) {
        // Convert API messages to ChatMessage format
        return data.conversation.messages.map((msg: any) => ({
          id: msg.id.toString(),
          text: msg.content,
          isUser: msg.role === 'user',
          timestamp: new Date(msg.created_at),
        }));
      }

      return [];
    } catch (err) {
      console.error('Failed to load conversation messages:', err);
      return [];
    }
  };

  // Create a new conversation
  const createSession = useCallback(async (initialMessage?: ChatMessage): Promise<ChatSession> => {
    try {
      console.log('[useHistory] Creating new conversation...');

      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: 'New Conversation',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[useHistory] Failed to create conversation:', response.status, errorData);
        throw new Error('Failed to create conversation');
      }

      const data = await response.json();
      console.log('[useHistory] Conversation created:', data);

      if (data.success && data.conversation) {
        const newSession: ChatSession = {
          id: data.conversation.id.toString(),
          title: data.conversation.title,
          messages: initialMessage ? [initialMessage] : [],
          createdAt: new Date(data.conversation.created_at),
          updatedAt: new Date(data.conversation.updated_at),
        };

        setSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(newSession.id);

        console.log('[useHistory] New session created with ID:', newSession.id);
        return newSession;
      }

      throw new Error('Invalid response from server');
    } catch (err) {
      console.error('[useHistory] Failed to create conversation:', err);
      setError('Failed to create conversation');
      throw err;
    }
  }, []);

  // Update current session with new messages
  const updateSession = useCallback(async (messages: ChatMessage[]) => {
    if (!currentSessionId) {
      console.warn('[useHistory] No current session ID, skipping message save');
      return;
    }

    try {
      // Save messages to database
      const messagesToSave = messages.map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.text,
      }));

      console.log('[useHistory] Saving messages to conversation:', currentSessionId);
      console.log('[useHistory] Messages to save:', messagesToSave.length);

      const response = await fetch(`/api/conversations/${currentSessionId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          messages: messagesToSave,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));

        // If conversation doesn't exist (404), it might be newly created and not in DB yet
        // Skip the error and let the next save attempt handle it
        if (response.status === 404) {
          console.warn('[useHistory] Conversation not found in database yet, will retry on next save');
          return;
        }

        // Log error for non-404 cases
        console.error('[useHistory] Failed to save messages:', response.status, errorData);
        throw new Error(`Failed to save messages: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      console.log('[useHistory] Messages saved successfully:', data);

      // Update local state optimistically
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
    } catch (err) {
      console.error('[useHistory] Failed to update conversation:', err);
      setError('Failed to save messages');
    }
  }, [currentSessionId]);

  // Delete a session
  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/conversations/${sessionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete conversation');
      }

      setSessions(prev => {
        const filtered = prev.filter(s => s.id !== sessionId);

        // If we deleted the current session, switch to another or null
        if (currentSessionId === sessionId) {
          setCurrentSessionId(filtered.length > 0 ? filtered[0].id : null);
        }

        return filtered;
      });
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      setError('Failed to delete conversation');
    }
  }, [currentSessionId]);

  // Switch to a different session
  const switchSession = useCallback(async (sessionId: string) => {
    setCurrentSessionId(sessionId);

    // Load messages for this session if not already loaded
    const session = sessions.find(s => s.id === sessionId);
    if (session && session.messages.length === 0) {
      const messages = await loadConversationMessages(sessionId);
      setSessions(prev => prev.map(s =>
        s.id === sessionId ? { ...s, messages } : s
      ));
    }
  }, [sessions]);

  // Start a new conversation (creates new session)
  const startNewConversation = useCallback(async () => {
    await createSession();
  }, [createSession]);

  return {
    sessions,
    currentSession,
    currentSessionId,
    isLoaded,
    isLoading,
    error,
    createSession,
    updateSession,
    deleteSession,
    switchSession,
    startNewConversation,
    loadConversationMessages,
  };
}
