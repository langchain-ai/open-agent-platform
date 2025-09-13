import { OnboardingInputs, GeneratedAgentConfig, AgentConfigGenerationResult, AgentFieldGeneration } from "./types";

// First step: Generate agent fields based on user inputs
async function generateAgentFields(inputs: OnboardingInputs): Promise<AgentFieldGeneration> {
  // This would typically call an LLM with the tool schema
  // For now, we'll simulate the generation based on inputs
  return await simulateAgentFieldGeneration(inputs);
}

// Second step: Create the final agent configuration
async function createAgentConfig(generatedFields: AgentFieldGeneration): Promise<GeneratedAgentConfig> {
  // Create the final agent configuration
  const agentConfig: GeneratedAgentConfig = {
    name: generatedFields.name || "Custom Agent",
    description: generatedFields.description || "A custom agent created from onboarding inputs",
    config: {
      model: generatedFields.model || "gpt-4o-mini",
      system_prompt: generatedFields.system_prompt || "You are a helpful assistant.",
      temperature: generatedFields.temperature || 0.7,
      max_tokens: generatedFields.max_tokens || 4000,
      tools: generatedFields.recommended_tools || [],
      ...(generatedFields.rag_needed && {
        rag_config: {
          rag_url: typeof window !== 'undefined' ? (window as any).location.origin + '/api/rag' : "",
          collections: ["general"],
        },
      }),
    },
  };

  return agentConfig;
}

// Simulate LLM-based field generation
async function simulateAgentFieldGeneration(inputs: OnboardingInputs): Promise<AgentFieldGeneration> {
  // This is a simplified simulation - in reality, this would call an LLM
  const useCase = inputs.useCase.toLowerCase();
  
  let name = "Custom Assistant";
  let description = `An AI assistant designed for ${inputs.useCase}`;
  let system_prompt = `You are a helpful AI assistant specialized in ${inputs.useCase}.`;
  
  // Customize based on use case
  if (useCase.includes("email") || useCase.includes("communication")) {
    name = "Email Assistant";
    description = "An AI assistant that helps with email management, composition, and communication tasks.";
    system_prompt = `You are an expert email assistant. You help users compose professional emails, manage their inbox, and improve their communication skills. You're polite, concise, and always maintain a professional tone.`;
  } else if (useCase.includes("research") || useCase.includes("analysis")) {
    name = "Research Assistant";
    description = "An AI assistant that helps with research, data analysis, and information gathering.";
    system_prompt = `You are a thorough research assistant. You help users gather information, analyze data, and provide well-sourced insights. You always verify information and cite sources when possible.`;
  } else if (useCase.includes("content") || useCase.includes("writing")) {
    name = "Content Creator";
    description = "An AI assistant that helps with content creation, writing, and creative tasks.";
    system_prompt = `You are a creative content assistant. You help users write engaging content, brainstorm ideas, and improve their writing. You adapt your style to match the user's needs and audience.`;
  } else if (useCase.includes("code") || useCase.includes("development")) {
    name = "Code Assistant";
    description = "An AI assistant that helps with programming, code review, and development tasks.";
    system_prompt = `You are an expert programming assistant. You help users write, debug, and optimize code. You provide clear explanations and follow best practices for the programming languages you work with.`;
  }

  // Add industry-specific context
  if (inputs.industry) {
    system_prompt += ` You have specialized knowledge in the ${inputs.industry} industry.`;
  }

  // Determine recommended tools based on use case
  const recommended_tools = [];
  if (useCase.includes("email") || useCase.includes("communication")) {
    recommended_tools.push("email_tool", "calendar_tool");
  }
  if (useCase.includes("research") || useCase.includes("analysis")) {
    recommended_tools.push("web_search", "data_analysis_tool");
  }
  if (useCase.includes("content") || useCase.includes("writing")) {
    recommended_tools.push("image_generator", "grammar_checker");
  }
  if (useCase.includes("code") || useCase.includes("development")) {
    recommended_tools.push("code_executor", "git_tool");
  }

  return {
    name,
    description,
    model: inputs.preferredModel || "gpt-4o-mini",
    system_prompt,
    temperature: 0.7,
    max_tokens: 4000,
    recommended_tools,
    rag_needed: inputs.ragNeeded || useCase.includes("research") || useCase.includes("knowledge"),
  };
}

// Main function to generate agent config from onboarding inputs
export async function generateAgentConfigFromOnboarding(
  inputs: OnboardingInputs
): Promise<AgentConfigGenerationResult> {
  try {
    // First step: Generate agent fields
    const generatedFields = await generateAgentFields(inputs);
    
    // Second step: Create the final agent configuration
    const agentConfig = await createAgentConfig(generatedFields);

    return {
      success: true,
      agentConfig,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
