export interface DeepAgentChatConfig {
  assistantId: string;
  deploymentUrl: string;
  accessToken?: string;
  optimizerDeploymentUrl?: string;
  optimizerAccessToken?: string;
  mode?: "oap" | "standalone";
  SidebarTrigger?: React.ComponentType<{ className?: string }>;
  DeepAgentChatBreadcrumb?: React.ComponentType;
  // Controls Chat vs Workflow view from the host app
  view?: "chat" | "workflow";
  onViewChange?: (view: "chat" | "workflow") => void;
  // When controlled by the host, hide the internal toggle UI
  hideInternalToggle?: boolean;
}
