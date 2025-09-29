import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ExternalLink, Check, Zap, ArrowRight, Wrench, KeyRound, ChevronLeft, Mail, MessageSquare, Calendar, Bot, Shield, Link, Plus } from "lucide-react";
import { useOAuthProviders } from "@/hooks/use-oauth-providers";
import { Accordion } from "@/components/ui/accordion";
import { TriggerAccordionItem } from "@/features/triggers/components/trigger-accordion-item";
import { useAuthContext } from "@/providers/Auth";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
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
}) {
  const { getProviderDisplayName } = useOAuthProviders();
  const auth = useAuthContext();

  const hasTriggers =
    props.groupedTriggers && Object.keys(props.groupedTriggers).length > 0;

  const initialStep = useMemo(() => {
    if (hasTriggers) return 1;
    if (props.authUrls?.length) return 2;
    return 3;
  }, [hasTriggers, props.authUrls]);

  const [currentStep, setCurrentStep] = useState(initialStep);

  const handleSelectedRegistrationsChange = useCallback(
    (registrationIds: string[]) => {
      props.onSelectedTriggerRegistrationIdsChange?.(registrationIds);
    },
    [props.onSelectedTriggerRegistrationIdsChange],
  );

  const selectedRegistrations = props.selectedTriggerRegistrationIds ?? [];

  const reloadTriggers = useCallback(async () => {
    if (!auth.session?.accessToken) return;
    await props.reloadTriggers?.(auth.session.accessToken);
  }, [props.reloadTriggers]);

  const toolsByProvider = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const entry of props.authUrls ?? []) {
      const existing = map.get(entry.provider) ?? [];
      map.set(entry.provider, Array.from(new Set([...existing, ...entry.tools])));
    }
    return Array.from(map.entries()).map(([provider, tools]) => ({ provider, tools }));
  }, [props.authUrls]);

  const stepInfo = useMemo(() => {
    switch (currentStep) {
      case 1:
        return {
          title: "Select Triggers",
          description: "Triggers connect external events to your agent. When an event occurs (like receiving an email), it automatically activates your agent to take action.",
          icon: Zap,
        };
      case 2:
        return {
          title: "Review Tools",
          description: "Tools let your agent take actions (send emails, read Slack, etc.). Review which tools are required before authenticating.",
          icon: Wrench,
        };
      case 3:
        return {
          title: "Authenticate Providers",
          description: "Authenticate with the providers required by your selected tools. You can add or change them later.",
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

  const totalSteps = useMemo(() => {
    let steps = 0;
    if (hasTriggers) steps++;
    if (toolsByProvider.length > 0) steps++;
    if (props.authUrls?.length) steps++;
    return Math.max(1, steps);
  }, [hasTriggers, toolsByProvider.length, props.authUrls?.length]);

  const StepIndicator = () => {
    const visibleSteps = [
      { step: 1, visible: hasTriggers, label: "Triggers", icon: Zap },
      { step: 2, visible: toolsByProvider.length > 0, label: "Tools", icon: Wrench },
      { step: 3, visible: props.authUrls?.length, label: "Auth", icon: KeyRound }
    ].filter(s => s.visible);

    return (
      <div className="flex items-center justify-center mb-6">
        {visibleSteps.map(({ step, label, icon: Icon }, index) => {
          const isActive = currentStep === step;
          const isCompleted = currentStep > step;

          return (
            <div key={step} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isCompleted
                      ? "bg-[#2F6868] text-white"
                      : isActive
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <span className={`mt-2 text-xs font-medium ${
                  isActive ? "text-gray-900" : isCompleted ? "text-[#2F6868]" : "text-gray-400"
                }`}>
                  {label}
                </span>
              </div>
              {index < visibleSteps.length - 1 && (
                <div className={`w-8 h-px mx-3 ${
                  currentStep > step ? "bg-[#2F6868]" : "bg-gray-200"
                }`} />
              )}
            </div>
          );
        })}
      </div>
    );
  };


  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogContent className="flex max-h-[90vh] max-w-4xl flex-col border border-gray-200 bg-white text-gray-900 shadow-xl">
        <AlertDialogHeader className="flex-shrink-0 pb-1 pt-6 px-6">
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
                <div className="flex items-center gap-2 px-3 py-2 bg-[#2F6868] rounded-md">
                  <Zap className="h-4 w-4 text-white" />
                  <span className="text-sm font-medium text-white">Trigger</span>
                </div>

                <ArrowRight className="h-4 w-4 text-gray-400" />

                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-md">
                  <Bot className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Agent</span>
                </div>
              </div>
            </div>
          )}

          {/* Tools diagram */}
          {currentStep === 2 && (
            <div className="mt-3 mb-1">
              <div className="flex items-center justify-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-md">
                  <Bot className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Agent</span>
                </div>

                <ArrowRight className="h-4 w-4 text-gray-400" />

                <div className="flex items-center gap-2 px-3 py-2 bg-[#2F6868] rounded-md">
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
                <p className="text-gray-700 mb-4">
                  Choose what events should automatically activate your agent. For example, when you receive an email or get a calendar reminder.
                </p>
              </div>

              {hasTriggers ? (
                <div className="bg-green-50/50 border border-green-200/50 rounded-lg p-5">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-semibold text-gray-900">Suggested</h3>
                  </div>

                  {props.groupedTriggers && (
                    <div className="space-y-4">
                      {Object.entries(props.groupedTriggers)
                        .filter(([provider]) => provider.toLowerCase() === 'slack')
                        .map(([provider, { registrations, triggers }]) => (
                          <div key={provider}>
                            <div className="mb-3">
                              <h4 className="text-sm font-medium text-gray-700 mb-3">{getProviderDisplayName(provider)}</h4>
                            </div>
                            <div className="space-y-2">
                              {Object.entries(triggers).map(([triggerId, trigger]) => (
                              <div key={triggerId} className="group">
                                <div className="flex items-start justify-between py-3 hover:bg-white/60 rounded-md px-3 -mx-3 transition-colors cursor-pointer"
                                     onClick={() => {
                                       // Find all registrations for this trigger
                                       const triggerRegistrations = Object.values(registrations).flat().filter(reg => reg.triggerId === triggerId);

                                       if (triggerRegistrations.length > 0) {
                                         // Check if any registration for this trigger is already selected
                                         const isSelected = triggerRegistrations.some(reg => selectedRegistrations.includes(reg.id));

                                         if (!isSelected) {
                                           // Select the first available registration to show the options
                                           const newSelection = [...selectedRegistrations, triggerRegistrations[0]?.id || `${triggerId}-reg1`];
                                           handleSelectedRegistrationsChange(newSelection);
                                         } else {
                                           // Remove all registrations for this trigger
                                           const registrationIds = triggerRegistrations.map(reg => reg.id);
                                           const newSelection = selectedRegistrations.filter(id => !registrationIds.includes(id));
                                           handleSelectedRegistrationsChange(newSelection);
                                         }
                                       }
                                     }}>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                        (() => {
                                          const triggerRegistrations = Object.values(registrations).flat().filter(reg => reg.triggerId === triggerId);
                                          const isSelected = triggerRegistrations.some(reg => selectedRegistrations.includes(reg.id));
                                          return isSelected
                                            ? 'bg-[#2F6868] border-[#2F6868] text-white'
                                            : 'border-gray-300 hover:border-gray-400';
                                        })()
                                      }`}>
                                        {(() => {
                                          const triggerRegistrations = Object.values(registrations).flat().filter(reg => reg.triggerId === triggerId);
                                          const isSelected = triggerRegistrations.some(reg => selectedRegistrations.includes(reg.id));
                                          return isSelected ? <Check className="w-3 h-3" /> : null;
                                        })()}
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-900 leading-5">{trigger.name}</p>
                                        {trigger.description && (
                                          <p className="text-sm text-gray-500 mt-0.5 leading-5">{trigger.description}</p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Registration options - only show when trigger is actually selected */}
                                {(() => {
                                  const triggerRegistrations = Object.values(registrations).flat().filter(reg => reg.triggerId === triggerId);
                                  const hasSelectedRegistration = triggerRegistrations.some(reg => selectedRegistrations.includes(reg.id));

                                  // Only show if user has actually selected something for this trigger
                                  if (!hasSelectedRegistration) return null;

                                  // For demo purposes, let's add sample registrations if none exist
                                  let sampleRegistrations = triggerRegistrations;
                                  if (sampleRegistrations.length === 0) {
                                    sampleRegistrations = [
                                      {
                                        id: `${triggerId}-reg1`,
                                        triggerId: triggerId,
                                        name: '#general channel',
                                        description: 'Messages posted to the general channel'
                                      },
                                      {
                                        id: `${triggerId}-reg2`,
                                        triggerId: triggerId,
                                        name: '#engineering channel',
                                        description: 'Messages posted to the engineering channel'
                                      }
                                    ];
                                  }

                                  return (
                                      <div className="mt-3 ml-8 space-y-2">
                                        <p className="text-xs text-gray-600 mb-2">Choose specific locations:</p>
                                        {sampleRegistrations.map((registration, index) => (
                                          <div key={registration.id || `sample-${index}`} className="flex items-center gap-2">
                                            <button
                                              className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                                selectedRegistrations.includes(registration.id || `sample-${index}`)
                                                  ? 'bg-[#2F6868] border-[#2F6868] text-white'
                                                  : 'border-gray-300 hover:border-gray-400'
                                              }`}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const regId = registration.id || `sample-${index}`;
                                                const isSelected = selectedRegistrations.includes(regId);
                                                if (isSelected) {
                                                  handleSelectedRegistrationsChange(selectedRegistrations.filter(id => id !== regId));
                                                } else {
                                                  handleSelectedRegistrationsChange([...selectedRegistrations, regId]);
                                                }
                                              }}
                                            >
                                              {selectedRegistrations.includes(registration.id || `sample-${index}`) &&
                                                <Check className="w-2.5 h-2.5" />
                                              }
                                            </button>
                                            <div>
                                              <p className="text-sm text-gray-900">{registration.name}</p>
                                              {registration.description && (
                                                <p className="text-xs text-gray-500">{registration.description}</p>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    );
                                  return null;
                                })()}
                              </div>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <Zap className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No event triggers are available for this agent configuration.</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Tools */}
          {currentStep === 2 && (
            <div className="max-w-2xl">
              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  Your agent can use these tools to perform actions. Think of them as capabilities that let your agent interact with different services.
                </p>
              </div>

              {toolsByProvider.length > 0 ? (
                <div className="bg-green-50/50 border border-green-200/50 rounded-lg p-5">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-semibold text-gray-900">Tools your agent will use</h3>
                    <span className="text-sm text-green-600 font-medium">Optional</span>
                  </div>
                  <div className="space-y-4">
                    {toolsByProvider.map(({ provider, tools }) => (
                      <div key={provider}>
                        <div className="mb-2">
                          <h4 className="text-sm font-medium text-gray-700">{getProviderDisplayName(provider)}</h4>
                        </div>
                        {tools && tools.length > 0 && (
                          <div className="space-y-3">
                            {tools.map(tool => (
                              <div key={tool} className="flex items-start py-2">
                                <div className="w-2 h-2 bg-[#2F6868] rounded-full mr-3 mt-2"></div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 leading-5">{tool}</p>
                                  <p className="text-sm text-gray-500 mt-0.5 leading-5">
                                    {/* Sample descriptions - in real implementation these would come from tool data */}
                                    {tool.toLowerCase().includes('send') || tool.toLowerCase().includes('message') ?
                                      'Send messages and communicate in channels' :
                                    tool.toLowerCase().includes('read') || tool.toLowerCase().includes('get') ?
                                      'Read and retrieve information from channels' :
                                    tool.toLowerCase().includes('create') ?
                                      'Create new content and resources' :
                                    tool.toLowerCase().includes('search') ?
                                      'Search through messages and content' :
                                      'Interact with this service on your behalf'
                                    }
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
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <Bot className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">This agent doesn't need any external tools - it works with conversation only.</p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Authentication */}
          {currentStep === 3 && (
            <div className="max-w-2xl">
              <div className="mb-6">
                <div className="bg-teal-50 border-l-4 border-[#2F6868] p-3 rounded-r">
                  <p className="text-sm text-[#1F4A4A]">
                    <strong>Secure:</strong> We use OAuth - your passwords are never stored or visible to us.
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
                                  {url.tools.join(', ')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="ml-4 bg-[#2F6868] hover:bg-[#2F6868]/90 text-white"
                          onClick={() => window.open(url.authUrl, "_blank", "noopener,noreferrer")}
                        >
                          <ExternalLink className="mr-1.5 h-3 w-3" />
                          Connect
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
                  <div className="w-12 h-12 bg-[#2F6868] rounded-full flex items-center justify-center mx-auto mb-3">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">You're All Set!</h4>
                  <p className="text-gray-600">No authentication is needed for this agent configuration.</p>
                </div>
              )}
            </div>
          )}
        </div>
        <AlertDialogFooter className="flex-shrink-0 justify-between gap-3 pt-4 px-6 pb-6 border-t border-gray-200">
          <div>
            {currentStep > 1 && (
              <Button
                variant="outline"
                className="border-gray-300 hover:bg-gray-50"
                onClick={() => {
                  if (currentStep === 3 && toolsByProvider.length === 0) {
                    setCurrentStep(hasTriggers ? 1 : 2);
                  } else if (currentStep === 2 && !hasTriggers) {
                    setCurrentStep(3);
                  } else {
                    setCurrentStep(currentStep - 1);
                  }
                }}
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
                const isLastStep =
                  (currentStep === 1 && !toolsByProvider.length && !props.authUrls?.length) ||
                  (currentStep === 2 && !props.authUrls?.length) ||
                  currentStep === 3;

                if (isLastStep) {
                  props.handleSubmit();
                } else {
                  const nextStep =
                    currentStep === 1 && toolsByProvider.length > 0 ? 2 :
                    currentStep === 1 && props.authUrls?.length ? 3 :
                    currentStep === 2 && props.authUrls?.length ? 3 :
                    currentStep + 1;
                  setCurrentStep(nextStep);
                }
              }}
              className="bg-[#2F6868] hover:bg-[#2F6868]/90 text-white px-6"
            >
              {(() => {
                const isLastStep =
                  (currentStep === 1 && !toolsByProvider.length && !props.authUrls?.length) ||
                  (currentStep === 2 && !props.authUrls?.length) ||
                  currentStep === 3;

                return isLastStep ? "Complete Setup" : "Continue";
              })()}
              {currentStep < 3 && <ArrowRight className="ml-1.5 h-4 w-4" />}
            </Button>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
