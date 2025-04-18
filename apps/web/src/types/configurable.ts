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
export interface Option {
  label: string;
  value: string;
}

export type ConfigurableField<V = unknown> = {
  /**
   * The value of the field. This will contain any inputs the
   * user has made, and it should also contain any default value
   * you choose to provide to this field.
   *
   * @default undefined
   */
  value?: V;
  /**
   * The config options for the UI field.
   */
  uiConfig: {
    /**
     * The type of the field.
     */
    type: ConfigurableFieldUIType;
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
    options?: Option[];
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
};

/**
 * The type interface for a configurable object.
 */
export type Configurable<V = unknown> = {
  /**
   * The name of the field. Used to render a label in the UI.
   */
  [name: string]: ConfigurableField<V>;
};
