// Message Bubble Component

import React from "react";
import type { ChatMessage } from "./types";

interface MessageBubbleProps {
  message: ChatMessage;
  isLastMessage?: boolean;
}

export function MessageBubble({
  message,
  isLastMessage = false,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  console.log("[MessageBubble] Rendering message id:", message.id, "status:", message.status, "isLast:", isLastMessage);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4 ${
        isLastMessage ? "mb-2" : ""
      }`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-blue-500 text-white rounded-br-md"
            : "bg-white border border-gray-200 text-gray-900 rounded-bl-md shadow-sm"
        }`}
      >
        {/* Loading state */}
        {message.status === "loading" && (
          <div className="flex items-center gap-1 py-1">
            <span className="w-2 h-2 bg-current rounded-full animate-bounce" />
            <span className="w-2 h-2 bg-current rounded-full animate-bounce delay-100" />
            <span className="w-2 h-2 bg-current rounded-full animate-bounce delay-200" />
          </div>
        )}

        {/* Error state */}
        {message.status === "error" && (
          <div className="flex items-center gap-2 text-red-600">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm">{message.error || "An error occurred"}</span>
          </div>
        )}

        {/* Content */}
        {message.status !== "loading" && message.content && (
          <div className={`whitespace-pre-wrap break-words ${isUser ? "text-white" : "text-gray-900"}`}>
            {message.content}
          </div>
        )}

        {/* Timestamp */}
        {message.status !== "loading" && (
          <div
            className={`text-xs mt-1 ${
              isUser ? "text-blue-100" : "text-gray-500"
            }`}
          >
            {formatTime(message.timestamp)}
          </div>
        )}

        {/* A2UI indicator */}
        {message.a2uiData && message.status === "complete" && (
          <div
            className={`flex items-center gap-1 text-xs mt-2 ${
              isUser ? "text-blue-100" : "text-blue-600"
            }`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
              />
            </svg>
            <span>Contains UI</span>
          </div>
        )}
      </div>
    </div>
  );
}
