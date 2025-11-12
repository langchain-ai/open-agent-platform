/**
 * Full agent prompt template (fetched from aggregator REST API on demand)
 */
export interface FullPromptTemplate {
  /**
   * Human-readable name
   */
  name: string;
  /**
   * When to use this template
   */
  description: string;
  /**
   * Short role/persona statement
   */
  agent_role?: string;
  /**
   * Complete system prompt text (can be 200-400 lines)
   */
  system_prompt: string;
  /**
   * Specific guidelines for using the tools effectively
   */
  tool_usage_guidelines?: string[];
  /**
   * Example user queries that work well with this prompt
   */
  example_queries?: string[];
  /**
   * Use cases or scenarios where this prompt excels
   */
  recommended_for?: string[];
}

/**
 * Complete prompt configuration for an MCP server
 * (returned by GET /prompts/{mcp_server})
 */
export interface MCPPromptConfig {
  /**
   * MCP server name
   */
  mcp_server_name: string;
  /**
   * Brief description of what this MCP server provides
   */
  server_description?: string;
  /**
   * Categories of operations this MCP provides
   */
  tool_categories?: string[];
  /**
   * All available prompt templates for this MCP
   * (key is template_key, value is full template)
   */
  agent_prompts: Record<string, FullPromptTemplate>;
  /**
   * Best practices that apply across all prompts for this MCP
   */
  general_best_practices?: string[];
  /**
   * Common mistakes to avoid when using these tools
   */
  common_pitfalls?: string[];
  /**
   * Environment variable hints and configuration requirements
   */
  configuration_hints?: Record<string, string>;
}

/**
 * Configuration for agent prompt modes (stored in agent config)
 */
export interface ToolPromptModesConfig {
  /**
   * Map of tool name to selected template key
   * e.g., { "searxng_enhanced_search_web": "research_assistant" }
   */
  [toolName: string]: string;
}

/**
 * Agent system prompt configuration
 */
export interface AgentSystemPromptConfig {
  /**
   * Selected template modes for each tool
   */
  tool_prompt_modes?: ToolPromptModesConfig;
  /**
   * Whether to use compiled prompt from templates
   */
  use_compiled_prompt?: boolean;
  /**
   * Custom system prompt (if user edited the compiled template)
   */
  custom_system_prompt?: string;
  /**
   * Final system prompt to use (either compiled or custom)
   */
  system_prompt?: string;
}
