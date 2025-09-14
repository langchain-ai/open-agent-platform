"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useAuthContext } from "@/providers/Auth";
import { toast } from "sonner";
import { OAPLogoBlue } from "@/components/icons/oap-logo-blue";

type ConnectServicesStepProps = {
  onSkip: () => void;
  onContinue: () => void;
  onBack: () => void;
};

export default function ConnectServicesStep({
  onSkip,
  onContinue,
  onBack,
}: ConnectServicesStepProps) {
  const [toolUrl, setToolUrl] = React.useState("");
  const [triggerUrl, setTriggerUrl] = React.useState("");
  const [openaiApiKey, setOpenaiApiKey] = useLocalStorage<string>(
    "lg:settings:openaiApiKey",
    "",
  );
  const [anthropicApiKey, setAnthropicApiKey] = useLocalStorage<string>(
    "lg:settings:anthropicApiKey",
    "",
  );
  const [googleApiKey, setGoogleApiKey] = useLocalStorage<string>(
    "lg:settings:googleApiKey",
    "",
  );
  const [isSaving, setIsSaving] = React.useState(false);
  const { session } = useAuthContext();

  const handleSaveApiKeys = async () => {
    if (!session?.accessToken || !session?.refreshToken) {
      toast.error("You must be logged in to save API keys");
      return;
    }
    setIsSaving(true);
    try {
      const apiKeys = {
        OPENAI_API_KEY: openaiApiKey,
        ANTHROPIC_API_KEY: anthropicApiKey,
        GOOGLE_API_KEY: googleApiKey,
      };
      const response = await fetch("/api/settings/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": session.accessToken,
          "x-refresh-token": session.refreshToken,
        },
        body: JSON.stringify({ apiKeys }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save API keys");
      }
      await response.json();
      toast.success("API keys saved successfully", { richColors: true });
      onContinue();
    } catch (error) {
      console.error("Error saving API keys:", error);
      let errMessage = "Failed to save API keys";
      if (
        typeof error === "object" &&
        error &&
        "message" in error &&
        (error as any).message &&
        typeof (error as any).message === "string"
      ) {
        errMessage = (error as any).message;
      }
      toast.error(errMessage, { richColors: true });
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <div className={cn("grid h-screen grid-cols-2 overflow-y-hidden")}>
      <div
        className={cn(
          "z-10",
          "flex h-full w-[50%] min-w-[776px] flex-col items-start justify-start rounded-r-[83px] bg-white p-[72px] text-black",
          "shadow-[0_675px_189px_0_rgba(138,118,158,0.00),0_432px_173px_0_rgba(138,118,158,0.01),0_243px_146px_0_rgba(138,118,158,0.05),0_108px_108px_0_rgba(138,118,158,0.09),0_27px_59px_0_rgba(138,118,158,0.10)]",
        )}
      >
        <div className={cn("shrink-0")}>
          <OAPLogoBlue width={146} height={38} />
        </div>

        <button
          type="button"
          className="mt-6 mb-6 -ml-2 flex items-center gap-2 text-lg text-[#0A5982]"
          onClick={onBack}
        >
          ← Back
        </button>

        <h1 className="mb-[12px] text-start text-[58px] leading-[120%] font-normal tracking-[-1.2px]">
          Connect your services
        </h1>
        <p className="mt-2 mb-[36px] max-w-[640px] text-[16px] leading-[20px] tracking-[-0.2px] text-[#3F3F46]">
          Add your server URLs and API keys so your agent can use tools,
          triggers, and LLMs. You only need to set this up once, and you can
          change it later in settings.
        </p>

        <div className="mt-8 flex w-full max-w-[640px] flex-col">
          <div className="mb-[24px] flex w-full flex-col gap-2 text-[#3F3F46]">
            <Label htmlFor="tool-url">Tool server URL</Label>
            <Input
              id="tool-url"
              placeholder="e.g. https://my-tools-server.com"
              className="p-[10px]"
              value={toolUrl}
              onChange={(e) => setToolUrl(e.target.value)}
            />
          </div>
          <div className="height-[64px] mb-[24px] flex w-full flex-col gap-2 text-[#3F3F46]">
            <Label htmlFor="trigger-url">Trigger server URL</Label>
            <Input
              id="trigger-url"
              placeholder="e.g. https://my-triggers-server.com"
              className="p-[10px]"
              value={triggerUrl}
              onChange={(e) => setTriggerUrl(e.target.value)}
            />
          </div>
          <div className="mb-[24px] flex w-full flex-col gap-2 text-[#3F3F46]">
            <Label htmlFor="anthropic">Anthropic API Key</Label>
            <PasswordInput
              id="anthropic"
              placeholder=""
              className="p-[10px]"
              value={anthropicApiKey}
              onChange={(e) => setAnthropicApiKey(e.target.value)}
            />
          </div>
          <div className="mb-[24px] flex w-full flex-col gap-2 text-[#3F3F46]">
            <Label htmlFor="openai">OpenAI API Key</Label>
            <PasswordInput
              id="openai"
              placeholder=""
              className="p-[10px]"
              value={openaiApiKey}
              onChange={(e) => setOpenaiApiKey(e.target.value)}
            />
          </div>
          <div className="flex w-full flex-col gap-2 text-[#3F3F46]">
            <Label htmlFor="google">Google GenAI API Key</Label>
            <PasswordInput
              id="google"
              placeholder=""
              className="p-[10px]"
              value={googleApiKey}
              onChange={(e) => setGoogleApiKey(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-auto flex w-full items-center justify-between">
          <button
            type="button"
            className="text-brand-primary flex items-center gap-2 border-b border-[var(--brand-primary)]"
            onClick={onSkip}
          >
            Skip
          </button>
          <Button
            type="button"
            className="h-[56px] rounded-full bg-[#0A5982] px-6 text-white hover:bg-[#0A5982]/90"
            onClick={handleSaveApiKeys}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Select tools"}
          </Button>
        </div>
      </div>
    </div>
  );
}
