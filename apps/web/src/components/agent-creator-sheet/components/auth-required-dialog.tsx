import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ExternalLink,
  Check,
  Zap,
  ArrowRight,
  Wrench,
  KeyRound,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Bot,
} from "lucide-react";
import { useOAuthProviders } from "@/hooks/use-oauth-providers";
import { useAuthContext } from "@/providers/Auth";
import { AuthenticateTriggerDialog } from "@/features/triggers/components/authenticate-trigger-dialog";
import type { GroupedTriggerRegistrationsByProvider } from "@/types/triggers";

export function AuthRequiredDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  handleSubmit: () => void;
  authUrls: { provider: string; authUrl: string; tools: string[] }[];
  hideCancel?: boolean;
  groupedTriggers?: GroupedTriggerRegistrationsByProvider;
  reloadTriggers?: (accessToken: string) => Promise<void>;
  selectedTriggerRegistrationIds?: string[];
  onSelectedTriggerRegistrationIdsChange?: (registrationIds: string[]) => void;
  // Optional: full list of enabled tools grouped by provider for display
  displayToolsByProvider?: { provider: string; tools: string[] }[];
}) {
  const { getProviderDisplayName } = useOAuthProviders();
  const auth = useAuthContext();
  const { onSelectedTriggerRegistrationIdsChange } = props;

  const hasTriggers = useMemo(() => {
    if (!props.groupedTriggers) return false;
    return Object.values(props.groupedTriggers).some(
      (group) => (group.triggers?.length ?? 0) > 0,
    );
  }, [props.groupedTriggers]);

  // Always show the full flow: Triggers -> Tools -> Auth
  const [currentStep, setCurrentStep] = useState(1);
  // Track which trigger rows are expanded to show registrations
  const [expandedTriggerIds, setExpandedTriggerIds] = useState<string[]>([]);

  const handleSelectedRegistrationsChange = useCallback(
    (registrationIds: string[]) => {
      onSelectedTriggerRegistrationIdsChange?.(registrationIds);
    },
    [onSelectedTriggerRegistrationIdsChange],
  );

  const selectedRegistrations = props.selectedTriggerRegistrationIds ?? [];

  const reloadTriggersNoArg = useCallback(async () => {
    if (!auth.session?.accessToken) return;
    await props.reloadTriggers?.(auth.session.accessToken);
  }, [auth.session?.accessToken, props.reloadTriggers]);

  const toolsByProvider = useMemo(() => {
    if (props.displayToolsByProvider && props.displayToolsByProvider.length) {
      return props.displayToolsByProvider;
    }
    const map = new Map<string, string[]>();
    for (const entry of props.authUrls ?? []) {
      const existing = map.get(entry.provider) ?? [];
      map.set(
        entry.provider,
        Array.from(new Set([...existing, ...entry.tools])),
      );
    }
    return Array.from(map.entries()).map(([provider, tools]) => ({
      provider,
      tools,
    }));
  }, [props.displayToolsByProvider, props.authUrls]);

  const stepInfo = useMemo(() => {
    switch (currentStep) {
      case 1:
        return {
          title: "Select Triggers",
          description:
            "Triggers connect external events to your agent. When an event occurs (like receiving an email), it automatically activates your agent to take action.",
          icon: Zap,
        };
      case 2:
        return {
          title: "Review Tools",
          description:
            "Tools let your agent take actions (send emails, read Slack, etc.). Review which tools are required before authenticating.",
          icon: Wrench,
        };
      case 3:
        return {
          title: "Authenticate Providers",
          description:
            "Authenticate with the providers required by your selected tools. You can add or change them later.",
          icon: KeyRound,
        };
      default:
        return {
          title: "Setup Agent",
          description: "Configure your agent setup",
          icon: Zap,
        };
    }
  }, [currentStep]);

  // Helpers to format registration display from resource payloads
  const formatRegistrationPrimary = useCallback((registration: any): string => {
    const res = registration?.resource as Record<string, any> | undefined;
    if (res && typeof res === "object") {
      if (res.email) return String(res.email);
      if (res.channel) return String(res.channel);
      if (res.calendar_id) return String(res.calendar_id);
      const firstKey = Object.keys(res)[0];
      if (firstKey) return String(res[firstKey]);
    }
    return registration?.template_id || registration?.id || "Registration";
  }, []);

  const formatRegistrationSecondary = useCallback((registration: any): string | undefined => {
    const res = registration?.resource as Record<string, any> | undefined;
    if (res && typeof res === "object") {
      const pairs = Object.entries(res).map(([k, v]) => `${k}: ${String(v)}`);
      if (pairs.length) return pairs.join(", ");
    }
    return undefined;
  }, []);

  // Always a three-step flow
  // Triggers -> Tools -> Auth

  const StepIndicator = () => {
    const steps = [
      { step: 1, label: "Triggers", icon: Zap },
      { step: 2, label: "Tools", icon: Wrench },
      { step: 3, label: "Auth", icon: KeyRound },
    ];

    return (
      <div className="mb-6 flex items-center justify-center">
        {steps.map(({ step, label, icon: Icon }, index) => {
          const isActive = currentStep === step;
          const isCompleted = currentStep > step;

          return (
            <div
              key={step}
              className="flex items-center"
            >
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                    isCompleted
                      ? "bg-[#2F6868] text-white"
                      : isActive
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <span
                  className={`mt-2 text-xs font-medium ${
                    isActive
                      ? "text-gray-900"
                      : isCompleted
                        ? "text-[#2F6868]"
                        : "text-gray-400"
                  }`}
                >
                  {label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`mx-3 h-px w-8 ${
                    currentStep > step ? "bg-[#2F6868]" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };
  console.log(props.groupedTriggers);
  return (
    <AlertDialog
      open={props.open}
      onOpenChange={props.onOpenChange}
    >
      <AlertDialogContent className="flex max-h-[90vh] max-w-4xl flex-col border border-gray-200 bg-white text-gray-900 shadow-xl">
        <AlertDialogHeader className="flex-shrink-0 px-6 pt-6 pb-1">
          <StepIndicator />
          <div className="text-left">
            <AlertDialogTitle className="text-lg font-medium text-gray-900">
              {stepInfo.title}
            </AlertDialogTitle>
          </div>

          {/* Flow diagram - moved to header */}
          {currentStep === 1 && (
            <div className="mt-3 mb-1">
              <div className="flex items-center justify-center gap-3">
                <div className="flex items-center gap-2 rounded-md bg-[#2F6868] px-3 py-2">
                  <Zap className="h-4 w-4 text-white" />
                  <span className="text-sm font-medium text-white">
                    Trigger
                  </span>
                </div>

                <ArrowRight className="h-4 w-4 text-gray-400" />

                <div className="flex items-center gap-2 rounded-md bg-gray-100 px-3 py-2">
                  <Bot className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Agent
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Tools diagram */}
          {currentStep === 2 && (
            <div className="mt-3 mb-1">
              <div className="flex items-center justify-center gap-3">
                <div className="flex items-center gap-2 rounded-md bg-gray-100 px-3 py-2">
                  <Bot className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Agent
                  </span>
                </div>

                <ArrowRight className="h-4 w-4 text-gray-400" />

                <div className="flex items-center gap-2 rounded-md bg-[#2F6868] px-3 py-2">
                  <Wrench className="h-4 w-4 text-white" />
                  <span className="text-sm font-medium text-white">Tool</span>
                </div>
              </div>
            </div>
          )}

          {/* Auth description */}
          {currentStep === 3 && (
            <div className="mt-3 mb-1">
              <p className="text-gray-700">
                Connect your accounts so your agent can use the tools securely.
              </p>
            </div>
          )}
        </AlertDialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Step 1: Triggers */}
          {currentStep === 1 && (
            <div className="max-w-2xl">
              <div className="mb-6">
                <p className="mb-4 text-gray-700">
                  Choose what events should automatically activate your agent.
                  For example, when you receive an email or get a calendar
                  reminder.
                </p>
              </div>

              {hasTriggers ? (
                <div className="rounded-lg border border-green-200/50 bg-green-50/50 p-5">
                  <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Suggested
                    </h3>
                  </div>

                  {props.groupedTriggers && (
                    <div className="space-y-4">
                      {Object.entries(props.groupedTriggers).map(
                        ([provider, { registrations, triggers }]) => (
                          <div key={provider}>
                            <div className="mb-3">
                              <h4 className="mb-3 text-sm font-medium text-gray-700">
                                {getProviderDisplayName(provider)}
                              </h4>
                            </div>
                            <div className="space-y-2">
                              {(Array.isArray(triggers)
                                ? (triggers as any[])
                                : (Object.values(
                                    triggers as unknown as Record<string, any>,
                                  ) as any[])
                              ).map((trigger) => (
                                  <div
                                    key={trigger.id}
                                    className="group"
                                  >
                                    <div
                                      className="-mx-3 flex cursor-pointer items-start justify-between rounded-md px-3 py-3 transition-colors hover:bg-white/60"
                                      onClick={() => {
                                        setExpandedTriggerIds((prev) =>
                                          prev.includes(trigger.id)
                                            ? prev.filter((id) => id !== trigger.id)
                                            : [...prev, trigger.id],
                                        );
                                      }}
                                    >
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-3">
                                          <div
                                            className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-all ${(() => {
                                              const regs = (registrations as Record<string, any[]>)[trigger.id] || [];
                                              const isSelected = regs.some((reg) => selectedRegistrations.includes(reg.id));
                                              return isSelected
                                                ? "border-[#2F6868] bg-[#2F6868] text-white"
                                                : "border-gray-300 hover:border-gray-400";
                                            })()}`}
                                          >
                                            {(() => {
                                              const regs = (registrations as Record<string, any[]>)[trigger.id] || [];
                                              const isSelected = regs.some((reg) => selectedRegistrations.includes(reg.id));
                                              return isSelected ? <Check className="h-3 w-3" /> : null;
                                            })()}
                                          </div>
                                          <div>
                                            <p className="text-sm leading-5 font-medium text-gray-900">
                                              {trigger.displayName || trigger.name}
                                            </p>
                                            {trigger.description && (
                                              <p className="mt-0.5 text-sm leading-5 text-gray-500">
                                                {trigger.description}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="ml-3 flex items-center">
                                        <ChevronDown className="h-4 w-4 text-gray-400" />
                                      </div>
                                    </div>

                                    {/* Registration options - only show when trigger is actually selected */}
                                    {(() => {
                                      const triggerRegistrations = (
                                        registrations as Record<string, any[]>
                                      )[trigger.id] || [];
                                      const isExpanded = expandedTriggerIds.includes(trigger.id);
                                      if (!isExpanded) return null;

                                      return (
                                        <div className="mt-3 ml-8 space-y-2">
                                          {triggerRegistrations.length > 0 ? (
                                            <div className="mb-2 flex items-center justify-between">
                                              <p className="text-xs font-medium text-gray-700">Registrations</p>
                                              <AuthenticateTriggerDialog
                                                trigger={trigger}
                                                reloadTriggers={reloadTriggersNoArg}
                                                onCancel={() => undefined}
                                              />
                                            </div>
                                          ) : (
                                            <div className="mb-2 flex items-center justify-between text-xs text-gray-600">
                                              <span>No registrations yet.</span>
                                              <AuthenticateTriggerDialog
                                                trigger={trigger}
                                                reloadTriggers={reloadTriggersNoArg}
                                                onCancel={() => undefined}
                                              />
                                            </div>
                                          )}
                                          {triggerRegistrations.map((registration) => (
                                              <div
                                                key={registration.id}
                                                className="flex items-center gap-2"
                                              >
                                                <button
                                                  className={`flex h-4 w-4 items-center justify-center rounded border transition-all ${
                                                    selectedRegistrations.includes(registration.id)
                                                      ? "border-[#2F6868] bg-[#2F6868] text-white"
                                                      : "border-gray-300 hover:border-gray-400"
                                                  }`}
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    const regId = registration.id;
                                                    const isSelected =
                                                      selectedRegistrations.includes(
                                                        regId,
                                                      );
                                                    if (isSelected) {
                                                      handleSelectedRegistrationsChange(
                                                        selectedRegistrations.filter(
                                                          (id) => id !== regId,
                                                        ),
                                                      );
                                                    } else {
                                                      handleSelectedRegistrationsChange(
                                                        [
                                                          ...selectedRegistrations,
                                                          regId,
                                                        ],
                                                      );
                                                    }
                                                  }}
                                                >
                                                  {selectedRegistrations.includes(registration.id) && (
                                                    <Check className="h-2.5 w-2.5" />
                                                  )}
                                                </button>
                                                <div>
                                              <p className="text-sm text-gray-900">
                                                    {formatRegistrationPrimary(registration)}
                                                  </p>
                                                  {formatRegistrationSecondary(registration) && (
                                                    <p className="text-xs text-gray-500">
                                                      {formatRegistrationSecondary(registration)}
                                                    </p>
                                                  )}
                                                </div>
                                              </div>
                                            ),
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
                  <Zap className="mx-auto mb-3 h-8 w-8 text-gray-400" />
                  <p className="text-gray-600">
                    No triggers are needed for this agent configuration.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Tools */}
          {currentStep === 2 && (
            <div className="max-w-2xl">
              <div className="mb-6">
                <p className="mb-4 text-gray-700">
                  Your agent can use these tools to perform actions. Think of
                  them as capabilities that let your agent interact with
                  different services.
                </p>
              </div>

              {toolsByProvider.length > 0 ? (
                <div className="rounded-lg border border-green-200/50 bg-green-50/50 p-5">
                  <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Tools your agent will use
                    </h3>
                    <span className="text-sm font-medium text-green-600">
                      Optional
                    </span>
                  </div>
                  <div className="space-y-4">
                    {toolsByProvider.map(({ provider, tools }) => (
                      <div key={provider}>
                        <div className="mb-2">
                          <h4 className="text-sm font-medium text-gray-700">
                            {getProviderDisplayName(provider)}
                          </h4>
                        </div>
                        {tools && tools.length > 0 && (
                          <div className="space-y-3">
                            {tools.map((tool) => (
                              <div
                                key={tool}
                                className="flex items-start py-2"
                              >
                                <div className="mt-2 mr-3 h-2 w-2 rounded-full bg-[#2F6868]"></div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm leading-5 font-medium text-gray-900">
                                    {tool}
                                  </p>
                                  <p className="mt-0.5 text-sm leading-5 text-gray-500">
                                    {/* Sample descriptions - in real implementation these would come from tool data */}
                                    {tool.toLowerCase().includes("send") ||
                                    tool.toLowerCase().includes("message")
                                      ? "Send messages and communicate in channels"
                                      : tool.toLowerCase().includes("read") ||
                                          tool.toLowerCase().includes("get")
                                        ? "Read and retrieve information from channels"
                                        : tool.toLowerCase().includes("create")
                                          ? "Create new content and resources"
                                          : tool
                                                .toLowerCase()
                                                .includes("search")
                                            ? "Search through messages and content"
                                            : "Interact with this service on your behalf"}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
                  <Bot className="mx-auto mb-3 h-8 w-8 text-gray-400" />
                  <p className="text-gray-600">
                    This agent doesn't need any external tools - it works with
                    conversation only.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Authentication */}
          {currentStep === 3 && (
            <div className="max-w-2xl">
              <div className="mb-6">
                <div className="rounded-r border-l-4 border-[#2F6868] bg-teal-50 p-3">
                  <p className="text-sm text-[#1F4A4A]">
                    <strong>Secure:</strong> We use OAuth - your passwords are
                    never stored or visible to us.
                  </p>
                </div>
              </div>

              {(props.authUrls ?? []).length > 0 ? (
                <div>
                  <div className="space-y-3">
                    {(props.authUrls ?? []).map((url, index) => (
                      <div
                        key={`${url.provider}-${index}`}
                        className="flex items-center justify-between py-3"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium text-gray-900">
                              {getProviderDisplayName(url.provider)}
                            </h4>
                            {url.tools && url.tools.length > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500">•</span>
                                <span className="text-xs text-gray-500">
                                  {url.tools.join(", ")}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="ml-4 bg-[#2F6868] text-white hover:bg-[#2F6868]/90"
                          onClick={() =>
                            window.open(
                              url.authUrl,
                              "_blank",
                              "noopener,noreferrer",
                            )
                          }
                        >
                          <ExternalLink className="mr-1.5 h-3 w-3" />
                          Connect
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#2F6868]">
                    <Check className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="mb-2 text-lg font-medium text-gray-900">
                    You're All Set!
                  </h4>
                  <p className="text-gray-600">
                    No authentication is needed for this agent configuration.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        <AlertDialogFooter className="flex-shrink-0 justify-between gap-3 border-t border-gray-200 px-6 pt-4 pb-6">
          <div>
            {currentStep > 1 && (
              <Button
                variant="outline"
                className="border-gray-300 hover:bg-gray-50"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                <ChevronLeft className="mr-1.5 h-4 w-4" />
                Back
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {!props.hideCancel && (
              <Button
                variant="ghost"
                className="text-gray-500 hover:text-gray-700"
                onClick={() => props.onOpenChange(false)}
              >
                Cancel
              </Button>
            )}
            <Button
              onClick={() => {
                if (currentStep === 3) {
                  props.handleSubmit();
                } else {
                  setCurrentStep(currentStep + 1);
                }
              }}
              className="bg-[#2F6868] px-6 text-white hover:bg-[#2F6868]/90"
            >
              {currentStep === 3 ? "Complete Setup" : "Continue"}
              {currentStep < 3 && <ArrowRight className="ml-1.5 h-4 w-4" />}
            </Button>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
