/**
 * API client for fetching agent prompt templates from the aggregator.
 *
 * The aggregator exposes REST endpoints for retrieving full prompt templates
 * on demand. This keeps MCP listTools lightweight (template summaries only)
 * while allowing rich template data to be fetched when needed.
 */

import { FullPromptTemplate, MCPPromptConfig } from "@/types/prompt";

/**
 * Get the aggregator base URL from environment
 */
function getAggregatorUrl(): string {
  // Use the same MCP server URL but for REST calls (without /mcp suffix)
  const baseUrl = process.env.NEXT_PUBLIC_MCP_SERVER_URL;
  if (!baseUrl) {
    throw new Error(
      "NEXT_PUBLIC_MCP_SERVER_URL is not configured. " +
        "Cannot fetch prompt templates.",
    );
  }
  return baseUrl;
}

/**
 * Fetch all prompt templates for a specific MCP server.
 *
 * @param mcpServer - Name of the MCP server (e.g., 'searxng_enhanced')
 * @returns Promise resolving to the complete prompt configuration
 * @throws Error if fetch fails or server not found
 */
export async function fetchMCPPrompts(
  mcpServer: string,
): Promise<MCPPromptConfig> {
  const baseUrl = getAggregatorUrl();
  const url = `${baseUrl}/prompts/${mcpServer}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        `No prompt templates found for MCP server '${mcpServer}'. ` +
          `This tool may not have agent prompt recommendations configured.`,
      );
    }
    throw new Error(
      `Failed to fetch prompts for ${mcpServer}: ${response.statusText}`,
    );
  }

  return response.json();
}

/**
 * Fetch a single prompt template for an MCP server.
 *
 * @param mcpServer - Name of the MCP server
 * @param templateKey - Key of the specific template
 * @returns Promise resolving to the full template
 * @throws Error if fetch fails or template not found
 */
export async function fetchPromptTemplate(
  mcpServer: string,
  templateKey: string,
): Promise<FullPromptTemplate> {
  const baseUrl = getAggregatorUrl();
  const url = `${baseUrl}/prompts/${mcpServer}/${templateKey}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        `Template '${templateKey}' not found for MCP server ` +
          `'${mcpServer}'.`,
      );
    }
    throw new Error(
      `Failed to fetch template ${templateKey} for ${mcpServer}: ` +
        `${response.statusText}`,
    );
  }

  return response.json();
}

/**
 * Cache for fetched templates (session-scoped, in-memory)
 * Key format: "{mcpServer}:{templateKey}"
 */
const templateCache = new Map<string, FullPromptTemplate>();

/**
 * Fetch a template with caching support.
 *
 * @param mcpServer - MCP server name
 * @param templateKey - Template key
 * @returns Cached template or fetches from API
 */
export async function fetchPromptTemplateWithCache(
  mcpServer: string,
  templateKey: string,
): Promise<FullPromptTemplate> {
  const cacheKey = `${mcpServer}:${templateKey}`;

  // Check cache first
  if (templateCache.has(cacheKey)) {
    return templateCache.get(cacheKey)!;
  }

  // Fetch and cache
  const template = await fetchPromptTemplate(mcpServer, templateKey);
  templateCache.set(cacheKey, template);

  return template;
}
