// A2A to A2UI Adapter

import type { A2UIMessage } from "../a2ui/schemas";
import type { A2AUIData, A2ASSEMessage, A2UIDataAggregated } from "./types";
import { a2aUIDataExtractor, isSurfaceUpdate, isDataModelUpdate, isBeginRendering, isDeleteSurface } from "./types";

/**
 * Extract A2UIData array from A2A SSE messages
 * Searches for parts with mimeType "application/json+a2ui"
 */
export function extractA2UIDataFromMessages(messages: A2ASSEMessage[]): A2AUIData[] {
  const extracted: A2AUIData[] = [];

  for (const message of messages) {
    if (message.result.status?.message) {
      for (const part of message.result.status.message.parts) {
        if (
          part.kind === "data" &&
          part.metadata?.mimeType === "application/json+a2ui"
        ) {
          // Each part.data is now wrapped with a key (surfaceUpdate, dataModelUpdate, etc.)
          extracted.push(part.data as A2AUIData);
        }
      }
    }
  }

  return extracted;
}

/**
 * Aggregate multiple A2AUIData by surfaceId
 * Groups components, contents, root, and catalogId by surfaceId
 */
export function aggregateA2UIData(messages: A2AUIData[]): Map<string, A2UIDataAggregated> {
  const aggregated = new Map<string, A2UIDataAggregated>();

  for (const msg of messages) {
    // Skip items that don't match any known A2AUIData variant
    if (!isSurfaceUpdate(msg) && !isDataModelUpdate(msg) && !isBeginRendering(msg) && !isDeleteSurface(msg)) {
      console.warn('[aggregateA2UIData] Skipping unknown A2AUIData item:', JSON.stringify(msg).substring(0, 200));
      continue;
    }

    const surfaceId = a2aUIDataExtractor.extractSurfaceId(msg);

    if (!aggregated.has(surfaceId)) {
      aggregated.set(surfaceId, { surfaceId });
    }

    const agg = aggregated.get(surfaceId)!;

    if (isSurfaceUpdate(msg)) {
      agg.components = [...(agg.components || []), ...msg.surfaceUpdate.components];
    } else if (isDataModelUpdate(msg)) {
      agg.contents = msg.dataModelUpdate.contents;
      agg.path = msg.dataModelUpdate.path;
    } else if (isBeginRendering(msg)) {
      agg.root = msg.beginRendering.root;
      agg.catalogId = msg.beginRendering.catalogId;
    }
    // deleteSurface doesn't add any data to aggregated
  }

  return aggregated;
}

/**
 * Convert aggregated data to A2UIMessage format
 * Takes aggregated data and converts it to the A2UIMessage format expected by useA2UI
 */
export function convertAggregatedToA2UIMessage(aggregated: Map<string, A2UIDataAggregated>): A2UIMessage | null {
  if (aggregated.size === 0) return null;

  const message: A2UIMessage = {};

  const entries = Array.from(aggregated.entries());
  for (const entry of entries) {
    const surfaceId = entry[0];
    const agg = entry[1];
    if (agg.components) {
      message.surfaceUpdate = {
        surfaceId,
        components: agg.components,
      };
    }

    if (agg.contents) {
      message.dataModelUpdate = {
        surfaceId,
        contents: agg.contents,
        ...(agg.path && { path: agg.path }),
      };
    }

    if (agg.root) {
      message.beginRendering = {
        surfaceId,
        root: agg.root,
        catalogId: agg.catalogId,
      };
    }
  }

  return message;
}

/**
 * Convert an array of A2AUIData to a single A2UIMessage
 * Used when rendering from stored chat message a2uiData
 */
export function convertToA2UIMessage(data: A2AUIData[]): A2UIMessage {
  const aggregated = aggregateA2UIData(data);
  return convertAggregatedToA2UIMessage(aggregated) || {};
}

/**
 * Aggregate multiple A2A messages and extract A2UI data
 * Returns A2UI message or null if no A2UI data found
 */
export function aggregateA2AMessages(messages: A2ASSEMessage[]): A2UIMessage | null {
  const a2uiData = extractA2UIDataFromMessages(messages);
  if (a2uiData.length === 0) return null;

  const aggregated = aggregateA2UIData(a2uiData);
  return convertAggregatedToA2UIMessage(aggregated);
}
