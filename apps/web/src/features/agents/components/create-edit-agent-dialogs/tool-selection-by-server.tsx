import { ToolWithServer } from "@/types/mcp";
import { ConfigFieldTool } from "@/features/chat/components/configuration-sidebar/config-field";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

interface ToolSelectionByServerProps {
  toolsByServer: Map<string, ToolWithServer[]>;
  selectedTools: string[];
  onToolToggle: (toolName: string) => void;
}

export function ToolSelectionByServer({
  toolsByServer,
  selectedTools,
  onToolToggle,
}: ToolSelectionByServerProps) {
  const [expandedServers, setExpandedServers] = useState<Set<string>>(
    new Set(Array.from(toolsByServer.keys())),
  );

  const toggleServer = (serverName: string) => {
    const newExpanded = new Set(expandedServers);
    if (newExpanded.has(serverName)) {
      newExpanded.delete(serverName);
    } else {
      newExpanded.add(serverName);
    }
    setExpandedServers(newExpanded);
  };

  return (
    <div className="space-y-2">
      {Array.from(toolsByServer.entries()).map(([serverName, tools]) => (
        <Collapsible
          key={serverName}
          open={expandedServers.has(serverName)}
          onOpenChange={() => toggleServer(serverName)}
        >
          <CollapsibleTrigger className="bg-muted/50 hover:bg-muted flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium">
            <span>
              {serverName} ({tools.length} tools)
            </span>
            {expandedServers.has(serverName) ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-1 pl-4">
            {tools.map((tool) => (
              <ConfigFieldTool
                key={`${serverName}-${tool.name}`}
                id={tool.name}
                label={tool.name}
                description={tool.description}
                value={selectedTools.includes(tool.name)}
                setValue={(checked) => onToolToggle(tool.name)}
              />
            ))}
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
}
