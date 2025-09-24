interface Option {
  label: string;
  value: string;
}

export interface ConfigFieldProps<Value = any> {
  id: string;
  label: string;
  type:
    | "text"
    | "textarea"
    | "number"
    | "switch"
    | "slider"
    | "select"
    | "json";
  description?: string;
  placeholder?: string;
  options?: Option[];
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  // Optional props for external state management
  value: Value;
  setValue: (value: Value) => void;
}
