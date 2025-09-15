"use client";

import React, { useState } from "react";
import { ArrowLeft, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CreateAgentToolsSelection } from "@/features/agents/components/create-agent-tools-selection";
import { useAgents } from "@/hooks/use-agents";
import { useAgentsContext } from "@/providers/Agents";
import { useAuthContext } from "@/providers/Auth";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";
import TriggersInterface from "@/features/triggers";

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
    title: "System Prompt",
    description: "Define the system prompt and sub-agents",
    completed: false,
  },
];

export default function CreateAgentPage(): React.ReactNode {
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
  const [systemPrompt, setSystemPrompt] = useState("");

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

  return (
    <div className="flex h-screen flex-col">
      {/* Top Header Bar */}
      <div className="bg-background flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-md tracking-tight">Create new agent</h1>
          <div className="ml-[8px] rounded border border-gray-300 p-2">
            <FileText className="h-4 w-4 text-gray-500" />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Cancel</Button>
          <Button
            disabled={
              currentSection !== 4 || !systemPrompt.trim() || isCreating
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
      </div>

      <div className="flex flex-1">
        <div className="bg-muted/50 w-80 border-r">
          <div className="p-3">
            <div>
              {sections.map((section, index) => (
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
          </div>
        </div>

        <div className="flex flex-1 flex-col">
          <div className="flex-1 p-6">
            <div className="mx-auto">
              <div className="mb-6">
                <h2 className="text-md font- mb-2">
                  {sections.find((s) => s.id === currentSection)?.pageTitle ||
                    sections.find((s) => s.id === currentSection)?.title}
                </h2>
                <p className="text-muted-foreground text-gray-500">
                  {sections.find((s) => s.id === currentSection)?.description}
                </p>
              </div>

              <div className="space-y-8">
                {currentSection === 1 && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label
                          htmlFor="agent-name"
                          className="text-sm font-medium text-gray-700"
                        >
                          Name
                        </Label>
                        <Input
                          id="agent-name"
                          className="mt-1 h-10"
                          placeholder="Enter agent name"
                          value={agentName}
                          onChange={(e) => setAgentName(e.target.value)}
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
                          value={agentDescription}
                          onChange={(e) => setAgentDescription(e.target.value)}
                        />
                      </div>
                    </div>

                    <p className="text-sm text-gray-500">
                      The clearer you are, the better your agent will match your
                      needs.
                    </p>
                  </div>
                )}

                {currentSection === 2 && (
                  <div className="space-y-4">
                    <TriggersInterface showTitle={false} />
                  </div>
                )}

                {currentSection === 3 && (
                  <CreateAgentToolsSelection
                    selectedTools={selectedTools}
                    onToolsChange={setSelectedTools}
                    interruptConfig={interruptConfig}
                    onInterruptConfigChange={setInterruptConfig}
                  />
                )}

                {currentSection === 4 && (
                  <div className="space-y-6">
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

          {/* Fixed bottom buttons */}
          {currentSection !== 4 && (
            <div className="p-6">
              <div className="flex justify-end">
                <div className="flex gap-2">
                  {(currentSection === 2 || currentSection === 3) && (
                    <Button
                      variant="outline"
                      onClick={() => setCurrentSection(currentSection - 1)}
                      className="border-gray-300 bg-white text-black hover:bg-gray-50"
                    >
                      Back
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      if (currentSection === 1) {
                        setCurrentSection(2);
                      } else if (currentSection === 2) {
                        setCurrentSection(3);
                      } else if (currentSection === 3) {
                        setCurrentSection(4);
                      }
                    }}
                    disabled={
                      currentSection === 1 &&
                      (!agentName.trim() || !agentDescription.trim())
                    }
                  >
                    {currentSection === 1
                      ? "Configure triggers →"
                      : currentSection === 2
                        ? "Configure tools →"
                        : "Configure system prompt →"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
