export interface MCPServerConfig {
  /**
   * A UUID v4 identifier for the MCP server.
   */
  id: string;
  /**
   * A custom name for the MCP server.
   * This will be rendered to the user in the UI.
   */
  name: string;
  /**
   * The main URL of the MCP server.
   * This should be the URL which is used
   * to fetch and call tools.
   */
  url: string;
  /**
   * The URL to use for authentication.
   * This should be the URL which is used
   * to authenticate the user. If this is defined,
   * it is assumed that the MCP server requires
   * authentication.
   */
  authUrl?: string;
}
