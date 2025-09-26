import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ExternalLink, Info, Zap, ChevronDown, ChevronRight, Check } from "lucide-react";
import { useOAuthProviders } from "@/hooks/use-oauth-providers";
import { Combobox } from "@/components/ui/combobox";
import { ResourceRenderer } from "@/components/ui/resource-renderer";
import { AuthenticateTriggerDialog } from "@/features/triggers/components/authenticate-trigger-dialog";
import { useAuthContext } from "@/providers/Auth";
import { cn } from "@/lib/utils";
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

  const shouldShowTriggers = !!props.groupedTriggers;
  const [openProvider, setOpenProvider] = useState<string | null>(null);

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

  const toggleProvider = (provider: string) => {
    setOpenProvider(openProvider === provider ? null : provider);
  };

  const getRegistrationsFromTriggerId = (provider: string, triggerId: string) =>
    props.groupedTriggers?.[provider]?.registrations?.[triggerId] || [];

  const countSelectedForTrigger = (provider: string, triggerId: string) =>
    getRegistrationsFromTriggerId(provider, triggerId).filter((r) =>
      selectedRegistrations.includes(r.id),
    ).length;

  return (
    <AlertDialog
      open={props.open}
      onOpenChange={props.onOpenChange}
    >
      <AlertDialogContent className="flex max-h-[85vh] max-w-2xl flex-col border-blue-300 bg-blue-50 text-blue-600 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-400 [&>svg]:text-blue-600 dark:[&>svg]:text-blue-400">
        <AlertDialogHeader className="flex-shrink-0">
          <AlertDialogTitle className="flex flex-row items-center">
            <Info className="mr-2 h-4 w-4" />
            Authentication Required
          </AlertDialogTitle>
          <AlertDialogDescription>
            Please authenticate with the following providers, then click "Save
            Changes".
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex-1 space-y-4 overflow-y-auto pr-2">
          {props.authUrls.map((url, index) => (
            <div
              key={`${url.provider}-${index}`}
              className="bg-blue-25 rounded-lg border border-blue-200 p-4 dark:border-blue-800 dark:bg-blue-950/50"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {getProviderDisplayName(url.provider)}
                  </h4>
                  {url.tools && url.tools.length > 0 && (
                    <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                      Required for: {url.tools.join(", ")}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-4 h-9 flex-shrink-0 border-blue-300 px-4 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900"
                  onClick={() =>
                    window.open(url.authUrl, "_blank", "noopener,noreferrer")
                  }
                >
                  <ExternalLink className="mr-2 h-3 w-3" />
                  Authenticate
                </Button>
              </div>
            </div>
          ))}
          {shouldShowTriggers && (
            <div className="rounded-lg border border-blue-200 bg-white/60 p-4 text-blue-900 shadow-sm dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-100">
              <div className="mb-4 flex items-center gap-2 text-blue-800 dark:text-blue-200">
                <Zap className="h-4 w-4" />
                <p className="text-sm font-medium">
                  Configure your suggested triggers or use the dropdown to choose your own.
                  Triggers are automated events that activate your agent based on external
                  actions like emails, calendar events, or webhooks.
                </p>
              </div>
              {props.groupedTriggers && (
                <div className="space-y-2">
                  {Object.entries(props.groupedTriggers).map(([provider, data]) => {
                    const triggersAll = data.triggers || [];
                    const providerCount = triggersAll
                      .map((t) => countSelectedForTrigger(provider, t.id))
                      .reduce((a, b) => a + b, 0);

                    return (
                      <div key={provider}>
                        <button
                          type="button"
                          className={cn(
                            "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
                            "text-blue-700 hover:bg-blue-100/50 dark:text-blue-200 dark:hover:bg-blue-900/30",
                          )}
                          onClick={() => toggleProvider(provider)}
                          aria-expanded={openProvider === provider}
                        >
                          <div className="flex items-center gap-2">
                            {openProvider === provider ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                            <span className="font-medium">{getProviderDisplayName(provider)}</span>
                          </div>
                          {providerCount > 0 && (
                            <span className="text-xs text-blue-600 dark:text-blue-300">
                              {providerCount}
                            </span>
                          )}
                        </button>
                        {openProvider === provider && (
                          <div className="ml-3 space-y-1">
                            {triggersAll.map((trigger) => {
                              const registrations = getRegistrationsFromTriggerId(provider, trigger.id);
                              const hasRegistrations = registrations.length > 0;
                              const selectedCount = countSelectedForTrigger(provider, trigger.id);

                              return (
                                <div key={trigger.id} className="rounded-lg bg-blue-50/50 p-3 dark:bg-blue-950/20">
                                  <div className="flex items-center justify-between gap-2 mb-2">
                                    <div className="flex-1">
                                      <div className="font-medium text-sm text-blue-800 dark:text-blue-100">
                                        {trigger.displayName}
                                      </div>
                                      {trigger.description && (
                                        <div className="text-xs text-blue-600 mt-1 dark:text-blue-300">
                                          {trigger.description}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {selectedCount > 0 && (
                                        <span className="text-xs text-blue-600 dark:text-blue-300">
                                          {selectedCount}
                                        </span>
                                      )}
                                      {!hasRegistrations && (
                                        <AuthenticateTriggerDialog
                                          trigger={trigger}
                                          reloadTriggers={reloadTriggers}
                                        />
                                      )}
                                    </div>
                                  </div>
                                  {hasRegistrations && (
                                    <Combobox
                                      displayText={(() => {
                                        const selected = registrations.filter((r) =>
                                          selectedRegistrations.includes(r.id),
                                        );
                                        if (selected.length === 0) return "Select registrations";
                                        if (selected.length === 1) {
                                          const resource = selected[0].resource as any;
                                          if (typeof resource === "string") return resource;
                                          if (resource && typeof resource === "object") {
                                            return String(Object.values(resource)[0]);
                                          }
                                          return "1 selected";
                                        }
                                        return `${selected.length} selected`;
                                      })()}
                                      options={registrations.map((reg) => ({
                                        label: "",
                                        value: reg.id,
                                      }))}
                                      selectedOptions={selectedRegistrations}
                                      onSelect={(value) => {
                                        const current = selectedRegistrations;
                                        const isSelected = current.includes(value);
                                        const newSelection = isSelected
                                          ? current.filter((id) => id !== value)
                                          : [...current, value];
                                        handleSelectedRegistrationsChange(newSelection);
                                      }}
                                      optionRenderer={(option) => {
                                        const reg = registrations.find((r) => r.id === option.value);
                                        const isSelected = selectedRegistrations.includes(option.value);
                                        return (
                                          <>
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                isSelected
                                                  ? "text-blue-600 dark:text-blue-400"
                                                  : "text-transparent",
                                              )}
                                            />
                                            {reg ? (
                                              <ResourceRenderer resource={reg.resource} />
                                            ) : (
                                              <span className="text-gray-500">{option.label}</span>
                                            )}
                                          </>
                                        );
                                      }}
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
        <AlertDialogFooter className="flex-shrink-0">
          {!props.hideCancel && (
            <AlertDialogCancel asChild>
              <Button variant="outline">Cancel</Button>
            </AlertDialogCancel>
          )}
          <Button onClick={props.handleSubmit}>
            Continue after Authentication
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
