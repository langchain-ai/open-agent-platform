import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAgents } from "@/hooks/use-agents";
import { useAgentsContext } from "@/providers/Agents";
import { useAuthContext } from "@/providers/Auth";
import { Dispatch, SetStateAction, useState } from "react";
import { toast } from "sonner";
import { SidebarMenuButton, SidebarMenuItem } from "../ui/sidebar";
import { ArrowLeft, LoaderCircle, Plus } from "lucide-react";
import TriggersInterface from "@/features/triggers";
import { CreateAgentToolsSelection } from "@/components/agent-creator-sheet/components/create-agent-tools-selection";
import { Textarea } from "../ui/textarea";
import { cn } from "@/lib/utils";
import { SubAgentCreator } from "./components/sub-agents";
import { SubAgent } from "@/types/sub-agent";
import { z } from "zod";
import { subAgentFormSchema } from "./components/sub-agents/form";
import { useForm } from "react-hook-form";

const sections = [
  {
    id: 1,
    title: "Configure",
    pageTitle: "Configure your agent",
    description: "Basic agent settings and configuration",
    completed: false,
  },
  {
    id: 2,
    title: "Triggers",
    description: "Set up triggers for your agent",
    completed: false,
  },
  {
    id: 3,
    title: "Tools",
    description: "Select the tools your agent should have access to",
    completed: false,
  },
  {
    id: 4,
    title: "Sub-agents",
    description: "Select or create sub-agents for your agent",
    completed: false,
  },
  {
    id: 5,
    title: "System Prompt",
    description: "Define the system prompt and sub-agents",
    completed: false,
  },
];

function AgentConfiguration(props: {
  name: string;
  setName: Dispatch<SetStateAction<string>>;
  description: string;
  setDescription: Dispatch<SetStateAction<string>>;
}) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-md font- mb-2">Configure your agent</h2>
        <p className="text-muted-foreground">
          Basic agent settings and configuration
        </p>
      </div>
      <div className="space-y-4">
        <div>
          <Label
            htmlFor="agent-name"
            className="text-sm font-medium text-gray-700"
          >
            Name
            <span className="-ml-1 text-red-500">*</span>
          </Label>
          <Input
            id="agent-name"
            className="mt-1 h-10"
            placeholder="Enter agent name"
            value={props.name}
            onChange={(e) => props.setName(e.target.value)}
            required
          />
        </div>

        <div>
          <Label
            htmlFor="agent-description"
            className="text-sm font-medium text-gray-700"
          >
            Description
          </Label>
          <Textarea
            id="agent-description"
            className="mt-1 min-h-[197px]"
            placeholder="e.g. Handles common customer questions, provides troubleshooting steps, and escalates complex issues to a human."
            value={props.description}
            onChange={(e) => props.setDescription(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

const createAgentFormSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  triggers: z.array(z.string()).optional(),
  tools: z.array(z.string()).optional(),
  subAgents: subAgentFormSchema.array().optional(),
  systemPrompt: z.string(),
});

export function AgentCreatorSheet() {
  const [open, setOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState(1);
  const [isCreating, setIsCreating] = useState(false);

  const [agentName, setAgentName] = useState("");
  const [agentDescription, setAgentDescription] = useState("");
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [interruptConfig, setInterruptConfig] = useState<{
    [toolName: string]: {
      allow_accept: boolean;
      allow_respond: boolean;
      allow_edit: boolean;
      allow_ignore: boolean;
    };
  }>({});
  const [subAgents, setSubAgents] = useState<SubAgent[]>([]);
  const [systemPrompt, setSystemPrompt] = useState("");

  const form = useForm<z.infer<typeof createAgentFormSchema>>({
    defaultValues: {
      name: "",
      description: "",
      triggers: [],
      tools: [],
      subAgents: [],
      systemPrompt: "",
    },
  });

  const auth = useAuthContext();
  const { createAgent } = useAgents();
  const { refreshAgents } = useAgentsContext();

  // Handle agent creation
  const handleCreateAgent = async () => {
    if (!auth.session?.accessToken) {
      toast.error("No access token found");
      return;
    }

    if (!agentName.trim() || !agentDescription.trim() || !systemPrompt.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsCreating(true);

    try {
      // Get the default deployment and graph from environment configuration
      const { getDeployments } = await import("@/lib/environment/deployments");
      const deployments = getDeployments();
      const defaultDeployment = deployments.find((d) => d.isDefault);

      if (!defaultDeployment) {
        toast.error("No default deployment found");
        return;
      }

      const defaultGraph = defaultDeployment.graphs.find((g) => g.isDefault);
      if (!defaultGraph) {
        toast.error("No default graph found");
        return;
      }

      const defaultDeploymentId = defaultDeployment.id;
      const defaultGraphId = defaultGraph.id;

      const config = {
        tools: {
          tools: selectedTools,
          interrupt_config: interruptConfig,
        },
        triggers: [],
        system_prompt: systemPrompt,
      };

      // Create the agent
      const newAgent = await createAgent(defaultDeploymentId, defaultGraphId, {
        name: agentName,
        description: agentDescription,
        config,
      });

      if (!newAgent) {
        toast.error("Failed to create agent");
        return;
      }

      toast.success("Agent created successfully!");

      // Refresh the agents list
      refreshAgents();

      window.location.href = "/chat";
    } catch (error) {
      console.error("Error creating agent:", error);
      toast.error("Failed to create agent");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSubAgentChange = (subAgents: SubAgent[]) => {
    setSubAgents(subAgents);
    // TODO: Ensure any tools enabled in the sub-agent are also enabled in the parent agent
  };

  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
    >
      <SheetTrigger asChild>
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip="New agent"
            onClick={() => setOpen(true)}
          >
            <Plus />
            <p className="text-sm">New Agent</p>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SheetTrigger>

      <SheetContent
        className="min-w-[85%] gap-0"
        hideClose={true}
      >
        <SheetHeader className="flex flex-row items-center justify-between">
          <div className="flex flex-row items-center gap-2">
            <SheetClose className="cursor-pointer">
              <ArrowLeft className="size-3.5 text-gray-600" />
            </SheetClose>
            <SheetTitle className="text-sm font-medium">
              Create new agent
            </SheetTitle>
          </div>

          <div className="flex gap-2">
            <SheetClose asChild>
              <Button variant="outline">Cancel</Button>
            </SheetClose>
            <Button
              disabled={
                currentSection !== 5 || !systemPrompt.trim() || isCreating
              }
              onClick={handleCreateAgent}
            >
              {isCreating ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </SheetHeader>

        <div className="bg-muted/50 flex h-full w-full flex-row">
          <div className="flex flex-col p-3">
            {sections.map((section) => (
              <div
                key={section.id}
                className={cn(
                  `rounded p-4`,
                  currentSection === section.id ? "bg-gray-100" : "",
                )}
              >
                <div className="flex items-center gap-6">
                  <div
                    className={cn(
                      `text-base font-light`,
                      currentSection === section.id
                        ? "text-gray-500"
                        : "text-gray-300",
                    )}
                  >
                    {section.id}
                  </div>
                  <div>
                    <h3
                      className={cn(
                        `text-base font-normal`,
                        currentSection === section.id
                          ? "text-black"
                          : "text-black",
                      )}
                    >
                      {section.title}
                    </h3>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-background m-3 flex w-full flex-col rounded-2xl p-3">
            <div className="flex-1 p-6">
              <div className="mx-auto">
                <div className="space-y-8">
                  {currentSection === 1 && (
                    <AgentConfiguration
                      name={agentName}
                      setName={setAgentName}
                      description={agentDescription}
                      setDescription={setAgentDescription}
                    />
                  )}

                  {currentSection === 2 && (
                    <div className="space-y-4">
                      <div className="mb-6">
                        <h2 className="text-md font- mb-2">Triggers</h2>
                        <p className="text-muted-foreground">
                          Set up triggers for your agent
                        </p>
                      </div>
                      <TriggersInterface />
                    </div>
                  )}

                  {currentSection === 3 && (
                    <div className="scrollbar-pretty-auto max-h-[60vh] pr-2">
                      <div className="mb-6">
                        <h2 className="text-md font- mb-2">Tools</h2>
                        <p className="text-muted-foreground">
                          Set up tools for your agent
                        </p>
                      </div>
                      <CreateAgentToolsSelection
                        selectedTools={selectedTools}
                        onToolsChange={setSelectedTools}
                        interruptConfig={interruptConfig}
                        onInterruptConfigChange={setInterruptConfig}
                      />
                    </div>
                  )}

                  {currentSection === 4 && (
                    <SubAgentCreator
                      subAgents={subAgents}
                      onSubAgentChange={handleSubAgentChange}
                    />
                  )}

                  {currentSection === 5 && (
                    <div className="space-y-6">
                      <div className="mb-6">
                        <h2 className="text-md font- mb-2">System Prompt</h2>
                        <p className="text-muted-foreground">
                          Define the system prompt
                        </p>
                      </div>
                      <div>
                        <Textarea
                          id="system-prompt"
                          className="mt-1 min-h-[400px]"
                          placeholder="Enter the system prompt for your agent..."
                          value={systemPrompt}
                          onChange={(e) => setSystemPrompt(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex justify-end">
                <div className="flex gap-2">
                  {currentSection !== 1 && (
                    <Button
                      variant="outline"
                      onClick={() => setCurrentSection(currentSection - 1)}
                      className="border-gray-300 bg-white text-black hover:bg-gray-50"
                    >
                      Back
                    </Button>
                  )}
                  {currentSection !== 5 && (
                    <Button
                      onClick={() => {
                        setCurrentSection((prev) =>
                          prev !== 5 ? prev + 1 : prev,
                        );
                      }}
                      disabled={currentSection === 1 && !agentName.trim()}
                    >
                      {currentSection === 1
                        ? "Configure triggers →"
                        : currentSection === 2
                          ? "Configure tools →"
                          : currentSection === 3
                            ? "Configure sub-agents →"
                            : "Configure system prompt →"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
