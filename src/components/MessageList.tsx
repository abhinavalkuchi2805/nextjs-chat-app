'use client';

import { useRef, useEffect } from 'react';
import { ChatMessage } from '@/types';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  config?: {
    avatars?: boolean;
    timestamps?: boolean;
    typingIndicator?: boolean;
  };
}

export function MessageList({ messages, isLoading, config }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isAtBottom = useRef(true); // Track if user is at the bottom
  const prevMessagesLength = useRef(messages.length);

  // Check if we are at the bottom whenever the user scrolls
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;

    // Threshold of 100px to consider "at bottom"
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    isAtBottom.current = distanceToBottom < 100;
  };

  useEffect(() => {
    const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
      messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
    };

    const isNewMessage = messages.length > prevMessagesLength.current;

    if (isNewMessage) {
      // New message: Instant scroll to ensure visibility immediately
      scrollToBottom('auto');
      isAtBottom.current = true;
    } else if (isAtBottom.current) {
      // Streaming update + At Bottom: Keep it pinned
      scrollToBottom('auto');
    }

    prevMessagesLength.current = messages.length;
  }, [messages]);

  // Initial scroll on mount
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, []);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
    >
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

      {/* Show typing indicator when loading and last message is from user */}
      {isLoading && messages.length > 0 && messages[messages.length - 1]?.isUser && config?.typingIndicator !== false && (
        <div className="flex justify-start">
          <TypingIndicator />
        </div>
      )}

      {/* Add height and scroll-margin to ensure visibility above inputs */}
      <div ref={messagesEndRef} className="h-4 scroll-my-4" />
    </div>
  );
}
