// Chat Input Component

import React from "react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled: boolean;
  isLoading: boolean;
}

export function ChatInput({
  onSendMessage,
  disabled,
  isLoading,
}: ChatInputProps) {
  const [value, setValue] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (trimmed && !isLoading) {
      onSendMessage(trimmed);
      setValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  React.useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, [value]);

  // Focus on mount
  React.useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const maxLength = 4000;
  const remaining = maxLength - value.length;

  return (
    <div className="border-t bg-white p-4">
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || isLoading}
            placeholder={
              disabled
                ? "Configure server URL to start chatting"
                : isLoading
                ? "Processing..."
                : "Type your message... (Enter to send, Shift+Enter for new line)"
            }
            maxLength={maxLength}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[60px] max-h-[150px] disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSend}
            disabled={!value.trim() || isLoading || disabled}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex-shrink-0 self-end"
          >
            {isLoading ? (
              <div className="flex items-center gap-1">
                <span className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin" />
              </div>
            ) : (
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
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </button>
        </div>
        <div className="flex justify-between items-center">
          <span
            className={`text-xs ${
              remaining < 100 ? "text-orange-600" : "text-gray-500"
            }`}
          >
            {remaining} characters remaining
          </span>
          {remaining < 100 && (
            <span className="text-xs text-orange-600">
              Warning: Approaching character limit
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
