import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import AutoGrowTextarea from "@/components/ui/area-grow-textarea";
import { createClient, getOptimizerClient } from "@/lib/client";
import { useAuthContext } from "@/providers/Auth";
import { toast } from "sonner";
import { useQueryState } from "nuqs";
import { useMCPContext } from "@/providers/MCP";
import { useStream } from "@langchain/langgraph-sdk/react";
import { Message } from "@langchain/langgraph-sdk";
import { SubAgent } from "@/types/sub-agent";
import { useAgentsContext } from "@/providers/Agents";
import { Loader2 } from "lucide-react";
import { getDeployments } from "@/lib/environment/deployments";

interface AgentDescriptionProps {
  description: string;
  onDescriptionChange: (description: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

function AgentDescription({
  description,
  onDescriptionChange,
  onSubmit,
  loading,
}: AgentDescriptionProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6 flex flex-col items-center justify-center min-h-screen">
      <div className="space-y-2">
        <Label
          htmlFor="agent-description"
          className="text-2xl font-semibold"
        >
          Describe the agent you want to build
        </Label>
        <p className="text-lg text-gray-600">
          Provide a clear description of what you want your agent to do and how
          it should behave.
        </p>
      </div>

      <AutoGrowTextarea
        id="agent-description"
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder="e.g., I want to build an agent that helps users plan their travel itineraries by suggesting destinations, accommodations, and activities based on their preferences and budget..."
        minRows={4}
        maxRows={8}
        className="w-full"
      />

      <Button
        onClick={onSubmit}
        disabled={!description.trim() || loading}
        className="w-full"
      >
        Continue
      </Button>
    </div>
  );
}

interface ClarifyingQuestionsProps {
  response: string;
  onResponseChange: (response: string) => void;
  onSubmit: () => void;
  messages: Message[];
  loading: boolean;
  loadingText: string;
}

function ClarifyingQuestions({
  response,
  onResponseChange,
  onSubmit,
  messages,
  loading,
  loadingText,
}: ClarifyingQuestionsProps) {
  const firstAiMessage = useMemo(() => {
    return messages.find((message) => message.type === "ai");
  }, [messages]);

  return (
    <div className="mx-auto max-w-2xl space-y-3 p-6 flex flex-col items-center justify-center min-h-screen">
      <div className="space-y-2">
        <Label className="text-2xl font-semibold">
          Please answer these clarifying questions
        </Label>

        <div className="w-xl rounded-lg border bg-gray-50 p-4">
          <p className="text-lg leading-relaxed whitespace-pre-wrap">
            {firstAiMessage ? (firstAiMessage.content as string) : "Loading..."}
          </p>
        </div>
      </div>

      <div className="space-y-2 w-full">
        <Label
          htmlFor="clarifying-response"
          className="text-lg font-medium"
        >
          Your response
        </Label>
        <AutoGrowTextarea
          id="clarifying-response"
          value={response}
          onChange={(e) => onResponseChange(e.target.value)}
          placeholder="Please provide your answers to the questions above..."
          minRows={4}
          maxRows={8}
          className="w-full"
        />
      </div>

      <Button
        onClick={onSubmit}
        disabled={!response.trim() || loading}
        className="w-full"
      >
        {loading ? (
          <span className="flex flex-row items-center gap-1">
            <Loader2 className="h-4 w-4 animate-spin" />
            {loadingText}
          </span>
        ) : (
          "Submit Response"
        )}
      </Button>
    </div>
  );
}

const ASSISTANT_ID = "agent_generator";

interface GeneratedAgentFields {
  name: string;
  description: string;
  instructions: string;
  subagents: SubAgent[];
  tools: string[];
}

export function InitialInputs(): React.ReactNode {
  const { tools } = useMCPContext();
  const { session } = useAuthContext();
  const { refreshAgents } = useAgentsContext();

  const [deploymentId, setDeploymentId] = useQueryState("deploymentId");
  const [_agentId, setAgentId] = useQueryState("agentId");
  const [agentCreatorThreadId, setAgentCreatorThreadId] = useQueryState(
    "agentCreatorThreadId",
  );

  const [step, setStep] = useState(1);
  const [description, setDescription] = useState("");
  const [response, setResponse] = useState("");

  const [creatingAgentLoadingText, setCreatingAgentLoadingText] = useState("");
  const [creatingAgent, setCreatingAgent] = useState(false);

  const client = useMemo(() => {
    if (!session?.accessToken) return null;
    return getOptimizerClient(session.accessToken);
  }, [session]);

  const deploymentClient = useMemo(() => {
    if (!deploymentId || !session?.accessToken) return null;
    return createClient(deploymentId, session.accessToken);
  }, [deploymentId, session]);

  const deployments = getDeployments();
  useEffect(() => {
    if (deploymentId) {
      return;
    }
    const deployment = deployments.find((d) => d.isDefault) ?? deployments[0];
    setDeploymentId(deployment.id);
  }, []);

  const stream = useStream({
    client: client ?? undefined,
    assistantId: ASSISTANT_ID,
    onThreadId: (threadId) => {
      setAgentCreatorThreadId(threadId);
    },
    threadId: agentCreatorThreadId,
    reconnectOnMount: true,
    onFinish: async (state) => {
      const { messages } = state.values as { messages: Message[] };
      const lastMessage = messages[messages.length - 1];
      if (
        lastMessage.type !== "ai" ||
        !lastMessage.tool_calls?.length ||
        lastMessage.tool_calls[0].name !== "AgentConfig"
      ) {
        return;
      }

      const agentConfig = lastMessage.tool_calls[0]
        .args as GeneratedAgentFields;
      await createAssistant(agentConfig);
    },
  });

  const resetState = () => {
    setAgentCreatorThreadId(null);
    setStep(1);
    setDescription("");
    setResponse("");
    setCreatingAgent(false);
    setCreatingAgentLoadingText("");
  };

  const handleDescriptionSubmit = () => {
    if (!tools.length) {
      toast.error("No tools found", {
        richColors: true,
      });
      return;
    }

    stream.submit({
      messages: [
        {
          role: "user",
          content: description,
        },
      ],
      tools: tools.map((tool) => tool.name),
    });
    setStep(2);
  };

  const handleQuestionsSubmit = () => {
    setCreatingAgentLoadingText("Generating agent configuration...");
    stream.submit({
      messages: [
        {
          role: "user",
          content: response,
        },
      ],
    });
  };

  const createAssistant = async (args: GeneratedAgentFields) => {
    if (!deploymentClient) {
      toast.error("No deployment client found", {
        richColors: true,
      });
      return;
    }
    setCreatingAgent(true);
    setCreatingAgentLoadingText("Creating agent...");
    const response = await deploymentClient.assistants.create({
      graphId: "deep_agent",
      name: args.name,
      metadata: {
        description: args.description,
      },
      config: {
        configurable: {
          instructions: args.instructions,
          subagents: args.subagents.map((subAgent) => ({
            ...subAgent,
            mcp_server: process.env.NEXT_PUBLIC_MCP_SERVER_URL,
          })),
          tools: {
            tools: args.tools,
            url: process.env.NEXT_PUBLIC_MCP_SERVER_URL,
            auth_required: process.env.NEXT_PUBLIC_SUPABASE_AUTH_MCP === "true",
            // TODO: NEED TO GENERATE INTERRUPT CONFIG IN AGENT
            interrupt_config: false,
          },
        },
      },
    });

    setAgentId(response.assistant_id);
    await refreshAgents();
    resetState();
  };

  if (step === 1) {
    return (
      <AgentDescription
        description={description}
        onDescriptionChange={setDescription}
        onSubmit={handleDescriptionSubmit}
        loading={stream.isLoading}
      />
    );
  }

  if (step === 2) {
    return (
      <ClarifyingQuestions
        response={response}
        onResponseChange={setResponse}
        onSubmit={handleQuestionsSubmit}
        messages={stream.messages ?? []}
        loading={stream.isLoading || creatingAgent}
        loadingText={creatingAgentLoadingText}
      />
    );
  }
}
