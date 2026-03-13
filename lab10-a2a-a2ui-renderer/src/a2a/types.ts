// A2A Protocol Type Definitions

import type { A2UIComponent, StateValue } from '../a2ui/schemas';

// A2A Request Message for message/stream method
export interface A2ARequest {
  id: string;
  jsonrpc: "2.0";
  method: "message/stream";
  params: {
    configuration: {
      acceptedOutputModes: string[];
    };
    message: {
      kind: "message";
      messageId: string;
      contextId?: string;
      taskId?: string;
      parts: A2APart[];
      role: "user";
      metadata?: Record<string, unknown>;
      extensions?: string[];
      referenceTaskIds?: string[];
    };
  };
}

// A2A Part Types
export interface A2APart {
  kind: "text" | "data";
  text?: string;
  data?: unknown;
  metadata?: {
    mimeType?: string;
    adk_thought?: boolean;
    adk_type?: "function_call" | "function_response";
  };
}

// A2A SSE Response Message
export interface A2ASSEMessage {
  id: string;
  jsonrpc: "2.0";
  result: A2AResult;
}

// A2A Result Types
export interface A2AResult {
  contextId: string;
  final: boolean;
  kind: "status-update" | "artifact-update";
  status?: {
    state: "submitted" | "working" | "completed";
    message?: {
      kind: "message";
      messageId: string;
      parts: A2APart[];
      role: "agent";
    };
    timestamp: string;
  };
  artifact?: {
    artifactId: string;
    parts: A2APart[];
  };
  taskId: string;
}

// === A2A UI Data Types (New Format) ===

// A2UI Data with surfaceUpdate key
export interface A2AUIDataSurfaceUpdate {
  surfaceUpdate: {
    surfaceId: string;
    components: A2UIComponent[];
  };
}

// A2UI Data with dataModelUpdate key
export interface A2AUIDataDataModelUpdate {
  dataModelUpdate: {
    surfaceId: string;
    path?: string;
    contents: StateValue[];
  };
}

// A2UI Data with beginRendering key
export interface A2AUIDataBeginRendering {
  beginRendering: {
    surfaceId: string;
    root: string;
    catalogId?: string;
  };
}

// A2UI Data with deleteSurface key
export interface A2AUIDataDeleteSurface {
  deleteSurface: {
    surfaceId: string;
  };
}

// Union type for all A2AUIData variants
export type A2AUIData =
  | A2AUIDataSurfaceUpdate
  | A2AUIDataDataModelUpdate
  | A2AUIDataBeginRendering
  | A2AUIDataDeleteSurface;

// Type guards for determining message type
export function isSurfaceUpdate(data: A2AUIData): data is A2AUIDataSurfaceUpdate {
  return 'surfaceUpdate' in data;
}

export function isDataModelUpdate(data: A2AUIData): data is A2AUIDataDataModelUpdate {
  return 'dataModelUpdate' in data;
}

export function isBeginRendering(data: A2AUIData): data is A2AUIDataBeginRendering {
  return 'beginRendering' in data;
}

export function isDeleteSurface(data: A2AUIData): data is A2AUIDataDeleteSurface {
  return 'deleteSurface' in data;
}

// Variant type for message operations
export type A2AUIDataVariant = 'surfaceUpdate' | 'dataModelUpdate' | 'beginRendering' | 'deleteSurface';

// Extractor for getting surfaceId and operation type from A2AUIData
export interface A2AUIDataExtractor {
  extractSurfaceId(data: A2AUIData): string;
  extractVariant(data: A2AUIData): A2AUIDataVariant;
}

export const a2aUIDataExtractor: A2AUIDataExtractor = {
  extractSurfaceId(data: A2AUIData): string {
    if (isSurfaceUpdate(data)) return data.surfaceUpdate.surfaceId;
    if (isDataModelUpdate(data)) return data.dataModelUpdate.surfaceId;
    if (isBeginRendering(data)) return data.beginRendering.surfaceId;
    if (isDeleteSurface(data)) return data.deleteSurface.surfaceId;
    console.warn('[a2aUIDataExtractor] Unknown A2AUIData variant:', JSON.stringify(data).substring(0, 200));
    return '__unknown__';
  },

  extractVariant(data: A2AUIData): A2AUIDataVariant {
    if (isSurfaceUpdate(data)) return 'surfaceUpdate';
    if (isDataModelUpdate(data)) return 'dataModelUpdate';
    if (isBeginRendering(data)) return 'beginRendering';
    return 'deleteSurface';
  }
};

// === Aggregation Types ===

// Aggregated A2UI data by surfaceId
export interface A2UIDataAggregated {
  surfaceId: string;
  components?: A2UIComponent[];
  contents?: StateValue[];
  path?: string;
  root?: string;
  catalogId?: string;
}

// Chat Message Types
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  a2uiData?: A2AUIData[];  // Changed to array for multiple A2A messages
  contextId?: string;
  status: "sending" | "loading" | "complete" | "error";
  error?: string;
}

// SSE Event Types
export interface SSEEvent {
  data?: string;
  id?: string;
  event?: string;
  retry?: number;
}

// Chat History Storage
export interface ChatHistoryStorage {
  messages: ChatMessage[];
  serverUrl: string;
  lastUpdated: number;
}
