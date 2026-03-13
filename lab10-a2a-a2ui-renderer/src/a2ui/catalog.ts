import { defineCatalog } from '@json-render/core';
import { schema } from '@json-render/react/schema';
import { z } from 'zod';

// A2UI BoundValue schema - can contain string, number, boolean, or array literals, or path binding
export const BoundValue = z.union([
  z.object({ literalString: z.string() }),
  z.object({ literalNumber: z.number() }),
  z.object({ literalBoolean: z.boolean() }),
  z.object({ literalArray: z.array(z.any()) }),
  z.object({ path: z.string() }),
]);

// For backward compatibility
export const BoundString = BoundValue;

// A2UI children schema
export const Children = z.object({
  explicitList: z.array(z.string()).optional(),
  template: z.object({
    dataBinding: z.string(),
    componentId: z.string(),
  }).optional(),
}).refine(d => d.explicitList || d.template, { message: "Either explicitList or template must be provided" });

// A2UI action schema
export const Action = z.object({
  name: z.string(),
  context: z.array(z.object({
    key: z.string(),
    value: BoundValue,
  })).optional(),
});

// A2UI catalog definition
export const a2uiCatalog = defineCatalog(schema, {
  actions: {},
  components: {
    Text: {
      description: 'Displays text content',
      props: z.object({
        text: BoundValue,
        usageHint: z.string().optional(),
      }),
    },
    Button: {
      description: 'Interactive button',
      props: z.object({
        child: z.string(),
        action: Action.optional(),
        primary: z.boolean().optional(),
      }),
    },
    DateTimeInput: {
      description: 'Date/time picker',
      props: z.object({
        label: BoundString.optional(),
        value: BoundString.optional(),
        enableDate: z.boolean().optional(),
        enableTime: z.boolean().optional(),
      }),
    },
    NumberInput: {
      description: 'Number input field',
      props: z.object({
        label: BoundString.optional(),
        value: BoundString.optional(),
        min: z.number().optional(),
        max: z.number().optional(),
        step: z.number().optional(),
      }),
    },
    TextInput: {
      description: 'Text input field',
      props: z.object({
        label: BoundString.optional(),
        value: BoundString.optional(),
        placeholder: BoundString.optional(),
        multiline: z.boolean().optional(),
      }),
    },
    Column: {
      description: 'Vertical layout',
      props: z.object({
        children: Children,
        spacing: z.number().optional(),
        padding: z.number().optional(),
        distribution: z.enum(['start', 'center', 'end', 'spaceBetween', 'spaceAround']).optional(),
        alignment: z.enum(['start', 'center', 'end', 'stretch']).optional(),
      }),
    },
    Row: {
      description: 'Horizontal layout',
      props: z.object({
        children: Children,
        spacing: z.number().optional(),
        padding: z.number().optional(),
      }),
    },
    Card: {
      description: 'Container with border/shadow',
      props: z.object({
        child: z.string(),
        title: BoundString.optional(),
        elevation: z.number().optional(),
      }),
    },
    Image: {
      description: 'Image display',
      props: z.object({
        url: BoundString,
        alt: BoundString.optional(),
        fit: z.enum(['contain', 'cover', 'fill', 'none', 'scale-down']).optional(),
        usageHint: z.enum(['icon', 'avatar', 'smallFeature', 'mediumFeature', 'largeFeature', 'header']).optional(),
      }),
    },
    Switch: {
      description: 'Toggle switch',
      props: z.object({
        label: BoundString.optional(),
        value: BoundString.optional(),
      }),
    },
    Checkbox: {
      description: 'Checkbox input',
      props: z.object({
        label: BoundString.optional(),
        value: BoundString.optional(),
      }),
    },
    // Alias for compatibility (capital B)
    CheckBox: {
      description: 'Checkbox input',
      props: z.object({
        label: BoundString.optional(),
        value: BoundString.optional(),
      }),
    },
    Slider: {
      description: 'Range slider',
      props: z.object({
        label: BoundString.optional(),
        value: BoundString.optional(),
        min: z.number().optional(),
        max: z.number().optional(),
      }),
    },
    Divider: {
      description: 'Horizontal divider line',
      props: z.object({
        label: BoundValue.optional(),
      }),
    },
    MultipleChoice: {
      description: 'Multiple selection component',
      props: z.object({
        label: BoundValue.optional(),
        selections: BoundValue.optional(),
        options: z.array(z.object({
          label: BoundValue,
          value: z.string(),
        })),
        maxAllowedSelections: z.number().optional(),
        variant: z.enum(['checkbox', 'chips']).optional(),
        filterable: z.boolean().optional(),
      }),
    },
    TextField: {
      description: 'Text input field with type support',
      props: z.object({
        label: BoundValue.optional(),
        text: BoundValue.optional(),
        placeholder: BoundValue.optional(),
        textFieldType: z.enum(['date', 'longText', 'number', 'shortText', 'obscured']).optional(),
        validationRegexp: z.string().optional(),
      }),
    },
    Icon: {
      description: 'Icon display',
      props: z.object({
        name: z.string(),
      }),
    },
    Video: {
      description: 'Video player',
      props: z.object({
        url: z.string(),
      }),
    },
    AudioPlayer: {
      description: 'Audio player',
      props: z.object({
        url: z.string(),
        description: BoundValue.optional(),
      }),
    },
    Modal: {
      description: 'Modal dialog',
      props: z.object({
        entryPointChild: z.string(),
        contentChild: z.string(),
      }),
    },
    List: {
      description: 'List of items',
      props: z.object({
        children: Children,
        direction: z.enum(['vertical', 'horizontal']).optional(),
        alignment: z.enum(['start', 'center', 'end', 'stretch']).optional(),
      }),
    },
    Tabs: {
      description: 'Tabbed interface',
      props: z.object({
        tabItems: z.array(z.object({
          title: BoundString,
          child: z.string(),
        })),
      }),
    },
  },
});

// Type for component names
export type A2UIComponentName = 'Text' | 'Button' | 'DateTimeInput' | 'NumberInput' | 'TextInput' | 'Column' | 'Row' | 'Card' | 'Image' | 'Switch' | 'Checkbox' | 'Slider' | 'Divider' | 'MultipleChoice' | 'TextField' | 'Icon' | 'Video' | 'AudioPlayer' | 'Modal' | 'List' | 'Tabs';
