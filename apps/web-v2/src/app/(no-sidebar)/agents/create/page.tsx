"use client";

import React, { useState } from "react";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CreateAgentToolsSelection } from "@/features/agents/components/create-agent-tools-selection";
import { CreateAgentTriggersSelection } from "@/features/agents/components/create-agent-triggers-selection";
import { useAgents } from "@/hooks/use-agents";
import { useTriggers } from "@/hooks/use-triggers";
import { useAgentsContext } from "@/providers/Agents";
import { useAuthContext } from "@/providers/Auth";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";

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
  const [completedSections, setCompletedSections] = useState<Set<number>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  
  // Form state
  const [agentName, setAgentName] = useState("");
  const [agentDescription, setAgentDescription] = useState("");
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [interruptConfig, setInterruptConfig] = useState<{[toolName: string]: {allow_accept: boolean; allow_respond: boolean; allow_edit: boolean; allow_ignore: boolean}}>({});
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [systemPrompt, setSystemPrompt] = useState("");

  // Hooks
  const auth = useAuthContext();
  const { createAgent } = useAgents();
  const { setupAgentTrigger } = useTriggers();
  const { refreshAgents } = useAgentsContext();

  // Handle section completion
  const handleSectionComplete = (sectionId: number) => {
    setCompletedSections(prev => new Set([...prev, sectionId]));
  };

  // Check if all sections are completed
  const allSectionsCompleted = completedSections.size === 4;

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
      // For now, we'll use a default deployment and graph
      // In a real implementation, you'd want to get these from context or props
      const defaultDeploymentId = "default"; // This should come from your app's context
      const defaultGraphId = "default"; // This should come from your app's context

      // Prepare the config object
      const config = {
        tools: {
          tools: selectedTools,
          interrupt_config: interruptConfig,
        },
        triggers: selectedTriggers,
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

      // Set up triggers if any are selected
      if (selectedTriggers.length > 0) {
        const success = await setupAgentTrigger(auth.session.accessToken, {
          selectedTriggerIds: selectedTriggers,
          agentId: newAgent.assistant_id,
        });

        if (!success) {
          toast.error("Failed to set up triggers");
          return;
        }
      }

      toast.success("Agent created successfully!");
      
      // Refresh the agents list
      refreshAgents();
      
      // TODO: Navigate to the new agent or close the dialog
      // For now, we'll just show success
      
    } catch (error) {
      console.error("Error creating agent:", error);
      toast.error("Failed to create agent");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-md">Create new agent</h1>
          <div className="ml-[12px] p-1 border border-gray-300 rounded">
            <FileText className="h-4 w-4 text-gray-500" />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Cancel</Button>
          <Button 
            disabled={currentSection !== 4 || !systemPrompt.trim() || isCreating}
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

      {/* Main Content Area */}
      <div className="flex flex-1">
        {/* Left Sidebar with sections */}
        <div className="w-80 border-r bg-muted/50">
          {/* Section List */}
          <div className="p-6">
            <div>
              {sections.map((section, index) => (
                <div
                  key={section.id}
                  className={`cursor-pointer transition-colors hover:opacity-70 p-4 rounded ${
                    currentSection === section.id
                      ? "bg-gray-100"
                      : ""
                  }`}
                  onClick={() => setCurrentSection(section.id)}
                >
                  <div className="flex items-center gap-6">
                    <div
                      className={`text-base font-light ${
                        currentSection === section.id
                          ? "text-gray-500"
                          : "text-gray-300"
                      }`}
                    >
                      {section.id}
                    </div>
                    <div>
                      <h3 className={`text-base font-normal ${
                        currentSection === section.id
                          ? "text-black"
                          : "text-black"
                      }`}>{section.title}</h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-6">
            <div className="mx-auto">
              <div className="mb-6">
                <h2 className="text-md font-medium mb-2">
                  {sections.find((s) => s.id === currentSection)?.pageTitle || sections.find((s) => s.id === currentSection)?.title}
                </h2>
                <p className="text-muted-foreground">
                  {sections.find((s) => s.id === currentSection)?.description}
                </p>
              </div>

              {/* Content based on selected section */}
              <div className="space-y-8">
                {currentSection === 1 && (
                  <div className="space-y-6">
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="agent-name" className="text-sm font-medium">
                          Name
                        </Label>
                        <Input
                          id="agent-name"
                          className="mt-1"
                          placeholder="Enter agent name"
                          value={agentName}
                          onChange={(e) => setAgentName(e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="agent-description" className="text-sm font-medium">
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
                      The clearer you are, the better your agent will match your needs.
                    </p>
                  </div>
                )}
              
                {currentSection === 2 && (
                  <CreateAgentTriggersSelection
                    selectedTriggers={selectedTriggers}
                    onTriggersChange={setSelectedTriggers}
                  />
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
                      <Label htmlFor="system-prompt" className="text-sm font-medium">
                        System Prompt
                      </Label>
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
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentSection(Math.max(1, currentSection - 1))}
                  disabled={currentSection === 1}
                >
                  Back
                </Button>
                <Button 
                  onClick={() => {
                    if (currentSection === 1) {
                      handleSectionComplete(1); // Mark configure section as completed
                      setCurrentSection(2); // Go to triggers
                    } else if (currentSection === 2) {
                      handleSectionComplete(2); // Mark triggers section as completed
                      setCurrentSection(3); // Go to tools
                    } else if (currentSection === 3) {
                      handleSectionComplete(3); // Mark tools section as completed
                      setCurrentSection(4); // Go to system prompt
                    }
                  }}
                >
                  {currentSection === 1 ? "Configure triggers →" : 
                   currentSection === 2 ? "Configure tools →" :
                   "Configure system prompt →"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}