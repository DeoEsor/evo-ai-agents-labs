// localStorage Utilities

import type { ChatMessage, ChatHistoryStorage } from "./types";

const STORAGE_KEY = "a2a-chat-history";
const CONTEXT_ID_KEY = "a2a-context-id";
const SERVER_URL_KEY = "a2a-server-url";
const DEFAULT_SERVER_URL = "http://localhost:8001";

/**
 * Save chat history to localStorage
 */
export function saveChatHistory(messages: ChatMessage[]): void {
  try {
    const storage: ChatHistoryStorage = {
      messages,
      serverUrl: getServerUrl(),
      lastUpdated: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
  } catch (error) {
    console.warn("Failed to save chat history:", error);
  }
}

/**
 * Load chat history from localStorage
 */
export function loadChatHistory(): ChatMessage[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];

    const storage: ChatHistoryStorage = JSON.parse(data);
    return storage.messages || [];
  } catch (error) {
    console.warn("Failed to load chat history:", error);
    return [];
  }
}

/**
 * Save server URL to localStorage
 */
export function saveServerUrl(url: string): void {
  try {
    localStorage.setItem(SERVER_URL_KEY, url);
  } catch (error) {
    console.warn("Failed to save server URL:", error);
  }
}

/**
 * Get server URL from localStorage, with default fallback
 */
export function getServerUrl(): string {
  try {
    return localStorage.getItem(SERVER_URL_KEY) || DEFAULT_SERVER_URL;
  } catch (error) {
    console.warn("Failed to get server URL:", error);
    return DEFAULT_SERVER_URL;
  }
}

/**
 * Clear chat history from localStorage
 */
export function clearChatHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CONTEXT_ID_KEY);
  } catch (error) {
    console.warn("Failed to clear chat history:", error);
  }
}

/**
 * Save context ID to localStorage
 */
export function saveContextId(contextId: string): void {
  try {
    localStorage.setItem(CONTEXT_ID_KEY, contextId);
  } catch (error) {
    console.warn("Failed to save context ID:", error);
  }
}

/**
 * Get context ID from localStorage
 */
export function getContextId(): string | null {
  try {
    return localStorage.getItem(CONTEXT_ID_KEY);
  } catch (error) {
    console.warn("Failed to get context ID:", error);
    return null;
  }
}
