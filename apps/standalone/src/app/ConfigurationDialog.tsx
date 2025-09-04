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
} from "./components/ui/dialog";

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
            <label className="text-foreground text-sm font-medium">
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
              className="border-input bg-background text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="https://your-deployment.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-foreground text-sm font-medium">
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
              className="border-input bg-background text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Enter Assistant ID"
            />
          </div>

          <div className="space-y-2">
            <label className="text-foreground text-sm font-medium">
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
              className="border-input bg-background text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Only necessary for agents deployed on LangGraph Platform"
            />
          </div>
        </div>

        <DialogFooter>
          {!required && (
            <button
              onClick={handleCancel}
              className="ring-offset-background focus-visible:ring-ring border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-10 items-center justify-center rounded-md border px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            className="ring-offset-background focus-visible:ring-ring bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
          >
            {required ? "Continue" : "Save Changes"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}