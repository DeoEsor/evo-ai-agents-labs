import { useState, useCallback, useMemo } from 'react';
import type { A2UIMessage, A2UIComponent, A2UIActionCallback, A2UIValueChangeCallback, A2UIActionEvent, BoundValue, StateValue } from './schemas';
import { renderA2UI } from './renderer';
import type { A2AClient } from '../a2a/client';

export interface A2UIState {
  components: Map<string, A2UIComponent>;
  dataModel: Record<string, any>;
  rootId: string | null;
  surfaceId: string | null;
  catalogId: string | null;
  isLoading?: boolean;
}

export interface UseA2UIResult {
  state: A2UIState;
  rendered: React.ReactNode;
  handleMessage: (message: A2UIMessage) => void;
  handleAction: A2UIActionCallback;
  handleValueChange: A2UIValueChangeCallback;
  reset: () => void;
  setIsLoading: (loading: boolean) => void;
}

export interface UseA2UIOptions {
  initialState?: Partial<A2UIState>;
  onAction?: A2UIActionCallback;
  onValueChange?: A2UIValueChangeCallback;
  client?: A2AClient;
  getContextId?: () => string | null;
  onCreateAssistantMessage?: (messageId: string) => void;
}

/**
 * Unwrap A2UI typed value wrappers from data model
 */
function unwrapTypedValue(value: any): any {
  if (!value || typeof value !== 'object') return value;
  // Handle A2UI typed value wrappers from data model
  if (value.literalString !== undefined) return value.literalString;
  if (value.literalNumber !== undefined) return value.literalNumber;
  if (value.literalBoolean !== undefined) return value.literalBoolean;
  if (value.literalArray !== undefined) return value.literalArray;
  return value;
}

/**
 * Resolve a BoundValue to its actual value
 * If value has a path, resolve it from the dataModel
 * Otherwise, return the literal value
 */
function resolveBoundValue(boundValue: BoundValue, dataModel: Record<string, any>): unknown {
  if (boundValue.path !== undefined) {
    const parts = boundValue.path.replace(/^\//, '').split('/');
    let result: any = dataModel;
    for (const part of parts) {
      if (result && typeof result === 'object' && part in result) {
        result = result[part];
      } else {
        return undefined;
      }
    }
    return unwrapTypedValue(result);
  }
  // Return literal value
  return boundValue.literalString ?? boundValue.literalNumber ?? boundValue.literalBoolean;
}

/**
 * Unpack a single StateValue item recursively, returning the JS value
 */
function unpackStateValue(item: any): any {
  if (item.valueString !== undefined) return item.valueString;
  if (item.valueNumber !== undefined) return item.valueNumber;
  if (item.valueBoolean !== undefined) return item.valueBoolean;
  if (item.valueMap) {
    const obj: Record<string, any> = {};
    for (const child of item.valueMap) {
      obj[child.key] = unpackStateValue(child);
    }
    return obj;
  }
  return undefined;
}

/**
 * Unpack valueMap recursively into target object
 */
function unpackValueMap(contents: StateValue[], target: any, basePath?: string): void {
  const dest = basePath ? (target[basePath] = target[basePath] || {}) : target;
  for (const item of contents) {
    dest[item.key] = unpackStateValue(item);
  }
}

export function useA2UI(options?: UseA2UIOptions): UseA2UIResult {
  const { initialState, onAction: customOnAction, onValueChange: customOnValueChange, client, getContextId, onCreateAssistantMessage } = options || {};
  const [components, setComponents] = useState(() => new Map<string, A2UIComponent>());
  const [dataModel, setDataModel] = useState<Record<string, any>>(() => initialState?.dataModel || {});
  const [rootId, setRootId] = useState<string | null>(() => initialState?.rootId || null);
  const [surfaceId, setSurfaceId] = useState<string | null>(() => initialState?.surfaceId || null);
  const [catalogId, setCatalogId] = useState<string | null>(() => initialState?.catalogId || null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [componentVersions, setComponentVersions] = useState(() => new Map<string, number>());

  const state: A2UIState = useMemo(() => ({
    components,
    dataModel,
    rootId,
    surfaceId,
    catalogId,
    isLoading,
  }), [components, dataModel, rootId, surfaceId, catalogId, isLoading]);

  const handleMessage = useCallback((message: A2UIMessage) => {
    if (message.surfaceUpdate) {
      setComponents(prev => {
        const next = new Map(prev);
        for (const comp of message.surfaceUpdate!.components) {
          next.set(comp.id, comp);
        }
        return next;
      });
      // Increment version for updated components to force remount
      setComponentVersions(prev => {
        const next = new Map(prev);
        for (const comp of message.surfaceUpdate!.components) {
          next.set(comp.id, (next.get(comp.id) || 0) + 1);
        }
        return next;
      });
    }

    if (message.dataModelUpdate) {
      setDataModel(prev => {
        const next = { ...prev };

        const path = message.dataModelUpdate!.path;
        if (path && path !== 'root') {
          const parts = path.replace(/^\//, '').split('/');
          let target = next;
          for (let i = 0; i < parts.length - 1; i++) {
            target[parts[i]] = target[parts[i]] || {};
            target = target[parts[i]];
          }
          unpackValueMap(message.dataModelUpdate!.contents, target, parts[parts.length - 1]);
        } else {
          unpackValueMap(message.dataModelUpdate!.contents, next);
        }

        return next;
      });
    }

    if (message.beginRendering) {
      setRootId(message.beginRendering.root);
      setSurfaceId(message.beginRendering.surfaceId || null);
      setCatalogId(message.beginRendering.catalogId || null);
    }

    if (message.deleteSurface) {
      setComponents(new Map());
      setRootId(null);
      setSurfaceId(null);
    }
  }, []);

  const handleAction = useCallback<A2UIActionCallback>((event) => {
    const { action, sourceComponentId } = event;

    // If client is provided, send the action to the server
    if (client && action) {
      // Resolve context values from bound paths or literals
      const resolvedContext: Record<string, unknown> = {};
      if (action.context){
        for (const ctxItem of action.context) {
          resolvedContext[ctxItem.key] = resolveBoundValue(ctxItem.value, dataModel);
        }
      }

      // Get contextId from the callback or localStorage
      const contextId = getContextId ? getContextId() : null;

      // Generate a unique messageId for action response
      const messageId = `action-${Date.now()}`;

      // Create placeholder assistant message so onComplete can update it
      onCreateAssistantMessage?.(messageId);

      // Set loading state when action is sent
      setIsLoading(true);

      // Send user action to the server (surfaceId is required per spec, default to empty string)
      client.sendUserAction(
        action.name,
        resolvedContext,
        surfaceId || '',
        sourceComponentId,
        messageId,
        contextId
      )
        .catch((error) => {
          console.error('[useA2UI] Failed to send user action:', error);
          setIsLoading(false);
        });
    }

    // Call custom callback if provided
    if (customOnAction) {
      customOnAction(event);
    }
  }, [client, getContextId, surfaceId, dataModel, customOnAction, setIsLoading, onCreateAssistantMessage]);

  const handleValueChange = useCallback<A2UIValueChangeCallback>((path, value) => {
    setDataModel(prev => {
      const next = { ...prev };
      const parts = path.replace(/^\//, '').split('/');
      let target = next;
      for (let i = 0; i < parts.length - 1; i++) {
        target[parts[i]] = target[parts[i]] || {};
        target = target[parts[i]];
      }
      target[parts[parts.length - 1]] = value;
      return next;
    });
    // Call the custom callback if provided
    if (customOnValueChange) {
      customOnValueChange(path, value);
    }
  }, [customOnValueChange]);

  const rendered = useMemo(() => {
    if (!rootId) return null;
    return renderA2UI(components, dataModel, rootId, handleAction, handleValueChange, isLoading, componentVersions);
  }, [components, dataModel, rootId, handleAction, handleValueChange, isLoading, componentVersions]);

  const reset = useCallback(() => {
    setComponents(new Map());
    setDataModel({});
    setRootId(null);
    setSurfaceId(null);
    setCatalogId(null);
    setComponentVersions(new Map());
  }, []);

  return {
    state,
    rendered,
    handleMessage,
    handleAction,
    handleValueChange,
    reset,
    setIsLoading,
  };
}
