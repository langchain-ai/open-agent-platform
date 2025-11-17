export type InputSchema = {
  type: "object";
  properties?: Record<string, any>;
  required?: string[];
};

/**
 * Summary of an agent prompt template (lightweight, from MCP metadata)
 */
export interface PromptTemplateSummary {
  /**
   * Template key/identifier (e.g., 'research_assistant')
   */
  key: string;
  /**
   * Human-readable name (e.g., 'Research Assistant')
   */
  name: string;
  /**
   * Brief description of when to use this template
   */
  description: string;
  /**
   * Use cases where this template excels
   */
  recommended_for?: string[];
}

/**
 * Agent prompts metadata attached to tools (from MCP server)
 */
export interface AgentPromptsMetadata {
  /**
   * Available prompt templates (summaries only, full templates
   * fetched on demand)
   */
  available_templates: PromptTemplateSummary[];
  /**
   * Best practices that apply across all templates for this tool
   */
  general_best_practices?: string[];
  /**
   * Common mistakes to avoid when using this tool
   */
  common_pitfalls?: string[];
  /**
   * Configuration hints (environment variables, setup requirements)
   */
  configuration_hints?: Record<string, string>;
}

/**
 * Tool metadata (from MCP server, includes agent prompt recommendations)
 */
export interface ToolMetadata {
  /**
   * Name of the MCP server providing this tool
   */
  mcp_server?: string;
  /**
   * Original tool name before any prefixing
   */
  original_name?: string;
  /**
   * Categories of operations this tool provides (for visual indicators)
   */
  tool_categories?: string[];
  /**
   * Agent prompt recommendations for this tool
   */
  agent_prompts?: AgentPromptsMetadata;
}

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
   * Optional metadata including agent prompt recommendations
   */
  metadata?: ToolMetadata;
}
