'use client';

import { Bot, User } from 'lucide-react';
import { ChatMessage } from '@/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

interface MessageBubbleProps {
  message: ChatMessage;
  showAvatar?: boolean;
  showTimestamp?: boolean;
}

export function MessageBubble({ message, showAvatar = true, showTimestamp = true }: MessageBubbleProps) {
  // Check if this is a streaming message (content is being updated)
  const isStreaming = !message.isUser && message.text && message.text.length > 0;

  return (
    <div
      className={`flex items-end gap-3 max-w-[80%] animate-fade-in-up ${message.isUser ? 'flex-row-reverse' : ''
        }`}
    >
      {/* Avatar */}
      {showAvatar && (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-[var(--btn-primary-bg)]"
        >
          {message.isUser ? (
            <User className="w-4 h-4 text-white" />
          ) : (
            <Bot className="w-4 h-4 text-white" />
          )}
        </div>
      )}

      {/* Message Content */}
      <div
        className={`p-4 ${message.isUser
          ? 'rounded-2xl rounded-br-none bg-[var(--btn-primary-bg)] shadow-md'
          : 'glass rounded-2xl rounded-bl-none'
          }`}
      >
        <div className={`text-sm leading-relaxed markdown-content ${message.isUser ? 'text-white text-right' : 'text-[var(--foreground)] text-left'
          }`}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              // Customize paragraph rendering - use div to avoid nesting issues with pre/code blocks
              p: ({ children }) => <div className="mb-3 last:mb-0 leading-relaxed">{children}</div>,

              // Customize list rendering
              ul: ({ children }) => <ul className="list-disc mb-3 space-y-1.5 ml-6">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal mb-3 space-y-1.5 ml-6">{children}</ol>,
              li: ({ children }) => <li className="ml-2 leading-relaxed">{children}</li>,

              // Customize code rendering - inline ONLY
              code: ({ inline, className, children, ...props }: any) => {
                const match = /language-(\w+)/.exec(className || '');
                // For inline code, use adaptive styling
                // For block code, let the 'pre' component handle the container
                return inline ? (
                  <code className="bg-[var(--inline-code-bg)] px-2 py-0.5 rounded text-sm font-mono border border-current/10" {...props}>
                    {children}
                  </code>
                ) : (
                  // Just return children for blocks, 'pre' handles the styling
                  <code className={`${className} text-sm font-mono bg-transparent`} {...props}>
                    {children}
                  </code>
                );
              },

              // Customize pre rendering (Block Container)
              pre: ({ children }) => (
                <pre className="bg-[var(--code-bg)] rounded-lg p-4 my-3 overflow-x-auto border border-white/10 text-left">
                  {children}
                </pre>
              ),

              // Customize heading rendering
              h1: ({ children }) => <h1 className="text-2xl font-bold mb-3 mt-4 border-b border-current/20 pb-2">{children}</h1>,
              h2: ({ children }) => <h2 className="text-xl font-bold mb-3 mt-4">{children}</h2>,
              h3: ({ children }) => <h3 className="text-lg font-semibold mb-2 mt-3">{children}</h3>,

              // Customize link rendering
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline transition-colors"
                >
                  {children}
                </a>
              ),

              // Customize blockquote rendering
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-blue-400 pl-4 my-3 italic opacity-90 bg-black/10 py-2 rounded-r">
                  {children}
                </blockquote>
              ),

              // Customize table rendering
              table: ({ children }) => (
                <div className="overflow-x-auto my-3 rounded-lg border border-white/10">
                  <table className="min-w-full border-collapse">
                    {children}
                  </table>
                </div>
              ),
              th: ({ children }) => (
                <th className="border border-white/10 px-4 py-2 bg-black/20 font-semibold text-left">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border border-white/10 px-4 py-2">
                  {children}
                </td>
              ),

              // Customize horizontal rule
              hr: () => <hr className="my-4 border-current/30" />,

              // Customize strong/bold - make it more prominent
              strong: ({ children }) => <strong className="font-bold">{children}</strong>,

              // Customize emphasis/italic
              em: ({ children }) => <em className="italic opacity-90">{children}</em>,
            }}
          >
            {message.text}
          </ReactMarkdown>
        </div>
        {showTimestamp && (
          <span className={`text-[10px] mt-2 block text-right ${message.isUser ? 'text-white/60' : 'text-[var(--muted)]'
            }`}>
            {message.id === 'welcome' ? '' : `${message.timestamp.getHours().toString().padStart(2, '0')}:${message.timestamp.getMinutes().toString().padStart(2, '0')}`}
          </span>
        )}
      </div>
    </div>
  );
}
