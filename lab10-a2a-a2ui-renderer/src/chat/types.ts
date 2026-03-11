// Chat UI Type Definitions

import type { A2AUIData } from "../a2a/types";

/**
 * Chat message interface
 */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  a2uiData?: A2AUIData[];
  contextId?: string;
  status: "sending" | "loading" | "complete" | "error";
  error?: string;
}

/**
 * Chat history storage format
 */
export interface ChatHistoryStorage {
  messages: ChatMessage[];
  serverUrl: string;
  lastUpdated: number;
}
