import { validate } from "uuid";
import { MCPServerConfig } from "@/types/mcp";

export function isMCPServerConfig(obj: unknown): obj is MCPServerConfig {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "id" in obj &&
    typeof obj.id === "string" &&
    validate(obj.id) &&
    "name" in obj &&
    typeof obj.name === "string" &&
    "url" in obj &&
    typeof obj.url === "string"
  );
}

/**
 * Loads the provided MCP server configs from the environment variable.
 * @returns {MCPServerConfig[]} The list of MCP server configs.
 */
export function getMCPServerConfigs(): MCPServerConfig[] {
  const mcpServers: MCPServerConfig[] = JSON.parse(
    process.env.NEXT_PUBLIC_MCP_SERVERS || "[]",
  );
  const allEnvConfigsValid = mcpServers.every(isMCPServerConfig);
  if (!allEnvConfigsValid) {
    throw new Error("Invalid MCP server config");
  }
  return mcpServers;
}
