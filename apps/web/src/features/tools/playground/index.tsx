"use client";

import { ReactNode, useEffect, useState } from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { SchemaForm } from "./components/schema-form";
import { ResponseViewer } from "./components/response-viewer";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CirclePlay, Loader2 } from "lucide-react";
import { useMCPContext } from "@/providers/MCP";
import { Tool } from "@/types/tool";
import { ToolListCommand } from "../components/tool-list-command";
import _ from "lodash";
import { useQueryState } from "nuqs";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ToolsPlaygroundInterface() {
  const { tools, toolsByServer, servers, loading, callTool } = useMCPContext();
  const router = useRouter();

  const [selectedToolName, setSelectedToolName] = useQueryState("tool");
  const [selectedServerName, setSelectedServerName] = useQueryState("server");
  const [selectedTool, setSelectedTool] = useState<Tool>();
  const [inputValues, setInputValues] = useState({});
  const [response, setResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [authRequiredMessage, setAuthRequiredMessage] =
    useState<ReactNode>(null);

  const resetState = () => {
    setInputValues({});
    setResponse(null);
    setErrorMessage("");
    setIsLoading(false);
  };

  useEffect(() => {
    if (loading || selectedTool || !tools.length) return;

    if (!selectedToolName) {
      router.replace("/tools");
      return;
    }

    // Find tool across all servers
    let foundTool = null;
    let foundServer = null;

    for (const [serverName, serverTools] of toolsByServer.entries()) {
      const tool = serverTools.find((t) => t.name === selectedToolName);
      if (tool) {
        foundTool = tool;
        foundServer = serverName;
        break;
      }
    }

    if (!foundTool) {
      toast.error("Tool not found", { richColors: true });
      setSelectedToolName(null);
      router.replace("/tools");
      return;
    }

    resetState();
    setSelectedTool(foundTool);
    if (foundServer && foundServer !== selectedServerName) {
      setSelectedServerName(foundServer);
    }
  }, [tools, toolsByServer, loading, selectedToolName, selectedServerName]);

  const handleInputChange = (newValues: any) => {
    setInputValues(newValues);
  };

  const handleSubmit = async () => {
    if (!selectedTool) return;
    setIsLoading(true);
    setResponse(null);
    setErrorMessage("");
    setAuthRequiredMessage(null);

    try {
      const toolRes = await callTool({
        name: selectedTool.name,
        args: inputValues,
      });
      setResponse(toolRes);
      setInputValues({});
    } catch (e: any) {
      if (!("code" in e) || !("data" in e)) {
        console.error("Error calling tool", e);
        setErrorMessage(e.message);
        toast.error("Tool call failed. Please try again.", {
          richColors: true,
        });
        return;
      }

      if (e.code === -32003 && e.data) {
        setAuthRequiredMessage(
          <div className="flex flex-col items-center justify-center rounded-md border border-blue-200 bg-blue-50 p-6 text-blue-700">
            <AlertTriangle className="mb-3 h-8 w-8 text-blue-500" />
            <p className="mb-1 text-center text-lg font-semibold">
              {e.data?.message?.text}
            </p>
            <p className="mb-2 text-center">
              After authenticating, please run the tool again.
            </p>
            <a
              href={e.data?.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm break-all underline underline-offset-2"
            >
              {e.data?.url}
            </a>
          </div>,
        );
      }
    }

    setIsLoading(false);
  };

  if (!selectedTool) {
    return <div>Loading tools...</div>;
  }

  return (
    <div className="flex h-full w-full flex-col p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tools Playground</h1>
        <div className="flex items-center gap-4">
          <Select
            value={selectedServerName || "all"}
            onValueChange={(value) => {
              setSelectedServerName(value === "all" ? null : value);
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select server" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All servers</SelectItem>
              {Object.keys(servers).map((serverName) => (
                <SelectItem
                  key={serverName}
                  value={serverName}
                >
                  {serverName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ToolListCommand
            value={selectedTool}
            setValue={(t) => {
              resetState();
              setSelectedTool(t);
              setSelectedToolName(t.name);
              // Update server selection if tool is from different server
              if ("serverName" in t) {
                setSelectedServerName(t.serverName);
              }
            }}
          />
        </div>
      </div>
      <div className="border-b py-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-medium">
              {_.startCase(selectedTool.name)}
            </h2>
            <p className="text-sm whitespace-pre-line text-gray-500">
              {selectedTool.description}
            </p>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <CirclePlay className="size-4" />
                <p>Run Tool</p>
              </>
            )}
          </Button>
        </div>
      </div>

      <ResizablePanelGroup
        direction="horizontal"
        className="flex-grow border-0"
      >
        <ResizablePanel defaultSize={50}>
          <div className="flex h-full items-start p-6">
            <div className="w-full space-y-4">
              <h3 className="text-md font-medium">Input</h3>
              <SchemaForm
                schema={selectedTool.inputSchema}
                onChange={handleInputChange}
                values={inputValues}
              />
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50}>
          <div className="flex h-full items-start p-6">
            <div className="w-full space-y-4">
              <h3 className="text-md font-medium">Response</h3>
              <ResponseViewer
                response={response}
                isLoading={isLoading}
                errorMessage={errorMessage}
                authRequiredMessage={authRequiredMessage}
              />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
