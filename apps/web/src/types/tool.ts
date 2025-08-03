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
}

// Re-export ToolWithServer from mcp.ts for convenience
export type { ToolWithServer } from "./mcp";

