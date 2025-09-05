"use client";

import React, { useState, useCallback } from "react";
import { Client } from "@langchain/langgraph-sdk";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/dialog";

interface Config {
  assistantId: string;
  deploymentUrl: string;
  langsmithToken?: string;
}

interface ConfigurationDialogProps {
  config: Config | null;
  onConfigUpdate: (newConfig: Config) => void;
  trigger?: React.ReactNode;
  required?: boolean;
}

export function ConfigurationDialog({
  config,
  onConfigUpdate,
  trigger,
  required = false,
}: ConfigurationDialogProps) {
  const [open, setOpen] = useState(required);
  const [formData, setFormData] = useState<Config>(
    config || {
      assistantId: "",
      deploymentUrl: "http://localhost:2024",
      langsmithToken: "",
    },
  );

  const [isCreatingNewAssistant, setIsCreatingNewAssistant] = useState<boolean>(false);
  const [graphId, setGraphId] = useState<string>("");
  const [newAssistantName, setNewAssistantName] = useState<string>("");

  React.useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  React.useEffect(() => {
    if (required && (!config?.deploymentUrl || !config?.assistantId)) {
      setOpen(true);
    }
  }, [required, config]);

  const handleSave = useCallback(() => {
    if (!formData.assistantId || !formData.deploymentUrl) {
      alert("Please fill in all required fields");
      return;
    }

    localStorage.setItem("deep-agent-config", JSON.stringify(formData));
    onConfigUpdate(formData);
    if (!required) setOpen(false);
  }, [formData, onConfigUpdate, required]);

  const handleCancel = useCallback(() => {
    if (required && (!config?.deploymentUrl || !config?.assistantId)) {
      return;
    }
    setFormData(
      config || { assistantId: "", deploymentUrl: "", langsmithToken: "" },
    );
    setOpen(false);
  }, [config, required]);

  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (
      !newOpen &&
      required &&
      (!config?.deploymentUrl || !config?.assistantId)
    ) {
      return;
    }
    setOpen(newOpen);
  }, [config, required]);

  const handleCreateNewAssistant = useCallback(async () => {
    const defaultHeaders = formData.langsmithToken ? {
      "X-Api-Key": formData.langsmithToken,
    } : {};
    if (!formData.deploymentUrl || !graphId || !newAssistantName) {
      alert("To create a new assistant, you need to provide a deployment URL, a graph ID and a new assistant name");
      return;
    }
    const client = new Client({
      apiUrl: formData.deploymentUrl,
      defaultHeaders
    })
    const newAssistant = await client.assistants.create({
      graphId,
      name: newAssistantName,
    });

    setFormData({
      assistantId: newAssistant.assistant_id,
      deploymentUrl: formData.deploymentUrl,
      langsmithToken: formData.langsmithToken,
    });
    setIsCreatingNewAssistant(false);
    setGraphId("");
    setNewAssistantName("");
  }, [formData.deploymentUrl, formData.langsmithToken, graphId, newAssistantName]);

  const handleCancelAssistantCreation = useCallback(() => {
    setIsCreatingNewAssistant(false);
    setGraphId("");
    setNewAssistantName("");
  }, []);

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {required ? "Setup Required" : "Configuration Settings"}
          </DialogTitle>
          <DialogDescription>
            {required
              ? "Please configure your Deep Agent connection settings to continue."
              : "Update your Deep Agent connection settings."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Deployment URL <span className="text-destructive">*</span>
            </label>
            <input
              type="url"
              value={formData.deploymentUrl}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  deploymentUrl: e.target.value,
                }))
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="https://your-deployment.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Assistant ID <span className="text-destructive">*</span>
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => setIsCreatingNewAssistant(false)}
                className={`inline-flex items-center justify-center rounded-md border px-3 py-1 text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  !isCreatingNewAssistant 
                    ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90" 
                    : "border-input bg-background hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                Use Existing Assistant
              </button>
              <button
                onClick={() => setIsCreatingNewAssistant(true)}
                className={`inline-flex items-center justify-center rounded-md border px-3 py-1 text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  isCreatingNewAssistant 
                    ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90" 
                    : "border-input bg-background hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                Create New Assistant
              </button>
            </div>
            {!isCreatingNewAssistant ? (
              <input
                type="text"
                value={formData.assistantId}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    assistantId: e.target.value,
                  }))
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter Assistant ID"
              />
            ) : (
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={graphId}
                    onChange={(e) => setGraphId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Graph ID"
                  />
                  <input
                    type="text"
                    value={newAssistantName}
                    onChange={(e) => setNewAssistantName(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="New Assistant Name"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleCreateNewAssistant}
                    className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md px-2 text-xs font-medium text-white ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                    style={{ backgroundColor: "#166534" }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#14532d"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#166534"}
                  >
                    Create Assistant
                  </button>
                  <button
                    onClick={() => handleCancelAssistantCreation}
                    className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md border border-input bg-background px-2 text-xs font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              LangSmith API Key
            </label>
            <input
              type="text"
              value={formData.langsmithToken || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  langsmithToken: e.target.value,
                }))
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Only necessary for agents deployed on LangGraph Platform"
            />
          </div>
        </div>

        <DialogFooter>
          {!required && (
            <button
              onClick={handleCancel}
              className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium text-white ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            style={{ backgroundColor: "#166534" }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#14532d"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#166534"}
          >
            {required ? "Continue" : "Save Changes"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
