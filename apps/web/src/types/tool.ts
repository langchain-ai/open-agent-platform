export type InputSchema = {
  type: "object";
  properties?: Record<string, any>;
  required?: string[];
};

export interface Tool {
  /**
   * The name of the tool
   */
  name: string;
  /**
   * The tool's description
   */
  description?: string;
  /**
   * The tool's input schema
   */
  inputSchema: InputSchema;
  /**
   * The OAuth provider ID associated
   * with the tool.
   */
  auth_provider?: string;
  /**
   * The auth scopes this tool requires
   */
  scopes?: string[];
}
