// Chat History Component

import React from "react";
import { MessageBubble } from "./MessageBubble";
import type { ChatMessage } from "./types";

interface ChatHistoryProps {
  messages: ChatMessage[];
  selectedMessageId?: string;
  onSelectMessage?: (messageId: string) => void;
  onClearHistory?: () => void;
}

export function ChatHistory({
  messages,
  selectedMessageId,
  onSelectMessage,
  onClearHistory,
}: ChatHistoryProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  React.useLayoutEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isLastMessage = (index: number) => index === messages.length - 1;

  const hasMessages = messages.length > 0;
  const hasUI = messages.some((m) => m.a2uiData);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-gray-50 flex justify-between items-center">
        <h2 className="text-sm font-semibold text-gray-900">Chat History</h2>
        <div className="flex gap-2">
          {hasUI && (
            <span className="text-xs text-gray-600 px-2 py-1 bg-blue-100 rounded-md">
              {messages.filter((m) => m.a2uiData).length} UI messages
            </span>
          )}
          {hasMessages && onClearHistory && (
            <button
              onClick={onClearHistory}
              className="text-xs text-red-600 hover:text-red-700 px-2 py-1 hover:bg-red-50 rounded-md transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-4"
      >
        {hasMessages ? (
          <>
            {messages.map((message, index) => (
              <div key={message.id}>
                <MessageBubble
                  message={message}
                  isLastMessage={isLastMessage(index)}
                />
                {/* Click area for selecting messages with UI */}
                {message.a2uiData && onSelectMessage && (
                  <div
                    className={`mt-1 mb-4 text-center cursor-pointer ${
                      selectedMessageId === message.id
                        ? "text-blue-600"
                        : "text-gray-400 hover:text-blue-500"
                    }`}
                    onClick={() => onSelectMessage(message.id)}
                  >
                    <span className="text-xs hover:underline">
                      {selectedMessageId === message.id
                        ? "Currently viewing UI above"
                        : "View UI"}
                    </span>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center px-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Start a conversation
            </h3>
            <p className="text-sm text-gray-600">
              Send a message to begin chatting with the A2UI agent.
              <br />
              Try asking to generate some UI components!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
