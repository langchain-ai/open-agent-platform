// The type interface for configuration fields

export type ConfigurableFieldUIType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "slider"
  | "select"
  | "json";

/**
 * The type interface for options in a select field.
 */
export interface ConfigurableFieldOption {
  label: string;
  value: string;
}

/**
 * The UI configuration for a field in the configurable object.
 */
export type ConfigurableFieldUIMetadata = {
  /**
   * The label of the field. This will be what is rendered in the UI.
   */
  label: string;
  /**
   * The default value to render in the UI component.
   *
   * @default undefined
   */
  default?: unknown;
  /**
   * The type of the field.
   * @default "text"
   */
  type?: ConfigurableFieldUIType;
  /**
   * The description of the field. This will be rendered below the UI component.
   */
  description?: string;
  /**
   * The placeholder of the field. This will be rendered inside the UI component.
   * This is only applicable for text, textarea, number, json, and select fields.
   */
  placeholder?: string;
  /**
   * The options of the field. These will be the options rendered in the select UI component.
   * This is only applicable for select fields.
   */
  options?: ConfigurableFieldOption[];
  /**
   * The minimum value of the field.
   * This is only applicable for number fields.
   */
  min?: number;
  /**
   * The maximum value of the field.
   * This is only applicable for number fields.
   */
  max?: number;
  /**
   * The step value of the field. E.g if using a slider, where you want
   * people to be able to increment by 0.1, you would set this field to 0.1
   * This is only applicable for number fields.
   */
  step?: number;
  /**
   * The group this field belongs to for organizational purposes.
   * Fields with the same group will be rendered together in a collapsible section.
   */
  group?: string;
  /**
   * The order in which groups should be displayed.
   * Lower numbers appear first.
   */
  group_order?: number;
  /**
   * Whether the group should be collapsed by default.
   * @default false
   */
  group_collapsed?: boolean;
  /**
   * Lucide icon name to display next to the field label.
   */
  icon?: string;
  /**
   * Conditional visibility based on another field's value.
   * Field will only be shown if the specified field has the specified value.
   */
  visible_if?: {
    field: string;
    value: any;
  };
};

export type ConfigurableFieldMCPMetadata = {
  label: string;
  type: "mcp";
  scope?: "graph" | "agent"; // Graph-wide vs agent-specific
  default?: {
    tools?: string[];
    url?: string;
    auth_required?: boolean;
  };
};

export type ConfigurableFieldRAGMetadata = {
  /**
   * The key in the graph's config schema for the RAG field.
   */
  label: string;
  type: "rag";
  scope?: "graph" | "agent"; // Graph-wide vs agent-specific
  default?: {
    rag_url?: string;
    collections?: string[];
  };
};

export type ConfigurableFieldAgentsMetadata = {
  label: string;
  type: "agents";
  default?: {
    agent_id?: string;
    deployment_url?: string;
    name?: string;
  }[];
};
