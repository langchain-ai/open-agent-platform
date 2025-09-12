"use client";

import React, { useState, useEffect } from "react";
import { useAuthContext } from "@/providers/Auth";
import {
  useTriggers,
  ListTriggerRegistrationsData,
} from "@/hooks/use-triggers";
import { Trigger } from "@/types/triggers";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/icons/google-icon";
import { SlackIcon } from "@/components/icons/slack-icon";
import { ChevronDown, ChevronRight, ExternalLink, Loader2, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateFormFields } from "@/lib/triggers";

interface CreateAgentTriggersSelectionProps {
  selectedTriggers: string[];
  onTriggersChange: (triggers: string[]) => void;
}

export function CreateAgentTriggersSelection({
  selectedTriggers,
  onTriggersChange,
}: CreateAgentTriggersSelectionProps) {
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [userTriggers, setUserTriggers] = useState<
    ListTriggerRegistrationsData[]
  >([]);
  const [loading, setLoading] = useState(true);
  const auth = useAuthContext();
  const { listTriggers, listUserTriggers } = useTriggers();

  useEffect(() => {
    if (!auth.session?.accessToken) return;

    setLoading(true);

    // Fetch available triggers
    listTriggers(auth.session.accessToken)
      .then((triggersRes) => {
        if (triggersRes) {
          setTriggers(triggersRes);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch triggers:", error);
        toast.error("Failed to load triggers");
      });

    // Fetch user's registered triggers
    listUserTriggers(auth.session.accessToken)
      .then((userTriggersRes) => {
        if (userTriggersRes) {
          setUserTriggers(userTriggersRes);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch user triggers:", error);
        toast.error("Failed to load user triggers");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [auth.session?.accessToken]);

  const handleTriggerToggle = (triggerId: string, checked: boolean) => {
    if (checked) {
      onTriggersChange([...selectedTriggers, triggerId]);
    } else {
      onTriggersChange(selectedTriggers.filter((id) => id !== triggerId));
    }
  };

  const isTriggerRegistered = (triggerId: string) => {
    return userTriggers.some((ut) => ut.template_id === triggerId);
  };

  const getTriggerRegistrations = (triggerId: string) => {
    return userTriggers.filter((ut) => ut.template_id === triggerId);
  };

  const getAccountEmail = (resource: unknown): string | null => {
    if (typeof resource === 'object' && resource !== null) {
      // Check common email field names
      const resourceObj = resource as Record<string, any>;
      return resourceObj.email || resourceObj.user_email || resourceObj.account_email || null;
    }
    return null;
  };

  // Group triggers by provider
  const groupTriggers = (triggers: Trigger[]) => {
    const groups: { [key: string]: { provider: string; icon: React.ReactNode; triggers: Trigger[]; isRegistered: boolean } } = {};
    
    triggers.forEach((trigger) => {
      const name = trigger.displayName.toLowerCase();
      
      if (name.includes('gmail') || name.includes('google')) {
        if (!groups['google']) {
          groups['google'] = {
            provider: 'Google',
            icon: <GoogleIcon size={48} />,
            triggers: [],
            isRegistered: false // Will be updated after all triggers are added
          };
        }
        groups['google'].triggers.push(trigger);
      } else if (name.includes('slack')) {
        if (!groups['slack']) {
          groups['slack'] = {
            provider: 'Slack',
            icon: <SlackIcon size={24} />,
            triggers: [],
            isRegistered: false // Will be updated after all triggers are added
          };
        }
        groups['slack'].triggers.push(trigger);
      } else {
        // Individual triggers that don't belong to a group
        groups[trigger.id] = {
          provider: trigger.displayName,
          icon: <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-gray-100">
            <span className="text-sm font-bold text-gray-600">T</span>
          </div>,
          triggers: [trigger],
          isRegistered: false // Will be updated after all triggers are added
        };
      }
    });
    
    // Update isRegistered status for each group
    Object.keys(groups).forEach(groupKey => {
      const group = groups[groupKey];
      group.isRegistered = group.triggers.some(trigger => isTriggerRegistered(trigger.id));
    });
    
    return groups;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <TriggerSelectionCardLoading key={i} />
          ))}
        </div>
      </div>
    );
  }

  const groupedTriggers = groupTriggers(triggers);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {Object.entries(groupedTriggers).map(([groupKey, group]) => (
          <TriggerGroupCard
            key={groupKey}
            group={group}
            selectedTriggers={selectedTriggers}
            onToggle={handleTriggerToggle}
            userTriggers={userTriggers}
          />
        ))}
      </div>
    </div>
  );
}

interface TriggerGroupCardProps {
  group: {
    provider: string;
    icon: React.ReactNode;
    triggers: Trigger[];
    isRegistered: boolean;
  };
  selectedTriggers: string[];
  onToggle: (triggerId: string, checked: boolean) => void;
  userTriggers: ListTriggerRegistrationsData[];
}

function TriggerGroupCard({
  group,
  selectedTriggers,
  onToggle,
  userTriggers,
}: TriggerGroupCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [authenticatingTrigger, setAuthenticatingTrigger] = useState<Trigger | null>(null);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const isGoogleGroup = group.provider === 'Google';
  const auth = useAuthContext();
  const { registerTrigger } = useTriggers();

  const isTriggerRegistered = (triggerId: string) => {
    return userTriggers.some((ut) => ut.template_id === triggerId);
  };

  const getTriggerRegistrations = (triggerId: string) => {
    return userTriggers.filter((ut) => ut.template_id === triggerId);
  };

  const getAccountEmail = (resource: unknown): string | null => {
    if (typeof resource === 'object' && resource !== null) {
      // Check common email field names
      const resourceObj = resource as Record<string, any>;
      return resourceObj.email || resourceObj.user_email || resourceObj.account_email || null;
    }
    return null;
  };

  const handleAuthenticate = async (trigger: Trigger) => {
    if (!auth.session?.accessToken) {
      toast.error("No access token found");
      return;
    }

    // Check if trigger requires form inputs
    const payloadFields = trigger.payloadSchema ? generateFormFields(trigger.payloadSchema) : [];
    
    if (payloadFields.length > 0) {
      // Show form for required fields
      setAuthenticatingTrigger(trigger);
      setShowForm(true);
      return;
    }

    // No form needed, proceed with registration
    setIsLoading(true);
    setAuthenticatingTrigger(trigger);

    try {
      const registerResponse = await registerTrigger(auth.session.accessToken, {
        id: trigger.id,
        payload: {},
        method: trigger.method,
        path: trigger.path,
      });

      if (!registerResponse) {
        toast.error("Failed to register trigger");
        return;
      }

      // Handle response based on auth requirements
      if ("auth_url" in registerResponse) {
        setAuthUrl(registerResponse.auth_url);
        setIsAuthenticating(true);
      } else {
        toast.success(`${trigger.displayName} trigger has been registered successfully.`);
        // Reset states
        setAuthenticatingTrigger(null);
        setAuthUrl(null);
        setIsAuthenticating(false);
        // Refresh the page or update state as needed
        window.location.reload();
      }
    } catch (error) {
      console.error("Error registering trigger:", error);
      toast.error(`${trigger.displayName} trigger registration failed`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authenticatingTrigger || !auth.session?.accessToken) return;

    setIsLoading(true);
    
    try {
      // Prepare payload from form data
      const payloadFields = authenticatingTrigger.payloadSchema ? generateFormFields(authenticatingTrigger.payloadSchema) : [];
      const payload: Record<string, any> = {};
      payloadFields.forEach((field) => {
        if (formData[field.name] !== undefined) {
          payload[field.name] = formData[field.name];
        }
      });

      const registerResponse = await registerTrigger(auth.session.accessToken, {
        id: authenticatingTrigger.id,
        payload: payload,
        method: authenticatingTrigger.method,
        path: authenticatingTrigger.path,
      });

      if (!registerResponse) {
        toast.error("Failed to register trigger");
        return;
      }

      console.log("Register response:", registerResponse);

      // Handle response based on auth requirements  
      if (("auth_url" in registerResponse && registerResponse.auth_url) || 
          ("authUrl" in registerResponse && registerResponse.authUrl)) {
        const authUrlValue = registerResponse.auth_url || registerResponse.authUrl;
        console.log("Auth URL found:", authUrlValue);
        setAuthUrl(authUrlValue);
        setIsAuthenticating(true);
        setShowForm(false);
      } else {
        console.log("No auth URL, registration complete");
        toast.success(`${authenticatingTrigger.displayName} trigger has been registered successfully.`);
        // Reset states
        setAuthenticatingTrigger(null);
        setAuthUrl(null);
        setIsAuthenticating(false);
        setShowForm(false);
        setFormData({});
        // Don't auto-reload, let user see the result
        // window.location.reload();
      }
    } catch (error) {
      console.error("Error registering trigger:", error);
      toast.error(`${authenticatingTrigger.displayName} trigger registration failed`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteAuthentication = async () => {
    if (!authenticatingTrigger || !auth.session?.accessToken) return;
    
    setIsLoading(true);
    try {
      // Prepare the same payload that was used in the initial registration
      const payloadFields = authenticatingTrigger.payloadSchema ? generateFormFields(authenticatingTrigger.payloadSchema) : [];
      const payload: Record<string, any> = {};
      payloadFields.forEach((field) => {
        if (formData[field.name] !== undefined) {
          payload[field.name] = formData[field.name];
        }
      });

      console.log("Completing authentication with payload:", payload);

      const registerResponse = await registerTrigger(auth.session.accessToken, {
        id: authenticatingTrigger.id,
        payload: payload,
        method: authenticatingTrigger.method,
        path: authenticatingTrigger.path,
      });

      if (registerResponse && "registered" in registerResponse && registerResponse.registered) {
        toast.success(`${authenticatingTrigger.displayName} has been authenticated successfully!`);
        setAuthenticatingTrigger(null);
        setAuthUrl(null);
        setIsAuthenticating(false);
        setFormData({});
        // Don't auto-reload, let user see the result
        // window.location.reload();
      } else {
        toast.error("Authentication not completed yet. Please try again.");
      }
    } catch (error) {
      console.error("Error completing authentication:", error);
      toast.error("Failed to complete authentication");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (name: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Show form dialog if form fields are required
  if (showForm && authenticatingTrigger) {
    const payloadFields = authenticatingTrigger.payloadSchema ? generateFormFields(authenticatingTrigger.payloadSchema) : [];
    
    return (
      <div className="rounded-lg bg-white p-6 border-2 border-gray-200">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowForm(false);
                setAuthenticatingTrigger(null);
                setFormData({});
              }}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h3 className="font-semibold text-lg">{authenticatingTrigger.displayName}</h3>
              <p className="text-sm text-gray-600">Configuration Required</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmitForm} className="space-y-4">
            {payloadFields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>
                  {field.name.charAt(0).toUpperCase() + field.name.slice(1)}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <Input
                  id={field.name}
                  type={field.type === 'number' ? 'number' : 'text'}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  required={field.required}
                  placeholder={`Enter ${field.name}`}
                />
                {field.description && (
                  <p className="text-xs text-gray-500">{field.description}</p>
                )}
              </div>
            ))}
            
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setAuthenticatingTrigger(null);
                  setFormData({});
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Register {authenticatingTrigger.displayName}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Show authentication dialog if in auth flow
  if (isAuthenticating && authUrl && authenticatingTrigger) {
    return (
      <div className="rounded-lg bg-white p-6 border-2 border-blue-200">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg">{authenticatingTrigger.displayName}</h3>
            <p className="text-sm text-gray-600">Authentication Required</p>
          </div>
          
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="mb-3 text-sm text-blue-800">
              Please click the link below to authenticate with {authenticatingTrigger.displayName}:
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
                Authenticate with {authenticatingTrigger.displayName}
              </a>
            </Button>
          </div>
          
          <div className="border-t pt-4">
            <p className="text-gray-600 mb-3 text-sm">
              After completing authentication, click the button below:
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setAuthenticatingTrigger(null);
                  setAuthUrl(null);
                  setIsAuthenticating(false);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCompleteAuthentication}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                I've completed authentication
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="rounded-lg bg-white transition-colors hover:bg-gray-50">
      {/* Main group header */}
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-gray-200 bg-white">
            {group.icon}
          </div>

          {/* Content */}
          <div className="flex-1 pt-1">
            <h3 className="font-medium text-gray-900 mb-1">{group.provider}</h3>
            <span className="text-sm text-gray-500 block">
              {isGoogleGroup ? 'Gmail email received' : 
               group.provider === 'Slack' ? 'Message posted, channel mentioned, user joined' :
               'Issue created, issue updated, issue completed, comment added'}
            </span>
            
            {/* Show registered accounts if any triggers are registered */}
            {group.isRegistered && (
              <div className="mt-2">
                {group.triggers.map((trigger) => {
                  const registrations = getTriggerRegistrations(trigger.id);
                  return registrations.map((registration) => {
                    const email = getAccountEmail(registration.resource);
                    return (
                      <div key={registration.id} className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                        <span>{email || 'Connected account'}</span>
                      </div>
                    );
                  });
                })}
              </div>
            )}
          </div>

          {/* Chevron down button */}
          {group.triggers.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="p-1"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <ChevronDown className="h-4 w-4 text-black" />
            </Button>
          )}
        </div>
      </div>

      {/* Expanded individual triggers */}
      {isExpanded && (
        <div className="border-t border-gray-100">
          {group.triggers.map((trigger) => (
            <div key={trigger.id} className="flex items-center justify-between p-4 border-b border-gray-50 last:border-b-0">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">{trigger.displayName}</h4>
                {trigger.description && (
                  <p className="text-xs text-gray-500 mt-1">{trigger.description}</p>
                )}
              </div>
              
              {/* Show authenticate button or connected accounts */}
              {!isTriggerRegistered(trigger.id) ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-sm ml-2 text-[#2F6868] border-[#2F6868] px-1"
                  onClick={() => handleAuthenticate(trigger)}
                  disabled={isLoading}
                >
                  {isLoading && authenticatingTrigger?.id === trigger.id && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                  Authenticate
                </Button>
              ) : (
                <div className="ml-2">
                  {getTriggerRegistrations(trigger.id).map((registration) => {
                    const email = getAccountEmail(registration.resource);
                    return (
                      <div key={registration.id} className="flex items-center gap-2 text-sm text-green-600">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                        <span>{email || 'Connected'}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface TriggerSelectionCardProps {
  trigger: Trigger;
  isSelected: boolean;
  isRegistered: boolean;
  onToggle: (triggerId: string, checked: boolean) => void;
}

function TriggerSelectionCard({
  trigger,
  isSelected,
  isRegistered,
  onToggle,
}: TriggerSelectionCardProps) {
  // Get the appropriate icon based on trigger name
  const getTriggerIcon = (triggerName: string) => {
    const name = triggerName.toLowerCase();
    if (name.includes("gmail") || name.includes("google")) {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white">
          <GoogleIcon size={24} />
        </div>
      );
    }
    if (name.includes("slack")) {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white">
          <SlackIcon size={24} />
        </div>
      );
    }
    // Default icon
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-gray-100">
        <span className="text-sm font-bold text-gray-600">T</span>
      </div>
    );
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50">
      <div className="flex items-center gap-4">
        {/* Icon */}
        {getTriggerIcon(trigger.displayName)}

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-gray-900">{trigger.displayName}</h3>
            <span className="text-xs text-gray-500">
              {trigger.displayName.toLowerCase().includes('created') ? 'Issue created, issue updated, issue completed, comment added' : 
               trigger.displayName.toLowerCase().includes('pull') ? 'Pull request opened, pull request merged, commit pushed, issue opened' :
               trigger.displayName.toLowerCase().includes('file') ? 'File updated, comment added, new version published' :
               trigger.displayName.toLowerCase().includes('webhook') ? 'Webhook received, scheduled event triggered, app event received' :
               trigger.displayName.toLowerCase().includes('page') ? 'Page created, page updated, comment added' :
               trigger.displayName.toLowerCase().includes('message') ? 'Message posted, channel mentioned, user joined' :
               'Issue created, issue updated, issue completed, comment added'}
            </span>
          </div>
          {trigger.description && (
            <p className="text-sm text-gray-500">
              {trigger.description}
            </p>
          )}
        </div>

        {/* Authentication Button */}
        {!isRegistered && (
          <Button
            variant="outline"
            size="sm"
            className="text-sm"
            onClick={() => {
              // TODO: Implement trigger registration
              toast.info("Trigger registration not yet implemented");
            }}
          >
            Authenticate
          </Button>
        )}

        {/* Connected accounts indicator */}
        {isRegistered && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Connected accounts</span>
            <span className="font-medium">5</span>
            <div className="flex h-6 w-10 items-center justify-center rounded-full bg-green-500">
              <div className="h-3 w-6 rounded-full bg-white"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TriggerSelectionCardLoading() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="mt-1 h-4 w-4 animate-pulse rounded bg-gray-200" />
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-48 animate-pulse rounded bg-gray-200" />
            </div>
            <div className="h-6 w-6 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
