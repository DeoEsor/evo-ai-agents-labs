import React from 'react';
import type { A2UIComponent, A2UIActionCallback, A2UIValueChangeCallback, A2UIActionEvent } from './schemas';

// Component implementations
const A2UIComponents = {
  Text: ({ text, usageHint }: { text: string; usageHint?: string }) => {
    const classMap: Record<string, string> = {
      h1: 'text-4xl font-bold',
      h2: 'text-3xl font-semibold',
      h3: 'text-2xl font-medium',
      body: 'text-base',
      caption: 'text-sm text-gray-600',
    };
    const baseClasses = usageHint ? classMap[usageHint] || 'text-base' : 'text-base';

    const Tag = (usageHint?.startsWith('h') ? usageHint : 'p') as 'h1' | 'h2' | 'h3' | 'p';

    return <Tag className={baseClasses}>{text}</Tag>;
  },

  Button: ({ child, action, onAction, isLoading, primary, sourceComponentId }: {
    child: React.ReactNode;
    action?: { name: string; context?: Array<{ key: string; value: any }> };
    onAction?: A2UIActionCallback;
    isLoading?: boolean;
    primary?: boolean;
    sourceComponentId?: string;
  }) => (
    <button
      onClick={() => action && !isLoading && onAction?.({ action, sourceComponentId: sourceComponentId || '' })}
      disabled={isLoading}
      className={`px-4 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 inline-flex items-center gap-2 ${
        primary
          ? 'bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 disabled:cursor-not-allowed text-white focus:ring-blue-500'
          : 'bg-white hover:bg-gray-100 disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-700 border border-gray-300 focus:ring-gray-400'
      }`}
    >
      {isLoading ? (
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      {child}
    </button>
  ),

  DateTimeInput: ({ label, value, enableDate, enableTime, onChange }: {
    label?: string;
    value?: string;
    enableDate?: boolean;
    enableTime?: boolean;
    onChange?: (value: string) => void;
  }) => {
    const inputType = enableDate && enableTime ? 'datetime-local' : enableDate ? 'date' : 'time';
    const [localValue, setLocalValue] = React.useState(value || '');

    React.useEffect(() => {
      if (value !== undefined) {
        setLocalValue(value || '');
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      console.log('[DateTimeInput] onChange called:', { label, newValue, currentValue: localValue, hasDataModelBinding: value !== undefined });
      setLocalValue(newValue);
      onChange?.(newValue);
    };
    return (
      <div className="flex flex-col gap-1">
        {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
        <input
          type={inputType}
          value={localValue}
          onChange={handleChange}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    );
  },

  NumberInput: ({ label, value, min, max, step, onChange }: {
    label?: string;
    value?: number;
    min?: number;
    max?: number;
    step?: number;
    onChange?: (value: number) => void;
  }) => {
    const [localValue, setLocalValue] = React.useState(value?.toString() ?? '');

    React.useEffect(() => {
      if (value !== undefined) {
        setLocalValue(value.toString());
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      const numericValue = parseFloat(newValue) || 0;
      console.log('[NumberInput] onChange called:', { label, newValue: numericValue, currentValue: localValue, hasDataModelBinding: value !== undefined });
      setLocalValue(newValue);
      onChange?.(numericValue);
    };
    return (
      <div className="flex flex-col gap-1">
        {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
        <input
          type="number"
          value={localValue}
          min={min}
          max={max}
          step={step}
          onChange={handleChange}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    );
  },

  TextInput: ({ label, value, placeholder, multiline, onChange }: {
    label?: string;
    value?: string;
    placeholder?: string;
    multiline?: boolean;
    onChange?: (value: string) => void;
  }) => {
    const InputComponent = multiline ? 'textarea' : 'input';
    const [localValue, setLocalValue] = React.useState(value ?? '');

    React.useEffect(() => {
      if (value !== undefined) {
        setLocalValue(value);
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      console.log('[TextInput] onChange called:', { label, newValue, currentValue: localValue, hasDataModelBinding: value !== undefined });
      setLocalValue(newValue);
      onChange?.(newValue);
    };
    return (
      <div className="flex flex-col gap-1">
        {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
        <InputComponent
          {...(multiline ? { rows: 4 } : { type: 'text' })}
          value={localValue}
          placeholder={placeholder}
          onChange={handleChange}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    );
  },

  Column: ({ children, spacing, padding, distribution, alignment }: {
    children: React.ReactNode;
    spacing?: number;
    padding?: number;
    distribution?: string;
    alignment?: string;
  }) => {
    const distributionMap: Record<string, string> = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      spaceBetween: 'justify-between',
      spaceAround: 'justify-around',
    };
    const alignmentMap: Record<string, string> = {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
    };

    return (
      <div
        className={`flex flex-col ${distributionMap[distribution || ''] || ''} ${alignmentMap[alignment || ''] || ''}`}
        style={{ gap: spacing ?? 8, padding: padding ?? 0 }}
      >
        {children}
      </div>
    );
  },

  Row: ({ children, spacing, padding }: {
    children: React.ReactNode;
    spacing?: number;
    padding?: number;
  }) => (
    <div
      className="flex flex-row flex-wrap"
      style={{ gap: spacing ?? 8, padding: padding ?? 0 }}
    >
      {children}
    </div>
  ),

  Card: ({ child, title, elevation }: {
    child: React.ReactNode;
    title?: string;
    elevation?: number;
  }) => {
    const shadowClasses = {
      0: '',
      1: 'shadow-sm',
      2: 'shadow',
      3: 'shadow-md',
      4: 'shadow-lg',
    }[elevation ?? 1] || 'shadow-sm';

    return (
      <div className={`rounded-lg border border-gray-200 bg-white p-4 ${shadowClasses}`}>
        {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
        {child}
      </div>
    );
  },

  Image: ({ url, alt, fit, usageHint }: {
    url: string;
    alt?: string;
    fit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
    usageHint?: 'icon' | 'avatar' | 'smallFeature' | 'mediumFeature' | 'largeFeature' | 'header';
  }) => {
    const sizeClasses: Record<string, string> = {
      icon: 'w-6 h-6',
      avatar: 'w-10 h-10 rounded-full',
      smallFeature: 'w-24 h-16',
      mediumFeature: 'w-48 h-32',
      largeFeature: 'w-full h-48',
      header: 'w-full h-40',
    };

    return (
      <img
        src={url}
        alt={alt || ''}
        className={`${sizeClasses[usageHint || 'mediumFeature']} ${fit ? 'object-' + fit : 'object-contain'} rounded-md`}
      />
    );
  },

  Icon: ({ name }: { name: string }) => {
    // Simple icon implementation - you can replace this with a proper icon library
    const iconMap: Record<string, string> = {
      accountCircle: '👤',
      add: '+',
      arrowBack: '←',
      arrowForward: '→',
      attachFile: '📎',
      calendarToday: '📅',
      call: '📞',
      camera: '📷',
      check: '✓',
      close: '✕',
      delete: '🗑',
      download: '⬇',
      edit: '✎',
      event: '📅',
      error: '⚠',
      favorite: '★',
      favoriteOff: '☆',
      folder: '📁',
      help: '❓',
      home: '🏠',
      info: 'ℹ',
      locationOn: '📍',
      lock: '🔒',
      lockOpen: '🔓',
      mail: '✉',
      menu: '☰',
      moreVert: '⋮',
      moreHoriz: '⋯',
      notificationsOff: '🔕',
      notifications: '🔔',
      payment: '💳',
      person: '👤',
      phone: '📱',
      photo: '📷',
      print: '🖨',
      refresh: '↻',
      search: '🔍',
      send: '➤',
      settings: '⚙',
      share: '🔗',
      shoppingCart: '🛒',
      star: '★',
      starHalf: '½',
      starOff: '☆',
      upload: '⬆',
      visibility: '👁',
      visibilityOff: '👁',
      warning: '⚠',
    };

    return <span className="text-2xl">{iconMap[name] || '•'}</span>;
  },

  Video: ({ url }: { url: string }) => (
    <video
      src={url}
      controls
      className="w-full rounded-md"
    />
  ),

  AudioPlayer: ({ url, description }: { url: string; description?: string }) => (
    <div className="w-full">
      {description && <p className="text-sm text-gray-600 mb-2">{description}</p>}
      <audio
        src={url}
        controls
        className="w-full"
      />
    </div>
  ),

  Modal: ({ entryPointChild, contentChild }: {
    entryPointChild: React.ReactNode;
    contentChild: React.ReactNode;
  }) => {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
      <>
        <div onClick={() => setIsOpen(true)} style={{ display: 'inline-block' }}>
          {entryPointChild}
        </div>
        {isOpen && (
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg p-6 max-w-lg w-full mx-4"
            >
              {contentChild}
            </div>
          </div>
        )}
      </>
    );
  },

  TextField: ({ label, value, placeholder, textFieldType, validationRegexp, onChange }: {
    label?: string;
    value?: string;
    placeholder?: string;
    textFieldType?: 'date' | 'longText' | 'number' | 'shortText' | 'obscured';
    validationRegexp?: string;
    onChange?: (value: string) => void;
  }) => {
    const inputType = textFieldType === 'number' ? 'number' : textFieldType === 'obscured' ? 'password' : 'text';
    const inputComponent = textFieldType === 'longText' ? 'textarea' : 'input';

    // Use local state for the input value. If value prop is provided, use it as initial value.
    // This allows the field to work even without a dataModel binding.
    const [localValue, setLocalValue] = React.useState(value ?? '');

    // Update local state when the prop value changes (e.g., from dataModel)
    React.useEffect(() => {
      if (value !== undefined) {
        setLocalValue(value);
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      console.log('[TextField] onChange called:', { label, newValue, currentValue: localValue, textFieldType, hasDataModelBinding: value !== undefined });
      setLocalValue(newValue);
      onChange?.(newValue);
    };

    return (
      <div className="flex flex-col gap-1">
        {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
        {inputComponent === 'textarea' ? (
          <textarea
            value={localValue}
            placeholder={placeholder}
            onChange={handleChange}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
          />
        ) : (
          <input
            type={inputType}
            value={localValue}
            placeholder={placeholder}
            pattern={validationRegexp}
            onChange={handleChange}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}
      </div>
    );
  },

  MultipleChoice: ({ label, selections, options, maxAllowedSelections, variant, filterable, onChange }: {
    label?: string;
    selections?: string[];
    options?: Array<{ label: string; value: string }>;
    maxAllowedSelections?: number;
    variant?: 'checkbox' | 'chips';
    filterable?: boolean;
    onChange?: (selections: string[]) => void;
  }) => {
    const [selected, setSelected] = React.useState<string[]>(Array.isArray(selections) ? selections : []);
    const [filterText, setFilterText] = React.useState('');

    const filteredOptions = filterable && filterText
      ? options?.filter(opt => opt.label.toLowerCase().includes(filterText.toLowerCase())) || []
      : options || [];

    const toggleSelection = (value: string) => {
      let newSelected = selected.includes(value)
        ? selected.filter(s => s !== value)
        : [...selected, value];

      if (maxAllowedSelections && newSelected.length > maxAllowedSelections) {
        newSelected = newSelected.slice(1);
      }

      setSelected(newSelected);
      onChange?.(newSelected);
    };

    const isCheckbox = variant === 'checkbox';

    return (
      <div className="flex flex-col gap-2">
        {label && <label className="text-sm font-medium text-gray-700">{label}</label>}

        {filterable && (
          <input
            type="text"
            placeholder="Search..."
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
          />
        )}

        <div className={isCheckbox ? "flex flex-col gap-2" : "flex flex-wrap gap-2"}>
          {filteredOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => toggleSelection(opt.value)}
              className={`${
                isCheckbox
                  ? 'flex items-center gap-2 px-4 py-2 border rounded-md transition-colors'
                  : 'px-4 py-2 rounded-full border transition-colors'
              } ${
                selected.includes(opt.value)
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {isCheckbox && (
                <input
                  type="checkbox"
                  checked={selected.includes(opt.value)}
                  onChange={() => toggleSelection(opt.value)}
                  className="w-4 h-4"
                />
              )}
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  },

  Switch: ({ label, value, onChange }: {
    label?: string;
    value?: boolean;
    onChange?: (value: boolean) => void;
  }) => {
    const [localChecked, setLocalChecked] = React.useState(value ?? false);

    React.useEffect(() => {
      if (value !== undefined) {
        setLocalChecked(value);
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newChecked = e.target.checked;
      console.log('[Switch] onChange called:', { label, newChecked, currentValue: localChecked, hasDataModelBinding: value !== undefined });
      setLocalChecked(newChecked);
      onChange?.(newChecked);
    };

    return (
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={localChecked}
          onChange={handleChange}
          className="w-5 h-5 rounded focus:ring-2 focus:ring-blue-500"
        />
        {label && <span className="text-sm">{label}</span>}
      </div>
    );
  },

  Checkbox: ({ label, value, onChange }: {
    label?: string;
    value?: boolean;
    onChange?: (value: boolean) => void;
  }) => {
    const [localChecked, setLocalChecked] = React.useState(value ?? false);

    React.useEffect(() => {
      if (value !== undefined) {
        setLocalChecked(value);
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newChecked = e.target.checked;
      console.log('[Checkbox] onChange called:', { label, newChecked, currentValue: localChecked, hasDataModelBinding: value !== undefined });
      setLocalChecked(newChecked);
      onChange?.(newChecked);
    };

    return (
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={localChecked}
          onChange={handleChange}
          className="w-5 h-5 rounded focus:ring-2 focus:ring-blue-500"
        />
        {label && <span className="text-sm">{label}</span>}
      </div>
    );
  },

  // Alias for compatibility (capital B)
  CheckBox: ({ label, value, onChange }: {
    label?: string;
    value?: boolean;
    onChange?: (value: boolean) => void;
  }) => {
    const [localChecked, setLocalChecked] = React.useState(value ?? false);

    React.useEffect(() => {
      if (value !== undefined) {
        setLocalChecked(value);
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newChecked = e.target.checked;
      console.log('[CheckBox] onChange called:', { label, newChecked, currentValue: localChecked, hasDataModelBinding: value !== undefined });
      setLocalChecked(newChecked);
      onChange?.(newChecked);
    };

    return (
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={localChecked}
          onChange={handleChange}
          className="w-5 h-5 rounded focus:ring-2 focus:ring-blue-500"
        />
        {label && <span className="text-sm">{label}</span>}
      </div>
    );
  },

  Slider: ({ label, value, min, max, onChange }: {
    label?: string;
    value?: number;
    min?: number;
    max?: number;
    onChange?: (value: number) => void;
  }) => {
    const [localValue, setLocalValue] = React.useState(value ?? 0);

    React.useEffect(() => {
      if (value !== undefined) {
        setLocalValue(value);
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseFloat(e.target.value);
      console.log('[Slider] onChange called:', { label, newValue, currentValue: localValue, hasDataModelBinding: value !== undefined });
      setLocalValue(newValue);
      onChange?.(newValue);
    };

    return (
      <div className="flex flex-col gap-1">
        {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
        <input
          type="range"
          min={min ?? 0}
          max={max ?? 100}
          value={localValue}
          onChange={handleChange}
          className="w-full"
        />
        <span className="text-xs text-gray-500">{localValue}</span>
      </div>
    );
  },

  Divider: ({ label }: { label?: string }) => (
    <div className="flex items-center gap-2 my-2">
      <div className="flex-1 border-t border-gray-300" />
      {label && <span className="text-sm text-gray-500">{label}</span>}
      <div className="flex-1 border-t border-gray-300" />
    </div>
  ),

  List: ({ children, direction, alignment }: {
    children: React.ReactNode;
    direction?: 'vertical' | 'horizontal';
    alignment?: 'start' | 'center' | 'end' | 'stretch';
  }) => {
    const directionClass = direction === 'horizontal' ? 'flex-row' : 'flex-col';
    const alignmentMap: Record<string, string> = {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
    };
    const alignmentClass = alignment ? alignmentMap[alignment] : 'items-start';

    return (
      <div className={`flex ${directionClass} ${alignmentClass} gap-2`}>
        {children}
      </div>
    );
  },

  Tabs: ({ tabItems }: {
    tabItems: Array<{ title: string; child: React.ReactNode }>;
  }) => {
    const [activeTab, setActiveTab] = React.useState(0);

    return (
      <div className="w-full">
        {/* Tab headers */}
        <div className="flex border-b border-gray-300">
          {tabItems.map((tab, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === index
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.title}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="mt-4">
          {tabItems[activeTab]?.child}
        </div>
      </div>
    );
  },
};

// Render A2UI surface
export function renderA2UI(
  componentMap: Map<string, A2UIComponent>,
  dataModel: Record<string, any>,
  rootId: string,
  onAction?: A2UIActionCallback,
  onValueChange?: A2UIValueChangeCallback,
  isLoading?: boolean,
  componentVersions?: Map<string, number>
): React.ReactNode {
  function unwrapTypedValue(value: any): any {
    if (!value || typeof value !== 'object') return value;
    // Handle A2UI typed value wrappers from data model
    if (value.literalString !== undefined) return value.literalString;
    if (value.literalNumber !== undefined) return value.literalNumber;
    if (value.literalBoolean !== undefined) return value.literalBoolean;
    if (value.literalArray !== undefined) return value.literalArray;
    return value;
  }

  function resolveBoundValue(bound: any, scopeDataModel?: Record<string, any>): any {
    if (!bound) return undefined;
    if (bound.literalString !== undefined) return bound.literalString;
    if (bound.literalNumber !== undefined) return bound.literalNumber;
    if (bound.literalBoolean !== undefined) return bound.literalBoolean;
    if (bound.literalArray !== undefined) return bound.literalArray;
    if (bound.path) {
      const parts = bound.path.replace(/^\//, '').split('/');
      // Try scope first (template item context), then fall back to root dataModel
      const source = scopeDataModel || dataModel;
      let value = source;
      for (const p of parts) {
        value = value?.[p];
      }
      // If scope didn't resolve and we have a scope, try root dataModel as fallback
      if (value === undefined && scopeDataModel) {
        value = dataModel;
        for (const p of parts) {
          value = value?.[p];
        }
      }
      const result = unwrapTypedValue(value);
      return result;
    }
    // If none of the above matched, bound is an invalid object - return undefined
    return undefined;
  }

  function render(id: string, scopeDataModel?: Record<string, any>): React.ReactNode {
    const comp = componentMap.get(id);
    if (!comp) {
      console.warn(`Component not found in map: ${id}`);
      return null;
    }

    const [type, props] = Object.entries(comp.component)[0];
    const Component = (A2UIComponents as any)[type];
    if (!Component) {
      console.warn(`Unknown component type: ${type} for component: ${id}`);
      return null;
    }

    console.log(`Rendering ${id} as ${type}`, props);

    // Resolve props
    const resolved: Record<string, any> = {};
    for (const [key, val] of Object.entries(props as any)) {
      if (key === 'child') {
        resolved.child = render(val as string, scopeDataModel);
      } else if (key === 'children') {
        const childrenVal = val as { explicitList?: string[]; template?: { dataBinding: string; componentId: string } } | undefined;
        if (childrenVal?.explicitList) {
          resolved.children = childrenVal.explicitList.map((childId: string) => render(childId, scopeDataModel));
        } else if (childrenVal?.template) {
          // Template children: iterate over data at dataBinding path, render componentId for each item
          const { dataBinding, componentId } = childrenVal.template;
          const items = resolveBoundValue({ path: dataBinding }, scopeDataModel);
          if (items && typeof items === 'object') {
            const entries = Array.isArray(items) ? items.map((v, i) => [String(i), v] as const) : Object.entries(items);
            resolved.children = entries.map(([itemKey, itemData]) => {
              const itemScope = typeof itemData === 'object' && itemData !== null ? itemData : {};
              return React.createElement('div', { key: itemKey }, render(componentId, itemScope));
            });
          } else {
            resolved.children = [];
          }
        }
      } else if (key === 'tabItems') {
        const tabItemsVal = val as Array<{ title: any; child: string }> | undefined;
        if (tabItemsVal) {
          resolved.tabItems = tabItemsVal.map((tab) => ({
            title: tab.title && typeof tab.title === 'object' ? resolveBoundValue(tab.title, scopeDataModel) : tab.title,
            child: render(tab.child, scopeDataModel),
          }));
        }
      } else if (key === 'action') {
        resolved.action = val;
        resolved.onAction = onAction;
        resolved.isLoading = isLoading;
        resolved.sourceComponentId = id;
      } else if (key === 'value') {
        const valueVal = val as { literalString?: string; literalNumber?: number; literalBoolean?: boolean; literalArray?: string[]; path?: string } | undefined;

        console.log(`[renderer] Processing '${key}' for ${type}:`, {
          valueVal,
          hasPath: !!valueVal?.path,
          hasLiteralString: valueVal?.literalString !== undefined,
          hasLiteralNumber: valueVal?.literalNumber !== undefined,
          path: valueVal?.path
        });

        if (valueVal?.path) {
          const path = valueVal.path;
          const resolvedValue = resolveBoundValue(valueVal, scopeDataModel);
          resolved.value = resolvedValue;
          resolved.onChange = (newValue: any) => {
            console.log(`[renderer] onChange called for ${type} at path ${path}:`, newValue);
            onValueChange?.(path, newValue);
          };
          console.log(`[renderer] Resolved ${key} for ${type} at path ${path}:`, resolvedValue);
        } else if (valueVal?.literalString !== undefined || valueVal?.literalNumber !== undefined || valueVal?.literalBoolean !== undefined || valueVal?.literalArray !== undefined) {
          resolved.value = resolveBoundValue(valueVal, scopeDataModel);
        } else {
          console.warn(`[renderer] No valid value for ${key} in ${type}, valueVal:`, valueVal);
          resolved[key] = val;
        }
      } else if (key === 'text') {
        // Text component uses 'text' prop, TextField uses 'value' prop
        const textVal = val as { literalString?: string; literalNumber?: number; literalBoolean?: boolean; literalArray?: string[]; path?: string } | undefined;
        const isTextField = type === 'TextField';
        const targetProp = isTextField ? 'value' : 'text';

        console.log(`[renderer] Processing '${key}' for ${type}:`, {
          textVal,
          hasPath: !!textVal?.path,
          hasLiteralString: textVal?.literalString !== undefined,
          path: textVal?.path
        });

        if (textVal?.path) {
          const path = textVal.path;
          const resolvedValue = resolveBoundValue(textVal, scopeDataModel);
          resolved[targetProp] = resolvedValue;
          resolved.onChange = (newValue: any) => {
            console.log(`[renderer] onChange called for ${type} at path ${path}:`, newValue);
            onValueChange?.(path, newValue);
          };
          console.log(`[renderer] Resolved ${targetProp} for ${type} at path ${path}:`, resolvedValue);
        } else if (textVal?.literalString !== undefined || textVal?.literalNumber !== undefined || textVal?.literalBoolean !== undefined || textVal?.literalArray !== undefined) {
          resolved[targetProp] = resolveBoundValue(textVal, scopeDataModel);
        } else {
          console.warn(`[renderer] No valid value for ${key} in ${type}, textVal:`, textVal);
          resolved[key] = val;
        }
      } else if (key === 'selections') {
        const selectionsVal = val as { literalArray?: string[]; path?: string } | undefined;
        if (selectionsVal?.path) {
          const path = selectionsVal.path;
          const resolvedValue = resolveBoundValue(selectionsVal, scopeDataModel);
          resolved.selections = Array.isArray(resolvedValue) ? resolvedValue : [];
          resolved.onChange = (newValue: any) => onValueChange?.(path, newValue);
        } else if (selectionsVal?.literalArray !== undefined) {
          const resolvedValue = resolveBoundValue(selectionsVal, scopeDataModel);
          resolved.selections = Array.isArray(resolvedValue) ? resolvedValue : [];
        } else {
          resolved[key] = val;
        }
      } else if (key === 'options') {
        // Options can be a BoundValue path or an explicit array
        const optionsVal = val as any;
        if (optionsVal && typeof optionsVal === 'object' && 'path' in optionsVal) {
          // Resolve options from data model path
          const resolvedOptions = resolveBoundValue(optionsVal, scopeDataModel);
          if (resolvedOptions && typeof resolvedOptions === 'object') {
            // Convert object with numeric keys to array
            const entries = Object.entries(resolvedOptions);
            resolved.options = entries.map(([, opt]: [string, any]) => ({
              label: opt?.label && typeof opt.label === 'object' ? resolveBoundValue(opt.label, scopeDataModel) : (opt?.label ?? ''),
              value: opt?.value ?? '',
            }));
          } else {
            resolved.options = [];
          }
        } else if (optionsVal && Array.isArray(optionsVal)) {
          // Options are an explicit array with BoundValue labels
          resolved.options = optionsVal.map((opt: any) => ({
            ...opt,
            label: opt.label && typeof opt.label === 'object' ? resolveBoundValue(opt.label, scopeDataModel) : opt.label,
          }));
        } else {
          resolved.options = [];
        }
      } else if (key === 'label') {
        // Label can be either literalString or path
        const labelVal = val as { literalString?: string; path?: string } | undefined;
        if (labelVal && typeof labelVal === 'object' && labelVal !== null) {
          resolved.label = resolveBoundValue(labelVal, scopeDataModel) ?? '';
        } else {
          resolved[key] = val ?? '';
        }
      } else if (val && typeof val === 'object' && ('literalString' in val || 'path' in val || 'literalNumber' in val || 'literalBoolean' in val || 'literalArray' in val)) {
        resolved[key] = resolveBoundValue(val, scopeDataModel);
      } else {
        resolved[key] = val;
      }
    }

    if (id.includes('date') || id.includes('guests') || id.includes('name') || id.includes('email') || id.includes('form-card') || id.includes('form-content')) {
      console.log(`Resolved props for ${id}:`, resolved);
    }
    // Include component version in key to force remount when component is updated
    const version = componentVersions?.get(id) ?? 0;
    return <Component key={`${id}-v${version}`} {...resolved} />;
  }

  return render(rootId);
}
