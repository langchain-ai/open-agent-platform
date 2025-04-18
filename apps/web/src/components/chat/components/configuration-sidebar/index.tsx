"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Save, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfigField } from "@/components/chat/components/configuration-sidebar/config-field";
import { ConfigSection } from "@/components/chat/components/configuration-sidebar/config-section";
import { useConfigStore } from "@/components/chat/hooks/use-config-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { TooltipIconButton } from "@/components/ui/tooltip-icon-button";
import { useQueryState } from "nuqs";
import { ConfigurableFieldUIMetadata } from "@/types/configurable";
import { createClient } from "@/lib/client";

export interface AIConfigPanelProps {
  className?: string;
  defaultOpen?: boolean;
  onSave?: (config: any) => void;
}

export function ConfigurationSidebar({
  className, // className is now applied to the fixed panel
  defaultOpen = false,
  onSave,
}: AIConfigPanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { config, resetConfig } = useConfigStore();
  const [agentId] = useQueryState("agentId");
  const [deploymentId] = useQueryState("deploymentId");
  const [configurations, setConfigurations] = useState<
    ConfigurableFieldUIMetadata[]
  >([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!agentId || !deploymentId) return;

    const getAssistantConfigSchemas = async () => {
      setLoading(true);
      try {
        const client = createClient(deploymentId);
        const schemas = await client.assistants.getSchemas(agentId);
        return schemas.config_schema;
      } catch (e) {
        console.error("Failed to get assistant schemas");
      } finally {
        setLoading(false);
      }
    };

    getAssistantConfigSchemas().then((schemas) => {
      if (schemas) {
        console.log(schemas);
      }
    });
  }, [agentId, deploymentId]);

  const handleSave = () => {
    if (onSave) {
      onSave(config);
    }
  };

  return (
    <>
      <div
        className={cn(
          "fixed top-0 right-0 z-10 h-screen border-l border-gray-200 bg-white shadow-lg transition-all duration-300",
          isOpen ? "w-80 md:w-xl" : "w-0 overflow-hidden border-l-0",
          className,
        )}
      >
        {isOpen && (
          <div className="flex h-full flex-col">
            <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 p-4">
              <h2 className="text-lg font-semibold">Agent Configuration</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetConfig}
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Reset
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                >
                  <Save className="mr-1 h-4 w-4" />
                  Save
                </Button>
              </div>
            </div>

            <Tabs
              defaultValue="general"
              className="flex flex-1 flex-col overflow-hidden"
            >
              <TabsList className="flex-shrink-0 justify-start bg-transparent px-4 pt-2">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="tools">Tools</TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1">
                <TabsContent
                  value="general"
                  className="m-0 p-4"
                >
                  <ConfigSection title="Configuration">
                    {configurations.map((c, index) => (
                      <ConfigField
                        key={`${c.label}-${index}`}
                        id={c.label}
                        label={c.label}
                        type={
                          c.type === "boolean" ? "switch" : (c.type ?? "text")
                        }
                        description={c.description}
                        placeholder={c.placeholder}
                        options={c.options}
                        min={c.min}
                        max={c.max}
                        step={c.step}
                        // TODO: How to set default values?
                      />
                    ))}
                  </ConfigSection>
                </TabsContent>

                <TabsContent
                  value="tools"
                  className="m-0 p-4"
                >
                  <ConfigSection
                    title="Available Tools"
                    action={
                      <Button
                        variant="ghost"
                        size="sm"
                      >
                        <Plus className="mr-1 h-4 w-4" />
                        Add Tool
                      </Button>
                    }
                  >
                    <ConfigField
                      id="enableWebSearch"
                      label="Web Search"
                      type="switch"
                      description="Allow the AI to search the web for information"
                    />
                    <ConfigField
                      id="enableCalculator"
                      label="Calculator"
                      type="switch"
                      description="Enable mathematical calculations"
                    />
                    <ConfigField
                      id="enableCodeInterpreter"
                      label="Code Interpreter"
                      type="switch"
                      description="Run code snippets and return results"
                    />
                    <ConfigField
                      id="enableImageGeneration"
                      label="Image Generation"
                      type="switch"
                      description="Generate images from text descriptions"
                    />
                    <Separator className="my-2" />
                    <ConfigField
                      id="customTools"
                      label="Custom Tools"
                      type="json"
                      description="Define custom tools in JSON format"
                    />
                  </ConfigSection>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>
        )}
      </div>

      <TooltipIconButton
        onClick={() => setIsOpen(!isOpen)}
        tooltip={`${isOpen ? "Hide" : "Show"} Configuration Sidebar`}
        className={cn(
          "fixed top-4 z-20 size-9 rounded-full border border-gray-200 bg-white shadow-sm transition-all duration-300",
          isOpen ? "right-[theme(spacing.80)] md:right-[37rem]" : "right-2",
        )}
      >
        {isOpen ? (
          <ChevronRight className="size-4" />
        ) : (
          <ChevronLeft className="size-4" />
        )}
      </TooltipIconButton>
    </>
  );
}
