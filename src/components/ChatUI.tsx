'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
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
  const [inputValue, setInputValue] = useState('');

  // Vercel AI SDK useChat hook
  const { messages, append, isLoading, setMessages } = useChat({
    // api defaults to '/api/chat'
    body: {
      provider: selectedProvider,
    },
    initialMessages: config.messages.welcomeMessage
      ? [{ id: 'welcome', role: 'assistant', content: createWelcomeMessage().text, createdAt: new Date(0) }]
      : [],
    onFinish: (message: any) => {
      // Sync with history when a message cycle is complete
      // We'll update the session in the useEffect below which watches 'messages'
    },
    onError: (error: Error) => {
      console.error('Chat error:', error);
      // You might want to add a visible error message here
    }
  } as any) as any;

  // Sync session messages to local chat state when switching sessions
  useEffect(() => {
    if (!isLoaded) return;

    if (currentSession && currentSession.messages.length > 0) {
      // Convert our ChatMessage[] to Vercel Message[]
      const convertedMessages = currentSession.messages.map((m: any) => ({
        id: m.id,
        role: m.isUser ? 'user' : 'assistant',
        content: m.text,
        createdAt: new Date(m.timestamp)
      })) as any;
      setMessages(convertedMessages);
    } else if (messages.length === 0 && config.messages.welcomeMessage) {
      setMessages([{ id: 'welcome', role: 'assistant', content: createWelcomeMessage().text, createdAt: new Date(0) }]);
    }
  }, [currentSessionId, isLoaded, currentSession]); // Removed messages/setMessages from deps to avoid loops

  // Sync chat state back to history session
  useEffect(() => {
    if (!isLoaded || !currentSessionId) return;
    // Debounce update
    const timeout = setTimeout(() => {
      // Convert Vercel Message[] back to our ChatMessage[]
      const myMessages: ChatMessage[] = messages.map((m: any) => ({
        id: m.id,
        text: m.content,
        isUser: m.role === 'user',
        timestamp: m.createdAt || new Date()
      }));

      // Only update if differnt? updateSession handles diffs usually, or simple overwrite
      // We only update if we have meaningful messages (more than just welcome)
      if (myMessages.length > 1 || (myMessages.length === 1 && myMessages[0].id !== 'welcome')) {
        updateSession(myMessages);
      }
    }, 1000);
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
          content: `Successfully loaded data!\n\n${result.message}`,
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

    // Ensure session exists
    if (!currentSessionId) {
      createSession();
    }

    // Append message (triggers streaming)
    await append({
      role: 'user',
      content: content
    });
    // Input is cleared automatically by useChat? No, wait. 
    // append return value is promise.
    // We should allow append to handle it.
  };

  // Convert Vercel messages to ChatMessage for display components
  const displayMessages: ChatMessage[] = messages.map((m: any) => ({
    id: m.id,
    text: m.content,
    isUser: m.role === 'user',
    timestamp: m.createdAt || new Date()
  }));

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
            setMessages(config.messages.welcomeMessage ? [{ id: 'welcome', role: 'assistant', content: createWelcomeMessage().text, createdAt: new Date(0) }] : []);
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
            onNewChat={() => {
              startNewConversation();
              setMessages(config.messages.welcomeMessage ? [{ id: 'welcome', role: 'assistant', content: createWelcomeMessage().text, createdAt: new Date(0) }] : []);
            }}
          />
        )}

        {config.components.uploadStatus && <UploadStatus status={uploadStatus} loading={false} />}
        {config.components.loadingBar && <LoadingBar loading={isLoading} />}

        <div className="flex-1 w-full max-w-6xl mx-auto flex flex-col overflow-hidden">
          <MessageList
            messages={displayMessages}
            config={{
              avatars: config.messages.avatars,
              timestamps: config.messages.timestamps,
              typingIndicator: config.components.typingIndicator,
            }}
          />
        </div>

        <ChatInput
          inputText={inputValue}
          loading={isLoading}
          showSuggestions={config.components.suggestedQueries && (!messages || messages.filter((m: any) => m.role === 'user').length === 0)}
          selectedProvider={selectedProvider}
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
