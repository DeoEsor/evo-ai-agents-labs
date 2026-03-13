// SSE Message Parsing Utilities

import type { SSEEvent, A2ASSEMessage, A2AUIData } from "./types";

/**
 * Parse a single SSE line
 */
export function parseSSELine(line: string): SSEEvent | null {
  if (!line.trim()) return null;

  if (line.startsWith("data:")) {
    return { data: line.slice(5).trim() };
  }

  if (line.startsWith("id:")) {
    return { id: line.slice(3).trim() };
  }

  if (line.startsWith("event:")) {
    return { event: line.slice(6).trim() };
  }

  if (line.startsWith("retry:")) {
    return { retry: parseInt(line.slice(6).trim(), 10) };
  }

  return null;
}

/**
 * Extract A2UI data from A2A response messages
 * A2UI data is found in parts with mimeType: "application/json+a2ui"
 */
export function extractA2UIData(messages: A2ASSEMessage[]): A2AUIData | null {
  for (const message of messages) {
    if (message.result.status?.message) {
      for (const part of message.result.status.message.parts) {
        if (
          part.kind === "data" &&
          part.metadata?.mimeType === "application/json+a2ui"
        ) {
          return part.data as A2AUIData;
        }
      }
    }
  }
  return null;
}

/**
 * Extract text content from A2A response messages
 * Excludes:
 * - Text marked as adk_thought (internal reasoning)
 * - Text from messages with state: "submitted" (user request confirmation, not agent response)
 * - Text containing system instructions (marked with "# ВАЖНО" or similar)
 */
export function extractTextContent(messages: A2ASSEMessage[]): string[] {
  const texts: string[] = [];

  // System instruction markers to filter out
  const systemInstructionMarkers = [
    "# ВАЖНО",
    "### СХЕМА КОМПОНЕНТОВ",
    "Ниже представлена схема разрешенных к использованию компонентов",
    "Here's a friendly greeting and a couple of quick‑action buttons to get started.",
  ];

  const isSystemInstruction = (text: string): boolean => {
    return systemInstructionMarkers.some((marker) => text.includes(marker));
  };

  for (const message of messages) {
    // Skip submitted state messages - these are user request confirmations, not agent responses
    if (message.result.status?.state !== "completed") {
      continue;
    }

    if (message.result.status?.message) {
      for (const part of message.result.status.message.parts) {
        if (part.kind === "text" && !part.metadata?.adk_thought) {
          const text = part.text || "";
          // Skip system instructions
          if (!isSystemInstruction(text)) {
            texts.push(text);
          }
        }
      }
    }

    if (message.result.artifact) {
      for (const part of message.result.artifact.parts) {
        if (part.kind === "text") {
          const text = part.text || "";
          // Skip system instructions
          if (!isSystemInstruction(text)) {
            texts.push(text);
          }
        }
      }
    }
  }

  return texts;
}

/**
 * Check if messages contain A2UI data
 */
export function hasA2UIData(messages: A2ASSEMessage[]): boolean {
  return extractA2UIData(messages) !== null;
}

/**
 * Parse SSE response text and extract A2A messages
 */
export function parseSSEResponse(responseText: string): A2ASSEMessage[] {
  const messages: A2ASSEMessage[] = [];
  const lines = responseText.split("\n");

  for (const line of lines) {
    const event = parseSSELine(line);
    if (event?.data) {
      try {
        const parsed = JSON.parse(event.data) as A2ASSEMessage;
        messages.push(parsed);
      } catch (e) {
        console.warn("Failed to parse SSE message:", e);
      }
    }
  }

  return messages;
}

/**
 * Check if the message stream is complete
 */
export function isStreamComplete(messages: A2ASSEMessage[]): boolean {
  const lastMessage = messages[messages.length - 1];
  return (
    lastMessage?.result.final === true &&
    lastMessage?.result.kind === "status-update" &&
    lastMessage?.result.status?.state === "completed"
  );
}
