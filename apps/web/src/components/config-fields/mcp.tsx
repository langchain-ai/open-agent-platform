"use client";

import React, { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { OctagonPause } from "lucide-react";
import { Button } from "@/components/ui/button";
import _ from "lodash";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HumanInterruptConfig } from "@/types/inbox";
import { InterruptConfigDialog } from "./interrupt-config-dialog";
import { ConfigFieldProps } from "./types";
import { MCPConfig } from "@/types/deep-agent";

const getInterruptConfig = (
  interruptConfig: Record<string, HumanInterruptConfig> | undefined,
  label: string,
): HumanInterruptConfig | false => {
  // if there isn't an interrupt config, the tool doesn't exist yet, or it's set to false, return false.
  if (
    !interruptConfig ||
    !(label in interruptConfig) ||
    !interruptConfig[label]
  ) {
    return false;
  }

  return interruptConfig[label];
};

export function ConfigFieldTool({
  id,
  label,
  description,
  className,
  value,
  setValue,
}: Pick<
  ConfigFieldProps<MCPConfig>,
  "id" | "label" | "description" | "className" | "value" | "setValue"
>) {
  const [interruptDialogOpen, setInterruptDialogOpen] = useState(false);
  const checked = value.tools?.some((t) => t === label);
  const interruptConfig = {
    ...(value.interrupt_config || {}),
    [label]: getInterruptConfig(value.interrupt_config, label),
  };

  const interruptsConfigured = Object.values(
    interruptConfig?.[label] || {},
  ).some((v) => v);

  const handleCheckedChange = (checked: boolean) => {
    const newValue = checked
      ? {
          ...value,
          url: value.url || process.env.NEXT_PUBLIC_MCP_SERVER_URL,
          tools: Array.from(new Set<string>([...(value.tools || []), label])),
        }
      : {
          ...value,
          url: value.url || process.env.NEXT_PUBLIC_MCP_SERVER_URL,
          tools: value.tools?.filter((t) => t !== label),
        };

    setValue(newValue);
  };

  const handleInterruptConfigChange = (
    newConfig: HumanInterruptConfig | boolean,
  ) => {
    const allSetToFalse =
      !newConfig || Object.values(newConfig).every((v) => !v);
    const newValue = {
      ...value,
      // Remove duplicates
      interrupt_config: {
        ...interruptConfig,
        [label]: allSetToFalse ? false : newConfig,
      },
    };

    setValue(newValue);
  };

  return (
    <>
      <div className={cn("w-full space-y-2", className)}>
        <div className="flex items-center justify-between">
          <Label
            htmlFor={id}
            className="text-sm font-medium"
          >
            {_.startCase(label)}
          </Label>
          <div className="flex items-center gap-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={interruptsConfigured ? "info" : "outline"}
                    size="sm"
                    onClick={() => setInterruptDialogOpen(true)}
                    type="button"
                    className="text-xs"
                  >
                    {interruptsConfigured
                      ? "Edit interrupts"
                      : "Configure interrupts"}
                    <OctagonPause className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
              </Tooltip>
            </TooltipProvider>
            <Switch
              id={id}
              checked={checked} // Use currentValue
              onCheckedChange={handleCheckedChange}
            />
          </div>
        </div>

        {description && (
          <p className="text-xs whitespace-pre-line text-gray-500">
            {description}
          </p>
        )}
      </div>

      <InterruptConfigDialog
        open={interruptDialogOpen}
        onOpenChange={setInterruptDialogOpen}
        config={getInterruptConfig(interruptConfig, label)}
        onInterruptChange={handleInterruptConfigChange}
      />
    </>
  );
}
