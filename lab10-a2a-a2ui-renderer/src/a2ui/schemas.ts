import { z } from 'zod';

// Component instance in the adjacency list
export const A2UIComponent = z.object({
  id: z.string(),
  component: z.record(z.string(), z.record(z.string(), z.unknown())),
});

export type A2UIComponent = z.infer<typeof A2UIComponent>;

// State value for data model
export const StateValue = z.object({
  key: z.string(),
  valueString: z.string().optional(),
  valueNumber: z.number().optional(),
  valueBoolean: z.boolean().optional(),
  valueMap: z.array(z.unknown()).optional(),
});

export type StateValue = z.infer<typeof StateValue>;

// === A2A Part Schemas for New Format ===

// A2A Part data with operation keys (surfaceUpdate, dataModelUpdate, beginRendering, deleteSurface)
export const A2AA2UIPartData = z.object({
  surfaceUpdate: z.object({
    surfaceId: z.string(),
    components: z.array(A2UIComponent),
  }).optional(),
  dataModelUpdate: z.object({
    surfaceId: z.string(),
    contents: z.array(StateValue),
  }).optional(),
  beginRendering: z.object({
    surfaceId: z.string(),
    root: z.string(),
    catalogId: z.string().optional(),
  }).optional(),
  deleteSurface: z.object({
    surfaceId: z.string(),
  }).optional(),
}).refine(
  (data) => Object.keys(data).length === 1,
  "Exactly one action type must be present"
);

export type A2AA2UIPartData = z.infer<typeof A2AA2UIPartData>;

// Complete A2A Part schema for validation
export const A2AA2UIPart = z.object({
  kind: z.literal("data"),
  data: A2AA2UIPartData,
  metadata: z.object({
    mimeType: z.literal("application/json+a2ui"),
  }),
});

export type A2AA2UIPart = z.infer<typeof A2AA2UIPart>;

// === A2UI Message Schemas ===

// Surface update message
export const SurfaceUpdate = z.object({
  surfaceId: z.string().optional(),
  components: z.array(A2UIComponent),
});

export type SurfaceUpdate = z.infer<typeof SurfaceUpdate>;

// State model update message
export const StateModelUpdate = z.object({
  surfaceId: z.string().optional(),
  path: z.string().optional(),
  contents: z.array(StateValue),
});

export type StateModelUpdate = z.infer<typeof StateModelUpdate>;

// Begin rendering message
export const BeginRendering = z.object({
  surfaceId: z.string().optional(),
  root: z.string(),
  catalogId: z.string().optional(),
});

export type BeginRendering = z.infer<typeof BeginRendering>;

// Delete surface message
export const DeleteSurface = z.object({
  surfaceId: z.string(),
});

export type DeleteSurface = z.infer<typeof DeleteSurface>;

// Complete A2UI message schema
export const A2UIMessage = z.object({
  surfaceUpdate: SurfaceUpdate.optional(),
  dataModelUpdate: StateModelUpdate.optional(),
  beginRendering: BeginRendering.optional(),
  deleteSurface: DeleteSurface.optional(),
});

export type A2UIMessage = z.infer<typeof A2UIMessage>;

// Bound value - can be a path reference or a literal value
export const BoundValue = z.object({
  path: z.string().optional(),
  literalString: z.string().optional(),
  literalNumber: z.number().optional(),
  literalBoolean: z.boolean().optional(),
});

export type BoundValue = z.infer<typeof BoundValue>;

// Action context item with typed value
export const ActionContextItem = z.object({
  key: z.string(),
  value: BoundValue,
});

export type ActionContextItem = z.infer<typeof ActionContextItem>;

// Action definition
export const Action = z.object({
  name: z.string(),
  context: z.array(ActionContextItem).optional(),
});

export type Action = z.infer<typeof Action>;

// User action event - includes component ID for dispatch
export interface A2UIActionEvent {
  action: Action;
  sourceComponentId: string;
}

// Type for action callbacks
export type A2UIActionCallback = (event: A2UIActionEvent) => void;

// Type for value change callbacks
export type A2UIValueChangeCallback = (path: string, value: any) => void;
