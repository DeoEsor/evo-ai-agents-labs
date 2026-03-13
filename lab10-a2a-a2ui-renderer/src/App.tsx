// Main App Component - A2A Chat Interface

import React, { useEffect, useCallback, useMemo } from "react";
import { useA2UI } from "./a2ui/useA2UI";
import { A2AClient } from "./a2a/client";
import { convertToA2UIMessage } from "./a2a/a2a-to-a2ui-adapter";
import { ServerConfig } from "./chat/ServerConfig";
import { ChatHistory } from "./chat/ChatHistory";
import { ChatInput } from "./chat/ChatInput";
import { LoadingScreen } from "./chat/LoadingScreen";
import { getServerUrl, saveServerUrl, saveChatHistory, clearChatHistory, getContextId, saveContextId } from "./chat/storage";
import type { ChatMessage } from "./chat/types";

function App() {
  // State
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [serverUrl, setServerUrlState] = React.useState(getServerUrl());
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedMessageId, setSelectedMessageId] = React.useState<string>();
  const [isConnected, setIsConnected] = React.useState(false);
  const [contextId, setContextId] = React.useState<string | null>(null);

  // A2A Client
  const client = useMemo(() => new A2AClient(serverUrl), [serverUrl]);

  // A2UI hook for rendering UI with client and contextId for action handling
  const { rendered, handleMessage, reset, setIsLoading: setA2UILoading } = useA2UI({
    client,
    getContextId,
    onValueChange: (path, value) => {
      console.log("A2UI Value Change:", { path, value });
      // Value changes are handled internally - dataModel is updated automatically
    },
    onCreateAssistantMessage: (messageId) => {
      // Create placeholder assistant message for action response
      const assistantMessage: ChatMessage = {
        id: `${messageId}-response`,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        status: "loading",
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setSelectedMessageId(assistantMessage.id);
      console.log("[App] Created assistant message for action:", assistantMessage.id);
    },
  });

  // Load chat history and contextId on mount
  useEffect(() => {
    const saved = localStorage.getItem("a2a-chat-history");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessages(parsed.messages || []);
      } catch (e) {
        console.warn("Failed to load chat history:", e);
      }
    }

    // Load saved contextId
    const savedContextId = getContextId();
    if (savedContextId) {
      setContextId(savedContextId);
      console.log("[App] Loaded contextId from storage:", savedContextId);
    }
  }, []);

  // Handle sending messages
  const handleSendMessage = useCallback(
    async (text: string) => {
      if (isLoading || !text.trim()) return;

      // Generate message ID and pass it to client
      const messageId = `msg-${Date.now()}`;
      console.log("[App] handleSendMessage called. messageId:", messageId, "text:", text, "contextId:", contextId);

      const userMessage: ChatMessage = {
        id: messageId,
        role: "user",
        content: text,
        timestamp: Date.now(),
        status: "complete",
      };

      const assistantMessage: ChatMessage = {
        id: `${messageId}-response`,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        status: "loading",
      };

      console.log("[App] Created assistantMessage with id:", assistantMessage.id, "status:", assistantMessage.status);
      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setIsLoading(true);
      console.log("[App] setIsLoading(true) called");
      setSelectedMessageId(assistantMessage.id);
      reset();

      try {
        await client.sendMessage(text, messageId, contextId);
        console.log("[App] client.sendMessage resolved");
      } catch (error) {
        console.log("[App] Error in handleSendMessage:", error);
        setMessages((prev) => {
          const updated = [...prev];
          const lastMessage = updated[updated.length - 1];
          if (lastMessage?.status === "loading") {
            return updated.map((msg, idx) =>
              idx === updated.length - 1
                ? { ...msg, status: "error", error: (error as Error).message }
                : msg
            );
          }
          return updated;
        });
        setIsLoading(false);
      }
    },
    [client, isLoading, reset, contextId]
  );

  // Handle server URL change
  const handleServerUrlChange = useCallback(
    (url: string) => {
      setServerUrlState(url);
      saveServerUrl(url);
    },
    []
  );

  // Handle message selection (render A2UI from selected message)
  const handleMessageSelection = useCallback(
    (messageId: string) => {
      setSelectedMessageId(messageId);
      const msg = messages.find((m) => m.id === messageId);
      if (msg?.a2uiData && Array.isArray(msg.a2uiData) && msg.a2uiData.length > 0) {
        const a2uiMsg = convertToA2UIMessage(msg.a2uiData);
        handleMessage(a2uiMsg);
      }
    },
    [messages, handleMessage]
  );

  // Handle clear history
  const handleClearHistory = useCallback(() => {
    if (window.confirm("Are you sure you want to clear all chat history?")) {
      clearChatHistory();
      setMessages([]);
      reset();
      setSelectedMessageId(undefined);
    }
  }, [reset]);

  // Configure A2A client callbacks
  useEffect(() => {
    console.log("[App] useEffect - Registering A2A client callbacks");
    client.onCallbacks({
      onMessage: () => {
        console.log("[App] onMessage called");
        // We'll handle streaming updates via onProgress
      },
      onProgress: (text) => {
        console.log("[App] onProgress called. text length:", text.length);
        // Only update text content during progress; a2uiData is set in onComplete with aggregated data
        setMessages((prev) => {
          const updated = [...prev];
          const lastMessage = updated[updated.length - 1];
          console.log("[App] onProgress - Last message status:", lastMessage?.status);
          if (lastMessage?.status === "loading") {
            return updated.map((msg, idx) =>
              idx === updated.length - 1
                ? { ...msg, content: text }
                : msg
            );
          }
          return updated;
        });
      },
      onComplete: (_messageId, chatMessage, receivedContextId) => {
        console.log("[App] onComplete called. messageId:", _messageId, "chatMessage:", chatMessage, "contextId:", receivedContextId);

        try {
          // Save contextId from the response
          if (receivedContextId && receivedContextId !== contextId) {
            setContextId(receivedContextId);
            saveContextId(receivedContextId);
            console.log("[App] Updated contextId:", receivedContextId);
          }

          // Update messages FIRST, then set isLoading
          setMessages((prev) => {
            console.log("[App] onComplete - setMessages called. prev.length:", prev.length);
            const updated = [...prev];
            const lastMessage = updated[updated.length - 1];
            console.log("[App] onComplete - Last message in updated:", lastMessage?.id, lastMessage?.status);
            if (lastMessage?.status === "loading") {
              const newUpdated = updated.map((msg, idx) =>
                idx === updated.length - 1 ? { ...msg, ...chatMessage, contextId: receivedContextId } : msg
              );
              console.log("[App] onComplete - Updated last message to status:", newUpdated[newUpdated.length - 1]?.status);
              // Save the updated messages to history
              saveChatHistory(newUpdated);
              return newUpdated;
            }
            console.log("[App] onComplete - Last message is NOT loading, returning prev as-is");
            return updated;
          });

          // Render A2UI if present in the completed message - do this OUTSIDE the loading check
          // so action responses also get their A2UI data processed
          if (chatMessage.a2uiData && Array.isArray(chatMessage.a2uiData) && chatMessage.a2uiData.length > 0) {
            console.log("[App] onComplete - Rendering A2UI from completed message, items:", chatMessage.a2uiData.length);
            console.log("[App] onComplete - A2UI data keys:", chatMessage.a2uiData.map((d: any) => Object.keys(d)));
            const a2uiMessage = convertToA2UIMessage(chatMessage.a2uiData);
            console.log("[App] onComplete - Converted A2UI message:", JSON.stringify(a2uiMessage).substring(0, 500));
            handleMessage(a2uiMessage);
          } else {
            console.log("[App] onComplete - No valid a2uiData in chatMessage, skipping A2UI rendering");
          }
        } catch (e) {
          console.error("[App] onComplete - Error processing response:", e);
        } finally {
          // Always clear loading state, even if A2UI processing fails
          setIsLoading(false);
          setA2UILoading(false);
          console.log("[App] onComplete - setIsLoading(false) called");
          setSelectedMessageId(chatMessage.id);
        }
      },
      onError: (error) => {
        setIsLoading(false);
        setA2UILoading(false);
        setMessages((prev) => {
          const updated = [...prev];
          const lastMessage = updated[updated.length - 1];
          if (lastMessage?.status === "loading") {
            return updated.map((msg, idx) =>
              idx === updated.length - 1
                ? { ...msg, status: "error", error: error.message }
                : msg
            );
          }
          return updated;
        });
      },
    });

    setIsConnected(true);
    return () => {
      console.log("[App] useEffect - Cleanup (unregistering callbacks)");
    };
  }, [client, handleMessage, contextId, setA2UILoading]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with Server Config */}
      <header className="bg-white border-b px-6 py-3 shadow-sm">
        <ServerConfig
          serverUrl={serverUrl}
          onServerUrlChange={handleServerUrlChange}
          isConnected={isConnected}
        />
      </header>

      {/* Main Content - Split View */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel - Chat History */}
        <div className="w-1/2 min-w-[400px] border-r flex flex-col bg-white">
          <ChatHistory
            messages={messages}
            selectedMessageId={selectedMessageId}
            onSelectMessage={handleMessageSelection}
            onClearHistory={handleClearHistory}
          />

          {/* Chat Input */}
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={!isConnected}
            isLoading={isLoading}
          />
        </div>

        {/* Right Panel - A2UI Rendering */}
        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          {isLoading && !rendered && (
            <LoadingScreen message="Generating UI..." />
          )}

          {rendered ? (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-lg shadow-lg p-6 min-h-[200px]">
                {rendered}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-10 h-10 text-gray-400"
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
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No UI to display
              </h3>
              <p className="text-sm text-gray-600 max-w-md">
                Select a message from the chat history that contains UI components, or
                ask the agent to generate some UI for you.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
