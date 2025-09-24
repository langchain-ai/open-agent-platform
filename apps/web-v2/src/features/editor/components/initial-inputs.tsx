import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import AutoGrowTextarea from "@/components/ui/area-grow-textarea";
import { getOptimizerClient } from "@/lib/client";
import { useAuthContext } from "@/providers/Auth";
import { toast } from "sonner";
import { useMCPContext } from "@/providers/MCP";
import { useStream } from "@langchain/langgraph-sdk/react";
import { AIMessage, Assistant, Message } from "@langchain/langgraph-sdk";
import { useAgentsContext } from "@/providers/Agents";
import { Loader2 } from "lucide-react";
import { getDeployments } from "@/lib/environment/deployments";
import { useLangChainAuth } from "@/hooks/use-langchain-auth";
import { DeepAgentConfiguration } from "@/types/deep-agent";
import { AuthRequiredDialog } from "@/components/agent-creator-sheet/components/auth-required-dialog";

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
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center space-y-6 p-6">
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

const getFollowupQuestionsMessage = (messages: Message[]) => {
  return messages.findLast(
    (message) =>
      message.type === "ai" &&
      message.tool_calls?.length &&
      message.tool_calls[0].name === "FollowupQuestions",
  ) as AIMessage | undefined;
};

interface ClarifyingQuestionsProps {
  onResponseChange: (response: string) => void;
  onSubmit: () => void;
  messages: Message[];
  loading: boolean;
  loadingText: string;
}

function ClarifyingQuestions({
  onResponseChange,
  onSubmit,
  messages,
  loading,
  loadingText,
}: ClarifyingQuestionsProps) {
  const followupQuestionsMessage = useMemo(() => {
    return getFollowupQuestionsMessage(messages);
  }, [messages]);

  const followups: string[] | undefined =
    followupQuestionsMessage?.tool_calls?.[0].args?.questions;

  const [individualResponses, setIndividualResponses] = useState<string[]>([]);

  useEffect(() => {
    if (followups && followups.length > 0 && individualResponses.length === 0) {
      setIndividualResponses(new Array(followups.length).fill(""));
    }
  }, [followups, individualResponses.length]);

  const handleIndividualResponseChange = (index: number, value: string) => {
    const newResponses = [...individualResponses];
    newResponses[index] = value;
    setIndividualResponses(newResponses);

    const mergedResponse = newResponses
      .map((resp, idx) => `${idx + 1}. ${resp}`)
      .filter((resp) => resp.trim() !== `${resp.split(".")[0]}.`)
      .join("\n\n");

    onResponseChange(mergedResponse);
  };

  if (!followups || followups.length === 0) {
    return (
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center space-y-3 p-6">
        <div className="space-y-2">
          <Label className="text-2xl font-semibold">Loading questions...</Label>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center space-y-6 p-6">
      <div className="space-y-2">
        <Label className="text-2xl font-semibold">
          Please answer these clarifying questions
        </Label>
      </div>

      <div className="w-full space-y-6">
        {followups.map((question, index) => (
          <div
            key={index}
            className="space-y-2"
          >
            <div className="rounded-lg border bg-gray-50 p-4">
              <p className="text-base leading-relaxed">
                <span className="text-muted-foreground text-sm font-light">
                  {index + 1}.{" "}
                </span>
                {question}
              </p>
            </div>

            <AutoGrowTextarea
              id={`question-${index}`}
              value={individualResponses[index] || ""}
              onChange={(e) =>
                handleIndividualResponseChange(index, e.target.value)
              }
              placeholder={`Your answer to question ${index + 1}...`}
              minRows={3}
              maxRows={6}
              className="w-full"
            />
          </div>
        ))}
      </div>

      <Button
        onClick={onSubmit}
        disabled={!individualResponses.some((resp) => resp.trim()) || loading}
        className="w-full"
      >
        {loading ? (
          <span className="flex flex-row items-center gap-1">
            <Loader2 className="h-4 w-4 animate-spin" />
            {loadingText}
          </span>
        ) : (
          "Submit Responses"
        )}
      </Button>
    </div>
  );
}

const ASSISTANT_ID = "agent_generator";

interface InitialInputsProps {
  onAgentCreated?: (agentId: string, deploymentId: string) => Promise<void>;
}

export function InitialInputs({
  onAgentCreated,
}: InitialInputsProps): React.ReactNode {
  const { tools } = useMCPContext();
  const { session } = useAuthContext();
  const { refreshAgents } = useAgentsContext();
  const { verifyUserAuthScopes, authRequiredUrls } = useLangChainAuth();

  const [step, setStep] = useState(1);
  const [description, setDescription] = useState("");
  const [response, setResponse] = useState("");

  const [creatingAgentLoadingText, setCreatingAgentLoadingText] = useState("");
  const [creatingAgent, setCreatingAgent] = useState(false);

  const [authRequiredDialogOpen, setAuthRequiredDialogOpen] = useState(false);
  const [enabledToolNames, setEnabledToolNames] = useState<string[]>([]);
  const [newAgentId, setNewAgentId] = useState<string | null>(null);

  const client = useMemo(() => {
    if (!session?.accessToken) return null;
    return getOptimizerClient(session.accessToken);
  }, [session]);

  const stream = useStream({
    client: client ?? undefined,
    assistantId: ASSISTANT_ID,
    reconnectOnMount: true,
    onUpdateEvent: async (data) => {
      if (!("generate_config" in data)) return;
      const newAgent = data.generate_config.assistant as Assistant | undefined;
      if (!newAgent || !newAgent.assistant_id) {
        toast.error("Failed to create agent", {
          richColors: true,
        });
        return;
      }

      const agentConfigurable = newAgent.config?.configurable as
        | DeepAgentConfiguration
        | undefined;
      const enabledToolNames = agentConfigurable?.tools?.tools ?? [];
      if (enabledToolNames?.length) {
        setEnabledToolNames(enabledToolNames);
        setNewAgentId(newAgent.assistant_id);
        const success = await validateAuth(enabledToolNames);
        if (!success) {
          return;
        }
      }

      setCreatingAgent(true);
      await refreshAgents();

      // Get deployment from the agent data or use default
      const deployments = getDeployments();
      const deploymentId = deployments[0]?.id || "";

      // Call the parent callback to handle navigation
      if (onAgentCreated) {
        await onAgentCreated(newAgent.assistant_id, deploymentId);
      }

      resetState();
    },
  });

  const validateAuth = async (enabledToolNames: string[]): Promise<boolean> => {
    if (!session?.accessToken) {
      toast.error("No access token found", {
        richColors: true,
      });
      setAuthRequiredDialogOpen(false);
      return false;
    }

    const success = await verifyUserAuthScopes(session.accessToken, {
      enabledToolNames: enabledToolNames,
      tools,
    });
    if (!success) {
      setAuthRequiredDialogOpen(true);
      return false;
    }
    setAuthRequiredDialogOpen(false);
    return true;
  };

  const resetState = () => {
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
    const followupQuestionsMessage = getFollowupQuestionsMessage(
      stream.messages ?? [],
    );
    const toolCallId = followupQuestionsMessage?.tool_calls?.[0].id;
    if (!toolCallId) {
      toast.error("Failed to load followup questions", {
        richColors: true,
      });
      return;
    }

    setCreatingAgentLoadingText("Generating agent...");

    stream.submit(
      {
        messages: [
          {
            role: "tool",
            tool_call_id: toolCallId,
            name: "FollowupQuestions",
            content: response,
          },
        ],
      },
      {
        streamMode: ["updates"],
      },
    );
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
      <>
        <ClarifyingQuestions
          onResponseChange={setResponse}
          onSubmit={handleQuestionsSubmit}
          messages={stream.messages ?? []}
          loading={stream.isLoading || creatingAgent}
          loadingText={creatingAgentLoadingText}
        />
        <AuthRequiredDialog
          hideCancel={true}
          open={authRequiredDialogOpen}
          onOpenChange={setAuthRequiredDialogOpen}
          authUrls={authRequiredUrls}
          handleSubmit={async () => {
            const success = await validateAuth(enabledToolNames);
            if (!success) {
              return;
            }

            await refreshAgents();

            if (newAgentId && onAgentCreated) {
              const deployments = getDeployments();
              const deploymentId = deployments[0]?.id || "";
              await onAgentCreated(newAgentId, deploymentId);
            }

            resetState();
          }}
        />
      </>
    );
  }
}
