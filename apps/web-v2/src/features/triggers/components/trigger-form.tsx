"use client";

import type * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { generateFormFields } from "@/lib/triggers";
import { ExternalLink, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Trigger } from "@/types/triggers";
import { useAuthContext } from "@/providers/Auth";
import { useTriggers } from "@/hooks/use-triggers";
import _ from "lodash";

interface TriggerFormProps {
  trigger: Trigger;
  onCancel?: () => void;
}

export function TriggerForm({ trigger, onCancel }: TriggerFormProps) {
  const auth = useAuthContext();
  const { registerTrigger } = useTriggers();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Generate form fields from payload schema
  const payloadFields = trigger.payloadSchema
    ? generateFormFields(trigger.payloadSchema)
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

  if (isAuthenticating && authUrl) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            {onCancel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <CardTitle>{trigger.displayName}</CardTitle>
              <CardDescription>Authentication Required</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="mb-3 text-sm text-blue-800">
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
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <CardTitle>{trigger.displayName}</CardTitle>
            {trigger.description && (
              <CardDescription>{trigger.description}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {/* Payload Fields */}
          {payloadFields.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Configuration</h4>
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
      </CardContent>
    </Card>
  );
}
