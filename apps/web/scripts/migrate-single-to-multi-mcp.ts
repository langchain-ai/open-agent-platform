#!/usr/bin/env node

/**
 * Migration script to convert legacy single MCP server configuration to multi-server format
 * 
 * Usage:
 *   node scripts/migrate-single-to-multi-mcp.ts
 * 
 * This script reads the legacy environment variables:
 *   - NEXT_PUBLIC_MCP_SERVER_URL
 *   - NEXT_PUBLIC_MCP_AUTH_REQUIRED
 * 
 * And generates the new NEXT_PUBLIC_MCP_SERVERS JSON configuration.
 * 
 * The output can be copied to your .env file or environment configuration.
 * 
 * Example output:
 *   NEXT_PUBLIC_MCP_SERVERS='{"default":{"type":"http","url":"http://localhost:3001","authProvider":{"type":"bearer"}}}'
 */

import { MCPServersConfig, MCPServerHTTPConfig } from "../src/types/mcp";

function migrateSingleToMultiMCP(): void {
  const legacyUrl = process.env.NEXT_PUBLIC_MCP_SERVER_URL;
  const authRequired = process.env.NEXT_PUBLIC_MCP_AUTH_REQUIRED === "true";

  if (!legacyUrl) {
    console.error("❌ No legacy MCP server configuration found.");
    console.error("   NEXT_PUBLIC_MCP_SERVER_URL is not set.");
    process.exit(1);
  }

  console.log("🔍 Found legacy MCP configuration:");
  console.log(`   URL: ${legacyUrl}`);
  console.log(`   Auth Required: ${authRequired}`);
  console.log("");

  // Create the new multi-server configuration
  const serverConfig: MCPServerHTTPConfig = {
    type: "http",
    url: legacyUrl,
  };

  // Add auth provider if authentication was required
  if (authRequired) {
    serverConfig.authProvider = {
      type: "bearer",
    };
  }

  const multiServerConfig: MCPServersConfig = {
    default: serverConfig,
  };

  // Generate the JSON string
  const jsonConfig = JSON.stringify(multiServerConfig);

  console.log("✅ Generated multi-server configuration:");
  console.log("");
  console.log("Add the following to your .env file:");
  console.log("=====================================");
  console.log(`NEXT_PUBLIC_MCP_SERVERS='${jsonConfig}'`);
  console.log("=====================================");
  console.log("");
  console.log("📝 Notes:");
  console.log("   - The legacy server is now named 'default'");
  console.log("   - You can add more servers by editing the JSON");
  console.log("   - The legacy variables can be removed after migration");
  console.log("");
  console.log("Example with multiple servers:");
  console.log("==============================");
  const exampleConfig: MCPServersConfig = {
    default: serverConfig,
    "github-tools": {
      type: "http",
      url: "https://api.github.com/mcp",
      authProvider: {
        type: "api-key",
        apiKey: "your-api-key-here",
      },
    },
    "local-stdio": {
      type: "stdio",
      command: "node",
      args: ["./local-mcp-server.js"],
    },
  };
  console.log(`NEXT_PUBLIC_MCP_SERVERS='${JSON.stringify(exampleConfig, null, 2)}'`);
}

// Run the migration
if (require.main === module) {
  migrateSingleToMultiMCP();
}
