"use client";

import type * as React from "react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { generateFormFields } from "@/lib/triggers";
import {
  Bot,
  ChevronRight,
  ExternalLink,
  Loader2,
  MousePointerClick,
  Plus,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Trigger } from "@/types/triggers";
import { useAuthContext } from "@/providers/Auth";
import { useTriggers } from "@/hooks/use-triggers";
import _ from "lodash";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { prettifyText } from "@/features/agent-inbox/utils";

export function AuthenticateTriggerDialog(props: {
  trigger: Trigger;
  onCancel?: () => void;
  reloadTriggers?: () => Promise<void>;
}) {
  const { trigger, onCancel, reloadTriggers } = props;
  const auth = useAuthContext();
  const { registerTrigger } = useTriggers();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [open, setOpen] = useState(false);

  // Generate form fields from payload schema
  const payloadFields = trigger.payloadSchema
    ? generateFormFields(trigger.payloadSchema, trigger.requireDisplayName)
    : [];

  const handleInputChange = (name: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.session?.accessToken) {
      toast.error("No access token found", {
        richColors: true,
      });
      return;
    }
    setIsLoading(true);

    try {
      const payload: Record<string, any> = {};
      payloadFields.forEach((field) => {
        if (formData[field.name] !== undefined) {
          payload[field.name] = formData[field.name];
        }
      });

      const registerResponse = await registerTrigger(auth.session.accessToken, {
        id: trigger.id,
        payload: payload,
        method: trigger.method,
        path: trigger.path,
      });

      if (!registerResponse) {
        toast.error("Failed to register trigger", {
          richColors: true,
        });
        return;
      }

      // Handle response based on auth requirements
      if ("auth_url" in registerResponse) {
        setAuthUrl(registerResponse.auth_url);
        setIsAuthenticating(true);
      } else {
        toast.success(
          `${trigger.displayName} trigger has been registered successfully.`,
          {
            richColors: true,
          },
        );
        // Reset form and go back
        setFormData({});
        onCancel?.();
        // Close the dialog after successful registration
        setOpen(false);
      }
    } catch (error) {
      console.error("[v0] Error registering trigger:", error);
      toast.error(`${trigger.displayName} trigger registration failed`, {
        description:
          error instanceof Error ? error.message : "Failed to register trigger",
        richColors: true,
      });
    } finally {
      setIsLoading(false);
      reloadTriggers?.();
    }
  };

  const renderFormField = (field: {
    name: string;
    type: string;
    required?: boolean;
    description?: string;
  }) => {
    const value = formData[field.name] || "";

    switch (field.type) {
      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              checked={value}
              onCheckedChange={(checked) =>
                handleInputChange(field.name, checked)
              }
            />
            <Label
              htmlFor={field.name}
              className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {_.startCase(field.name)}
              {field.required && (
                <span className="text-destructive ml-1">*</span>
              )}
            </Label>
          </div>
        );
      case "number":
      case "integer":
        return (
          <div className="space-y-2">
            <Label htmlFor={field.name}>
              {_.startCase(field.name)}
              {field.required && (
                <span className="text-destructive ml-1">*</span>
              )}
            </Label>
            <Input
              id={field.name}
              type="number"
              value={value}
              onChange={(e) =>
                handleInputChange(field.name, e.target.valueAsNumber || "")
              }
              required={field.required}
            />
            {field.description && (
              <p className="text-muted-foreground text-sm">
                {field.description}
              </p>
            )}
          </div>
        );
      case "string":
      default:
        if (
          (field.description &&
            field.description.toLowerCase().includes("long")) ||
          field.name.toLowerCase().includes("description") ||
          field.name.toLowerCase().includes("message")
        ) {
          return (
            <div className="space-y-2">
              <Label htmlFor={field.name}>
                {_.startCase(field.name)}
                {field.required && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </Label>
              <Textarea
                id={field.name}
                value={value}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
                required={field.required}
                rows={3}
              />
              {field.description && (
                <p className="text-muted-foreground text-sm">
                  {field.description}
                </p>
              )}
            </div>
          );
        }

        return (
          <div className="space-y-2">
            <Label htmlFor={field.name}>
              {_.startCase(field.name)}
              {field.required && (
                <span className="text-destructive ml-1">*</span>
              )}
            </Label>
            <Input
              id={field.name}
              type="text"
              value={value}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              required={field.required}
            />
            {field.description && (
              <p className="text-muted-foreground text-sm">
                {field.description}
              </p>
            )}
          </div>
        );
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <button
          onClick={() => setOpen(true)}
          className="cursor-pointer rounded border border-green-700 p-1 text-green-800 transition-colors ease-in-out hover:border-green-800 hover:bg-green-50 hover:text-green-900"
        >
          <Plus className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="p-6 sm:max-w-[720px] md:max-w-[840px]">
        <DialogHeader className="flex items-center justify-center">
          <DialogTitle>Connect '{trigger.displayName}'</DialogTitle>
          <DialogDescription>
            Sign in with {prettifyText(trigger.provider)} to continue.
          </DialogDescription>
        </DialogHeader>
        {/* Workflow explainer */}
        <div className="bg-muted/30 mb-4 rounded-lg border p-4">
          <p className="text-muted-foreground mb-3 text-sm">
            A trigger connects an external event to an agent action.
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center gap-2">
              <div className="bg-muted text-muted-foreground flex h-8 w-8 items-center justify-center rounded-full">
                <MousePointerClick className="h-4 w-4" />
              </div>
              <span className="text-sm">Event</span>
            </div>
            <ChevronRight className="text-muted-foreground h-4 w-4" />
            <div className="flex items-center gap-2">
              <div className="bg-muted text-muted-foreground flex h-8 w-8 items-center justify-center rounded-full">
                <Zap className="h-4 w-4" />
              </div>
              <span className="text-sm">Trigger</span>
            </div>
            <ChevronRight className="text-muted-foreground h-4 w-4" />
            <div className="flex items-center gap-2">
              <div className="bg-muted text-muted-foreground flex h-8 w-8 items-center justify-center rounded-full">
                <Bot className="h-4 w-4" />
              </div>
              <span className="text-sm">Agent</span>
            </div>
          </div>
        </div>
        {isAuthenticating && authUrl ? (
          <div>
            <div className="bg-muted/30 rounded-lg border p-4">
              <p className="mb-3 text-sm">
                Please click the link below to authenticate with{" "}
                {trigger.displayName}:
              </p>
              <Button
                asChild
                variant="outline"
                className="w-full bg-transparent"
              >
                <a
                  href={authUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Authenticate with {trigger.displayName}
                </a>
              </Button>
            </div>
            <div className="border-t pt-4">
              <p className="text-muted-foreground mb-3 text-sm">
                After completing authentication, click the button below:
              </p>
              <Button
                onClick={handleSubmit}
                className="w-full"
              >
                I've completed authentication
              </Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-4 space-y-4"
          >
            {/* Payload Fields */}
            {payloadFields.length > 0 && (
              <div className="mb-6 space-y-4">
                {payloadFields.map((field) => (
                  <div key={field.name}>{renderFormField(field)}</div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="flex-1 bg-transparent"
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Register {trigger.displayName}
              </Button>
            </div>
          </form>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button
              className="w-full border-green-700 text-green-800 hover:border-green-800 hover:bg-green-50/90 hover:text-green-900"
              variant="outline"
            >
              Cancel
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
