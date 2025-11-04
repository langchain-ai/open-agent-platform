/**
 * System prompt compilation utilities.
 *
 * Combines multiple agent prompt templates (from different tools/MCPs)
 * into a single coherent system prompt that the LLM agent will use.
 */

import { FullPromptTemplate } from "@/types/prompt";
import { Tool } from "@/types/tool";
import { fetchPromptTemplateWithCache } from "./prompt-api";

/**
 * Selection of a tool and its chosen prompt template mode
 */
export interface ToolModeSelection {
  /**
   * The tool name
   */
  toolName: string;
  /**
   * The MCP server this tool comes from
   */
  mcpServer: string;
  /**
   * The selected template key (e.g., 'research_assistant')
   */
  templateKey: string;
}

/**
 * Options for prompt compilation
 */
export interface CompileOptions {
  /**
   * Include tool usage guidelines sections
   */
  includeGuidelines?: boolean;
  /**
   * Include example queries sections
   */
  includeExamples?: boolean;
  /**
   * Include best practices sections
   */
  includeBestPractices?: boolean;
  /**
   * Include common pitfalls sections
   */
  includePitfalls?: boolean;
  /**
   * Custom intro/header for the compiled prompt
   */
  customIntro?: string;
}

/**
 * Compile a system prompt from selected tool template modes.
 *
 * Fetches full templates from the aggregator, then combines them
 * into a single coherent system prompt with clear sections.
 *
 * @param selections - Array of tool+mode selections
 * @param options - Compilation options
 * @returns Promise resolving to the compiled system prompt string
 */
export async function compileSystemPrompt(
  selections: ToolModeSelection[],
  options: CompileOptions = {},
): Promise<string> {
  const {
    includeGuidelines = true,
    includeExamples = false,
    includeBestPractices = true,
    includePitfalls = true,
    customIntro,
  } = options;

  if (selections.length === 0) {
    return (
      "You are a helpful AI assistant with access to various tools. " +
      "Use them effectively to help users achieve their goals."
    );
  }

  // Fetch all templates
  const templates: Array<ToolModeSelection & { template: FullPromptTemplate }> =
    await Promise.all(
      selections.map(async (sel) => ({
        ...sel,
        template: await fetchPromptTemplateWithCache(
          sel.mcpServer,
          sel.templateKey,
        ),
      })),
    );

  // Build the compiled prompt
  let prompt = "";

  // Add intro/header
  if (customIntro) {
    prompt += `${customIntro}\n\n`;
  } else if (selections.length === 1) {
    // Single-tool agent: use the template's agent_role directly
    prompt += `${templates[0].template.agent_role || templates[0].template.system_prompt}\n\n`;
  } else {
    // Multi-tool agent: create a composite intro
    prompt += "You are a specialized AI agent with multiple capabilities:\n\n";
    templates.forEach(({ toolName, template }) => {
      prompt += `- **${template.name}** (${toolName}): ${template.description}\n`;
    });
    prompt += "\n";
  }

  // Add each template's system prompt
  templates.forEach(({ toolName, template }, index) => {
    if (selections.length > 1) {
      prompt += `## Capability ${index + 1}: ${template.name}\n\n`;
    }

    prompt += `${template.system_prompt}\n\n`;

    // Add guidelines if requested
    if (
      includeGuidelines &&
      template.tool_usage_guidelines &&
      template.tool_usage_guidelines.length > 0
    ) {
      prompt += "**Tool Usage Guidelines:**\n";
      template.tool_usage_guidelines.forEach((guideline) => {
        prompt += `- ${guideline}\n`;
      });
      prompt += "\n";
    }

    // Add examples if requested
    if (
      includeExamples &&
      template.example_queries &&
      template.example_queries.length > 0
    ) {
      prompt += "**Example Queries:**\n";
      template.example_queries.forEach((query) => {
        prompt += `- "${query}"\n`;
      });
      prompt += "\n";
    }

    // Separator between templates
    if (selections.length > 1 && index < templates.length - 1) {
      prompt += "---\n\n";
    }
  });

  // Add consolidated best practices
  if (includeBestPractices) {
    const allBestPractices = templates.flatMap(
      (t) => t.template.recommended_for || [],
    );
    if (allBestPractices.length > 0) {
      prompt += "## Recommended Use Cases\n\n";
      // Deduplicate
      const unique = Array.from(new Set(allBestPractices));
      unique.forEach((useCase) => {
        prompt += `- ${useCase}\n`;
      });
      prompt += "\n";
    }
  }

  // Add consolidated pitfalls
  if (includePitfalls) {
    const allPitfalls = templates.flatMap(
      (t) =>
        t.template.tool_usage_guidelines?.filter((g) =>
          g.toLowerCase().includes("avoid"),
        ) || [],
    );
    if (allPitfalls.length > 0) {
      prompt += "## Important Guidelines\n\n";
      allPitfalls.forEach((pitfall) => {
        prompt += `- ${pitfall}\n`;
      });
      prompt += "\n";
    }
  }

  return prompt.trim();
}

/**
 * Build tool mode selections from current agent configuration.
 *
 * @param tools - All available tools
 * @param selectedToolNames - Tools enabled for this agent
 * @param toolPromptModes - Map of tool name to selected template key
 * @returns Array of ToolModeSelection objects ready for compilation
 */
export function buildToolModeSelections(
  tools: Tool[],
  selectedToolNames: string[],
  toolPromptModes: Record<string, string>,
): ToolModeSelection[] {
  const selections: ToolModeSelection[] = [];

  for (const toolName of selectedToolNames) {
    const tool = tools.find((t) => t.name === toolName);
    if (!tool || !tool.metadata) continue;

    const templateKey = toolPromptModes[toolName];
    if (!templateKey) continue; // No mode selected for this tool

    const mcpServer = tool.metadata.mcp_server;
    if (!mcpServer) continue; // Non-MCP tool

    selections.push({
      toolName,
      mcpServer,
      templateKey,
    });
  }

  return selections;
}

/**
 * Estimate token count for a prompt (rough approximation).
 *
 * @param prompt - System prompt text
 * @returns Approximate token count (word count / 0.75)
 */
export function estimatePromptTokens(prompt: string): number {
  const words = prompt.split(/\s+/).length;
  return Math.ceil(words / 0.75); // Rough approximation
}
