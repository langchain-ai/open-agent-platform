export interface McpServerConfig {
    url: string;
    auth: Record<string, string>;
  }
  
  export interface McpServerFormData {
    url: string;
    authHeaders: Array<{ key: string; value: string }>;
  }
  