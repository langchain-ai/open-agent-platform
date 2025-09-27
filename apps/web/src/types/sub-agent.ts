export interface SubAgent {
  name: string;
  description?: string;
  prompt: string;
  tools: string[];
  mcp_server?: string;
}
