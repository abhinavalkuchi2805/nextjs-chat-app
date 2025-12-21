'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useChat } from '@ai-sdk/react';
import { ChatMessage, StatsData } from '@/types';
import { useHistory } from '@/hooks/useHistory';
import { HistorySidebar } from './HistorySidebar';
import { ChatHeader } from './ChatHeader';
import { ChatInput } from './ChatInput';
import { MessageList } from './MessageList';
import { UploadStatus } from './UploadStatus';
import { LoadingBar } from './LoadingBar';
import { AIProvider } from './ModelSelector';
import { ChatUIConfig, ChatUIConfigPartial, chatUIConfig } from '@/config/chatUIConfig';
import { WelcomeScreen } from './WelcomeScreen';

interface ChatUIProps {
  config?: ChatUIConfigPartial;
}

const createWelcomeMessage = (): ChatMessage => ({
  id: 'welcome',
  text: "Hello! I'm your AI Analytics Assistant. I can help you with:\n\n• **Data queries** - Ask about purchases, page views, or searches from your uploaded data\n• **General questions** - I can answer general questions using AI\n",
  isUser: false,
  timestamp: new Date(0),
});

export default function ChatUI({ config: customConfig }: ChatUIProps = {}) {
  const config: ChatUIConfig = {
    components: { ...chatUIConfig.components, ...customConfig?.components },
    messages: { ...chatUIConfig.messages, ...customConfig?.messages },
    features: { ...chatUIConfig.features, ...customConfig?.features },
    theme: { ...chatUIConfig.theme, ...customConfig?.theme },
  };

  const {
    sessions,
    currentSession,
    currentSessionId,
    isLoaded,
    createSession,
    updateSession,
    deleteSession,
    switchSession,
    startNewConversation,
  } = useHistory();

  const [stats, setStats] = useState<StatsData | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(config.components.sidebar);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('openai');
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (data.user?.name) setUserName(data.user.name);
      } catch (e) {
        // Silent fail
      }
    };
    fetchUser();
  }, []);

  const [inputValue, setInputValue] = useState('');

  // Vercel AI SDK useChat hook

  const chatHelpers = useChat({
    // api defaults to '/api/chat'
    body: {
      provider: selectedProvider,
    },
    initialMessages: config.messages.welcomeMessage
      ? [{
        id: 'welcome',
        role: 'assistant',
        content: createWelcomeMessage().text, // Use content instead of parts
        createdAt: new Date(0)
      }]
      : [],
    onFinish: (message: any) => {
      console.log('[ChatUI] Stream finished. Final message:', JSON.stringify(message, null, 2));
    },
    onError: (error: Error) => {
      console.error('[ChatUI] Chat error:', error);
    },
    onRequest: (options: any) => {
      console.log('[ChatUI] Sending request to API');
      console.log('[ChatUI] Request body:', JSON.stringify(options.body, null, 2));
    }
  } as any);

  const { messages, sendMessage, status, setMessages } = chatHelpers;

  // Sync session messages to local chat state when switching sessions
  useEffect(() => {
    if (!isLoaded) return;

    if (currentSession && currentSession.messages.length > 0) {
      // Convert our ChatMessage[] to Vercel Message[]
      const convertedMessages = currentSession.messages.map((m: any) => ({
        id: m.id,
        role: m.isUser ? 'user' : 'assistant',
        content: m.text, // Use content instead of parts
        createdAt: new Date(m.timestamp)
      })) as any;
      setMessages(convertedMessages);
    } else if (messages.length === 0 && config.messages.welcomeMessage) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: createWelcomeMessage().text, // Use content instead of parts
        createdAt: new Date(0)
      }] as any);
    }
  }, [currentSessionId, isLoaded]); // Only depend on session changes

  // Sync chat state back to history session (save to database)
  useEffect(() => {
    if (!isLoaded || !currentSessionId) return;

    // Debounce update to avoid too many API calls
    const timeout = setTimeout(() => {
      // Convert Vercel Message[] back to our ChatMessage[]
      const myMessages: ChatMessage[] = messages.map((m: any) => ({
        id: m.id,
        text: m.content || m.text || (m.parts && m.parts[0]?.text) || '',
        isUser: m.role === 'user',
        timestamp: m.createdAt || new Date()
      }));

      // Only update if we have meaningful messages (more than just welcome)
      if (myMessages.length > 1 || (myMessages.length === 1 && myMessages[0].id !== 'welcome')) {
        updateSession(myMessages);
      }
    }, 2000); // 2 second debounce

    return () => clearTimeout(timeout);
  }, [messages, currentSessionId, isLoaded, updateSession]);


  // Load stats
  const loadStats = useCallback(async () => {
    if (!config.features.stats) return;
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();
      if (data.totalRecords > 0) setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, [config.features.stats]);

  useEffect(() => {
    if (config.features.stats) loadStats();
  }, [loadStats, config.features.stats]);

  // Handlers
  const handleFileUpload = async (file: File) => {
    // ... (Keep existing upload logic, simplified for brevity in this plan, but full code below)
    setUploadStatus(`Processing ${file.name}...`);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const result = await res.json();
      if (result.success) {
        setUploadStatus(result.message);
        await loadStats();
        // Add a system message equivalent
        setMessages((prev: any) => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          parts: [{ type: 'text', text: `Successfully loaded data!\n\n${result.message}` }],
          createdAt: new Date()
        }]);
      } else {
        setUploadStatus(result.error);
      }
    } catch (e: any) {
      setUploadStatus(`Error: ${e.message}`);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const content = inputValue;
    setInputValue(''); // Clear immediately

    // Ensure session exists - WAIT for creation to complete and use the returned session
    let sessionId = currentSessionId;
    if (!sessionId) {
      console.log('[ChatUI] No session exists, creating new conversation...');
      try {
        const newSession = await createSession();
        sessionId = newSession.id;
        console.log('[ChatUI] Created new conversation with ID:', sessionId);
      } catch (error) {
        console.error('[ChatUI] Failed to create conversation:', error);
        return; // Don't proceed if conversation creation failed
      }
    }

    // Send message (triggers streaming)
    // The Vercel AI SDK's sendMessage expects a message object
    try {
      console.log('[ChatUI] Sending message:', content);
      console.log('[ChatUI] sendMessage type:', typeof sendMessage);
      console.log('[ChatUI] Current messages count:', messages.length);
      console.log('[ChatUI] Using session ID:', sessionId);

      if (typeof sendMessage === 'function') {
        // Send as a message object with text property (Vercel AI SDK format)
        await sendMessage({
          text: content
        });
      } else {
        console.error('ChatUI Error: sendMessage is not a function. chatHelpers keys:', Object.keys(chatHelpers));
        alert(`Debug Error: 'sendMessage' is missing from useChat return.\\nAvailable keys: ${Object.keys(chatHelpers).join(', ')}\\nPlease report this.`);
      }
    } catch (error) {
      console.error('[ChatUI] Error sending message:', error);
    }
  };

  // Convert Vercel messages to ChatMessage for display components
  const displayMessages: ChatMessage[] = messages.map((m: any) => {
    // Extract text from various possible locations in the message
    let messageText = '';

    if (m.content) {
      messageText = m.content;
    } else if (m.text) {
      messageText = m.text;
    } else if (m.parts && Array.isArray(m.parts) && m.parts.length > 0) {
      // Handle parts array - concatenate all text parts
      messageText = m.parts
        .filter((p: any) => p.type === 'text' || p.text)
        .map((p: any) => p.text || p.content || '')
        .join('');
    }

    // Remove suggested questions section from AI messages (they'll be shown separately)
    if (m.role === 'assistant') {
      const pattern = /(?:(?:\*\*|#{1,3}|##)?\s*(?:Suggested|Follow-up|Related|Sample)\s*(?:Questions|Queries|Prompts|Topics)(?:\*\*|#{1,3}|##)?):?\s*(?:[\r\n]+)((?:(?:[-*]|\d+\.)\s+.+(?:[\r\n]+|$))+)/i;
      const fallbackPattern = /(?:(?:\*\*|#{1,3}|##)?\s*(?:Suggested|Follow-up|Related|Sample)\s*(?:Questions|Queries|Prompts|Topics)(?:\*\*|#{1,3}|##)?):?[\s\S]*$/i;

      messageText = messageText.replace(pattern, '').replace(fallbackPattern, '').trim();
    }

    return {
      id: m.id,
      text: messageText,
      isUser: m.role === 'user',
      timestamp: m.createdAt || new Date()
    };
  });

  // Get last AI message WITH suggested questions for the SuggestedQuestions component
  // Only update when streaming is complete to prevent infinite loops
  const [extractedQuestions, setExtractedQuestions] = useState<string>('');
  const lastProcessedMessageId = useRef<string>('');

  useEffect(() => {
    // Only extract when streaming is done
    if (status !== 'ready') return;

    const aiMessages = messages.filter((m: any) => m.role === 'assistant');
    if (aiMessages.length === 0) {
      if (extractedQuestions !== '') {
        setExtractedQuestions('');
        lastProcessedMessageId.current = '';
      }
      return;
    }

    const lastMsg = aiMessages[aiMessages.length - 1];

    // Only process if this is a new message
    if ((lastMsg as any).id === lastProcessedMessageId.current) {
      return;
    }

    let fullText = '';

    if ((lastMsg as any).content) {
      fullText = (lastMsg as any).content;
    } else if ((lastMsg as any).text) {
      fullText = (lastMsg as any).text;
    } else if ((lastMsg as any).parts && Array.isArray((lastMsg as any).parts)) {
      fullText = (lastMsg as any).parts
        .filter((p: any) => p.type === 'text' || p.text)
        .map((p: any) => p.text || p.content || '')
        .join('');
    }

    console.log('[DEBUG] ChatUI extracting from message:', (lastMsg as any).id);
    console.log('[DEBUG] Full text:', fullText);
    console.log('[DEBUG] Setting extracted questions...');

    setExtractedQuestions(fullText);
    lastProcessedMessageId.current = (lastMsg as any).id;
  }, [status, messages]);

  const handleSuggestionSelect = (query: string) => {
    setInputValue(query);
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar - logic kept same */}
      {config.components.sidebar && config.features.conversationHistory && (
        <HistorySidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          onSelectSession={switchSession}
          onNewChat={() => {
            startNewConversation();
            setMessages(config.messages.welcomeMessage ? [{ id: 'welcome', role: 'assistant', content: createWelcomeMessage().text, createdAt: new Date(0) }] as any : []);
          }}
          onDeleteSession={deleteSession}
        />
      )}

      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${(config.components.sidebar && sidebarOpen) ? 'lg:ml-72' : 'ml-0'
        }`}>
        {config.components.header && (
          <ChatHeader
            stats={stats}
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            onNewChat={!(displayMessages.length === 0 || (displayMessages.length === 1 && displayMessages[0].id === 'welcome')) ? () => {
              startNewConversation();
              setMessages(config.messages.welcomeMessage ? [{ id: 'welcome', role: 'assistant', content: createWelcomeMessage().text, createdAt: new Date(0) }] as any : []);
            } : undefined}
          />
        )}

        {config.components.uploadStatus && <UploadStatus status={uploadStatus} loading={false} />}
        {config.components.loadingBar && <LoadingBar loading={status !== 'ready'} />}


        <div className="flex-1 w-full max-w-6xl mx-auto flex flex-col overflow-hidden">
          {displayMessages.length === 0 || (displayMessages.length === 1 && displayMessages[0].id === 'welcome') ? (
            <WelcomeScreen
              userName={userName}
              onSelect={(val) => {
                setInputValue(val);
                // Optional: auto-send could be implemented here or user clicks send
              }} />
          ) : (
            <MessageList
              messages={displayMessages}
              isLoading={status !== 'ready'}
              config={{
                avatars: config.messages.avatars,
                timestamps: config.messages.timestamps,
                typingIndicator: config.components.typingIndicator,
              }}
            />
          )}
        </div>

        <ChatInput
          inputText={inputValue}
          loading={status !== 'ready'}
          showSuggestions={false} // Disable old suggestions since we have WelcomeScreen
          selectedProvider={selectedProvider}
          lastAIMessage={extractedQuestions}
          onInputChange={setInputValue}
          onSend={handleSendMessage}
          onFileSelect={config.components.fileUpload ? (f) => f && handleFileUpload(f) : undefined}
          onSuggestionSelect={(val) => {
            setInputValue(val);
            // Optional: auto-send
          }}
          onProviderChange={setSelectedProvider}
        />
      </div>
    </div>
  );
}
