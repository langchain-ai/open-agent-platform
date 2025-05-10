"use client";

import { ReactNode, useEffect, useState } from "react";
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

export default function ToolsPlaygroundInterface() {
  const { tools, loading, callTool } = useMCPContext();
  const router = useRouter();

  const [selectedToolName, setSelectedToolName] = useQueryState("tool");
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

    const tool = tools.find((tool) => tool.name === selectedToolName);

    if (!tool) {
      toast.error("Tool not found", { richColors: true });
      setSelectedToolName(null);
      router.replace("/tools");
      return;
    }
    resetState();
    setSelectedTool(tool);
  }, [tools, loading, selectedToolName]);

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
    <div className="container mx-auto mb-8 h-full p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tools Playground</h1>
        <ToolListCommand
          value={selectedTool}
          setValue={(t) => {
            resetState();
            setSelectedTool(t);
            setSelectedToolName(t.name);
          }}
        />
      </div>
      <div className="border-b py-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium">
              {_.startCase(selectedTool.name)}
            </h2>
            <p className="text-sm text-gray-500">{selectedTool.description}</p>
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

      <div className="grid h-[85%] grid-cols-1 gap-4 py-6 md:grid-cols-[1fr_auto_1fr] md:gap-6">
        <div className="space-y-4">
          <h3 className="text-md font-medium">Input</h3>
          <SchemaForm
            schema={selectedTool.inputSchema}
            onChange={handleInputChange}
            values={inputValues}
          />
        </div>

        <div className="hidden border-l border-gray-200 md:block dark:border-gray-700" />

        <div className="space-y-4">
          <h3 className="text-md font-medium">Response</h3>
          <ResponseViewer
            response={response}
            isLoading={isLoading}
            errorMessage={errorMessage}
            authRequiredMessage={authRequiredMessage}
          />
        </div>
      </div>
    </div>
  );
}
