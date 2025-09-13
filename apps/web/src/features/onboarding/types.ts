export interface OnboardingInputs {
  useCase: string;
  industry?: string;
  companySize?: string;
  primaryTasks?: string[];
  preferredModel?: string;
  toolsNeeded?: string[];
  ragNeeded?: boolean;
  teamSize?: string;
  budget?: string;
}

export interface GeneratedAgentConfig {
  name: string;
  description: string;
  config: {
    model?: string;
    system_prompt?: string;
    temperature?: number;
    max_tokens?: number;
    tools?: string[];
    rag_config?: {
      rag_url?: string;
      collections?: string[];
    };
    agents?: Array<{
      agent_id?: string;
      deployment_url?: string;
      name?: string;
    }>;
  };
}

export interface AgentFieldGeneration {
  name?: string;
  description?: string;
  model?: string;
  system_prompt?: string;
  temperature?: number;
  max_tokens?: number;
  recommended_tools?: string[];
  rag_needed?: boolean;
}

export interface AgentConfigGenerationResult {
  success: boolean;
  agentConfig?: GeneratedAgentConfig;
  error?: string;
}
