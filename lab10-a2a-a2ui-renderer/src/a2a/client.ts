// A2A SSE Client

import type { A2ARequest, A2ASSEMessage, ChatMessage, A2AUIData } from "./types";
import {
  extractTextContent,
  hasA2UIData,
  isStreamComplete,
} from "./message-parser";

export interface A2AClientCallbacks {
  onMessage?: (message: A2ASSEMessage) => void;
  onComplete?: (messageId: string, chatMessage: ChatMessage, contextId: string) => void;
  onError?: (error: Error) => void;
  onProgress?: (text: string, a2uiData?: unknown) => void;
}

/**
 * A2A Client for communicating with A2A protocol server
 * Handles POST requests for sending messages and SSE streams for receiving responses
 */
export class A2AClient {
  private serverUrl: string;
  private callbacks: A2AClientCallbacks = {};
  private controller: AbortController | null = null;

  constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
  }

  /**
   * Set callbacks for client events
   */
  onCallbacks(callbacks: A2AClientCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Send a message to the A2A server
   * Returns a promise that resolves when the message is sent
   * Responses are streamed via callbacks
   */
  async sendMessage(userMessage: string, messageId?: string, contextId?: string | null): Promise<string> {
    // Use provided messageId or generate one
    const msgId = messageId || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const request: A2ARequest = {
      id: msgId,
      jsonrpc: "2.0",
      method: "message/stream",
      params: {
        configuration: {
          acceptedOutputModes: ["text/plain", "application/json+a2ui"],
        },
        message: {
          kind: "message",
          messageId: msgId,
          ...(contextId && { contextId }),
          parts: [{ kind: "text", text: userMessage }],
          role: "user",
        },
      },
    };

    // Create abort controller for cancellation
    this.controller = new AbortController();

    try {
      const response = await fetch(this.serverUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-A2A-Extensions": "https://a2ui.org/a2a-extension/a2ui/v0.8",
        },
        body: JSON.stringify(request),
        signal: this.controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Process SSE stream from response body
      await this.processStream(response, msgId);

      return msgId;
    } catch (error) {
      this.callbacks.onError?.(error as Error);
      throw error;
    } finally {
      this.controller = null;
    }
  }

  /**
   * Send a user action to the A2A server (e.g., button click with context data)
   * Returns a promise that resolves when the action is sent
   * Responses are streamed via callbacks
   */
  async sendUserAction(
    actionName: string,
    context: Record<string, unknown>,
    surfaceId: string,
    sourceComponentId: string,
    messageId?: string,
    contextId?: string | null
  ): Promise<string> {
    // Use provided messageId or generate one
    const msgId = messageId || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const request: A2ARequest = {
      id: msgId,
      jsonrpc: "2.0",
      method: "message/stream",
      params: {
        configuration: {
          acceptedOutputModes: ["text/plain", "application/json+a2ui"],
        },
        message: {
          kind: "message",
          messageId: msgId,
          ...(contextId && { contextId }),
          parts: [
            {
              kind: "data",
              data: {
                userAction: {
                  name: actionName,
                  surfaceId,
                  sourceComponentId,
                  timestamp: new Date().toISOString(),
                  context,
                },
              },
              metadata: {
                mimeType: "application/json+a2ui",
              },
            },
          ],
          role: "user",
        },
      },
    };

    // Create abort controller for cancellation
    this.controller = new AbortController();

    try {
      const response = await fetch(this.serverUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-A2A-Extensions": "https://a2ui.org/a2a-extension/a2ui/v0.8",
        },
        body: JSON.stringify(request),
        signal: this.controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Process SSE stream from response body
      await this.processStream(response, msgId);

      return msgId;
    } catch (error) {
      this.callbacks.onError?.(error as Error);
      throw error;
    } finally {
      this.controller = null;
    }
  }

  /**
   * Create a ChatMessage from accumulated SSE messages
   * Aggregates A2UI data from multiple messages by surfaceId
   */
  private createChatMessage(
    messageId: string,
    messages: A2ASSEMessage[]
  ): ChatMessage {
    const finalText = extractTextContent(messages).join("");

    // Collect A2UI data from all messages
    const aggregatedA2UIData = this.collectA2UIData(messages);

    return {
      id: `${messageId}-response`,
      role: "assistant",
      content: finalText,
      timestamp: Date.now(),
      a2uiData: aggregatedA2UIData,
      status: "complete",
    };
  }

  /**
   * Collect all A2UI data parts from SSE messages
   */
  private collectA2UIData(messages: A2ASSEMessage[]): A2AUIData[] | undefined {
    console.log('[collectA2UIData] Input messages count:', messages.length);
    const collected: A2AUIData[] = [];

    for (const message of messages) {
      if (!message.result.status?.message) continue;

      for (const part of message.result.status.message.parts) {
        if (
          part.kind === "data" &&
          part.metadata?.mimeType === "application/json+a2ui"
        ) {
          const data = part.data as A2AUIData;
          console.log('[collectA2UIData] Found A2UI data part:', JSON.stringify(data).substring(0, 200));
          collected.push(data);
        }
      }
    }

    console.log('[collectA2UIData] Total collected:', collected.length);
    return collected.length > 0 ? collected : undefined;
  }

  /**
   * Process SSE stream from response
   */
  private async processStream(
    response: Response,
    messageId: string
  ): Promise<void> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body reader available");
    }

    const decoder = new TextDecoder();
    let buffer = "";
    const messages: A2ASSEMessage[] = [];
    let completed = false;
    let contextId: string | null = null;
    console.log("[SSE] Starting stream processing for messageId:", messageId);

    // Store onComplete locally to check if it was already called
    let onProgressCalled = false;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log("[SSE] Stream ended. Total messages received:", messages.length, "completed:", completed);
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        console.log("[SSE] Received chunk:", chunk.substring(0, 200), (chunk.length > 200 ? `... (total ${chunk.length} chars)` : ""));
        buffer += chunk;

        // Find all "data:" prefixes in the buffer
        // Server sends: data:{...}data:{...}data:{...} (no separator)
        const dataPrefix = "data:";
        let startIndex = 0;

        while (true) {
          const dataIndex = buffer.indexOf(dataPrefix, startIndex);
          if (dataIndex === -1) break;

          // Find the JSON object after "data:"
          const jsonStart = dataIndex + dataPrefix.length;
          let jsonEnd = -1;
          let braceCount = 0;
          let inString = false;

          for (let i = jsonStart; i < buffer.length; i++) {
            const char = buffer[i];
            if (char === '"' && (i === 0 || buffer[i - 1] !== '\\')) {
              inString = !inString;
            } else if (!inString) {
              if (char === '{') {
                braceCount++;
              } else if (char === '}') {
                braceCount--;
                if (braceCount === 0) {
                  jsonEnd = i + 1;
                  break;
                }
              }
            }
          }

          if (jsonEnd === -1) {
            // JSON not complete yet, wait for more data
            console.log("[SSE] JSON not complete, waiting for more data");
            break;
          }

          const jsonStr = buffer.substring(jsonStart, jsonEnd);
          console.log("[SSE] Found complete JSON, length:", jsonStr.length);

          let completeMessage: ChatMessage | null = null;

          try {
            const parsed = JSON.parse(jsonStr) as A2ASSEMessage;
            messages.push(parsed);
            console.log("[SSE] Received message #", messages.length, "final:", parsed.result.final, "state:", parsed.result.status?.state);

            // Extract and store contextId from the response
            if (parsed.result.contextId && !contextId) {
              contextId = parsed.result.contextId;
              console.log("[SSE] Extracted contextId:", contextId);
            }

            this.callbacks.onMessage?.(parsed);

            // Check for progress updates - only if not completed yet
            if (!completed && parsed.result.status?.message) {
              const texts = extractTextContent([parsed]);
              if (texts.length > 0 || hasA2UIData([parsed])) {
                const a2uiData = hasA2UIData([parsed])
                  ? parsed.result.status.message.parts.find(
                      (p) =>
                        p.kind === "data" &&
                        p.metadata?.mimeType === "application/json+a2ui"
                    )?.data
                  : undefined;
                if (a2uiData) {
                  console.log("[SSE] onProgress A2UI data found:", JSON.stringify(a2uiData, null, 2).substring(0, 500));
                }
                console.log("[SSE] onProgress called. Text length:", texts.join("").length, "hasA2UI:", !!a2uiData);
                onProgressCalled = true;
                this.callbacks.onProgress?.(texts.join(""), a2uiData);
              }
            }

            // Check if stream is complete
            const streamComplete = isStreamComplete(messages);
            console.log("[SSE] isStreamComplete:", streamComplete);
            if (streamComplete && !completed) {
              completeMessage = this.createChatMessage(messageId, messages);
              completed = true;
            }
          } catch (e) {
            console.warn("[SSE] Failed to parse SSE message:", e);
            console.log("[SSE] JSON string was:", jsonStr.substring(0, 200));
          }

          // Call onComplete outside the JSON parse try/catch so callback errors propagate properly
          if (completeMessage) {
            console.log("[SSE] Calling onComplete with chatMessage:", completeMessage, "contextId:", contextId);
            if (completeMessage.a2uiData) {
              console.log("[SSE] onComplete A2UI data:", JSON.stringify(completeMessage.a2uiData, null, 2).substring(0, 500));
            }
            this.callbacks.onComplete?.(messageId, completeMessage, contextId || "");
            return;
          }

          // Move past this message
          startIndex = jsonEnd;
        }

        // Remove processed data from buffer
        if (startIndex > 0) {
          buffer = buffer.substring(startIndex);
          console.log("[SSE] Removed processed data, buffer remaining:", buffer.length);
        }
      }

      // Call onComplete when stream ends (even without final marker)
      console.log("[SSE] After loop. messages.length:", messages.length, "completed:", completed, "onProgressCalled:", onProgressCalled, "contextId:", contextId);
      if (messages.length > 0 && !completed) {
        const chatMessage = this.createChatMessage(messageId, messages);
        console.log("[SSE] Calling onComplete (no final marker) with chatMessage:", chatMessage, "contextId:", contextId);
        completed = true;
        this.callbacks.onComplete?.(messageId, chatMessage, contextId || "");
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Cancel the current request
   */
  cancel(): void {
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
  }

  /**
   * Update server URL
   */
  setServerUrl(url: string): void {
    this.serverUrl = url;
  }

  /**
   * Get current server URL
   */
  getServerUrl(): string {
    return this.serverUrl;
  }
}
