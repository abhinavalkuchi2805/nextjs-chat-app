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
  return (
    <div
      className={`flex items-end gap-3 max-w-[80%] animate-fade-in-up ${
        message.isUser ? 'flex-row-reverse' : ''
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
        className={`p-4 ${
          message.isUser 
            ? 'rounded-2xl rounded-br-none bg-[var(--btn-primary-bg)] shadow-md' 
            : 'glass rounded-2xl rounded-bl-none'
        }`}
      >
        <div className={`text-sm leading-relaxed markdown-content ${
          message.isUser ? 'text-white' : 'text-[var(--foreground)]'
        }`}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              // Customize paragraph rendering
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              
              // Customize list rendering
              ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
              li: ({ children }) => <li className="ml-2">{children}</li>,
              
              // Customize code rendering
              code: ({ inline, className, children, ...props }: any) => {
                const match = /language-(\w+)/.exec(className || '');
                return !inline ? (
                  <pre className="bg-black/20 rounded-lg p-3 my-2 overflow-x-auto">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                ) : (
                  <code className="bg-black/10 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                    {children}
                  </code>
                );
              },
              
              // Customize heading rendering
              h1: ({ children }) => <h1 className="text-xl font-bold mb-2 mt-3">{children}</h1>,
              h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-3">{children}</h2>,
              h3: ({ children }) => <h3 className="text-base font-bold mb-2 mt-2">{children}</h3>,
              
              // Customize link rendering
              a: ({ href, children }) => (
                <a 
                  href={href} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="underline hover:opacity-80"
                >
                  {children}
                </a>
              ),
              
              // Customize blockquote rendering
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-current pl-3 my-2 opacity-80">
                  {children}
                </blockquote>
              ),
              
              // Customize table rendering
              table: ({ children }) => (
                <div className="overflow-x-auto my-2">
                  <table className="min-w-full border-collapse border border-current/20">
                    {children}
                  </table>
                </div>
              ),
              th: ({ children }) => (
                <th className="border border-current/20 px-3 py-2 bg-black/10 font-semibold text-left">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border border-current/20 px-3 py-2">
                  {children}
                </td>
              ),
              
              // Customize horizontal rule
              hr: () => <hr className="my-3 border-current/20" />,
              
              // Customize strong/bold
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              
              // Customize emphasis/italic
              em: ({ children }) => <em className="italic">{children}</em>,
            }}
          >
            {message.text}
          </ReactMarkdown>
        </div>
        {showTimestamp && (
          <span className={`text-[10px] mt-2 block text-right ${
            message.isUser ? 'text-white/60' : 'text-[var(--muted)]'
          }`}>
            {message.id === 'welcome' ? '' : `${message.timestamp.getHours().toString().padStart(2, '0')}:${message.timestamp.getMinutes().toString().padStart(2, '0')}`}
          </span>
        )}
      </div>
    </div>
  );
}
