"use client";

import React, { useState } from "react";
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
      deploymentUrl: "",
      langsmithToken: "",
    },
  );

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

  const handleSave = () => {
    if (!formData.assistantId || !formData.deploymentUrl) {
      alert("Please fill in all required fields");
      return;
    }

    localStorage.setItem("deep-agent-config", JSON.stringify(formData));
    onConfigUpdate(formData);
    if (!required) setOpen(false);
  };

  const handleCancel = () => {
    if (required && (!config?.deploymentUrl || !config?.assistantId)) {
      return;
    }
    setFormData(
      config || { assistantId: "", deploymentUrl: "", langsmithToken: "" },
    );
    setOpen(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (
      !newOpen &&
      required &&
      (!config?.deploymentUrl || !config?.assistantId)
    ) {
      return;
    }
    setOpen(newOpen);
  };

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
            className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            {required ? "Continue" : "Save Changes"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
