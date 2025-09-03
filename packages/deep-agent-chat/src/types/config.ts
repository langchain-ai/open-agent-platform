export interface DeepAgentChatConfig {
  assistantId: string;
  deploymentUrl: string;
  accessToken?: string;
  optimizerDeploymentUrl?: string;
  optimizerAccessToken?: string;
  mode?: "oap" | "standalone";
  SidebarTrigger?: React.ComponentType<{ className?: string }>;
  DeepAgentChatBreadcrumb?: React.ComponentType;
}