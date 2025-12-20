'use client';

import { useRef, useEffect } from 'react';
import { ChatMessage } from '@/types';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';

interface MessageListProps {
  messages: ChatMessage[];
  config?: {
    avatars?: boolean;
    timestamps?: boolean;
    typingIndicator?: boolean;
  };
}

export function MessageList({ messages, config }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {messages.map((message, index) => (
        <div
          key={message.id}
          className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          {message.text === 'Thinking...' && !message.isUser && config?.typingIndicator !== false ? (
            <TypingIndicator />
          ) : (
            <MessageBubble 
              message={message}
              showAvatar={config?.avatars !== false}
              showTimestamp={config?.timestamps !== false}
            />
          )}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
