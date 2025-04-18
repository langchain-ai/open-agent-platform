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
export type ConfigurableFieldUIMetadata<V = unknown> = {
  /**
   * The default value to render in the UI.
   *
   * @default undefined
   */
  default?: V;
  /**
   * The type of the field.
   * @default "text"
   */
  type?: ConfigurableFieldUIType;
  /**
   * The description of the field.
   */
  description?: string;
  /**
   * The placeholder of the field.
   */
  placeholder?: string;
  /**
   * The options of the field.
   */
  options?: ConfigurableFieldOption[];
  /**
   * The minimum value of the field.
   */
  min?: number;
  /**
   * The maximum value of the field.
   */
  max?: number;
  /**
   * The step value of the field. E.g if using a slider, where you want
   * people to be able to increment by 0.1, you would set this field to 0.1
   */
  step?: number;
};
