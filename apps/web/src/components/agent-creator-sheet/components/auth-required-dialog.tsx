import { useCallback, useEffect, useState } from "react";
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
import { ExternalLink, Info, Zap } from "lucide-react";
import { useOAuthProviders } from "@/hooks/use-oauth-providers";
import { Accordion } from "@/components/ui/accordion";
import { TriggerAccordionItem } from "@/features/triggers/components/trigger-accordion-item";
import { useAuthContext } from "@/providers/Auth";
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

  const [localSelectedRegistrations, setLocalSelectedRegistrations] = useState<
    string[]
  >(props.selectedTriggerRegistrationIds ?? []);

  useEffect(() => {
    if (props.selectedTriggerRegistrationIds) {
      setLocalSelectedRegistrations(props.selectedTriggerRegistrationIds);
    }
  }, [props.selectedTriggerRegistrationIds]);

  const shouldShowTriggers = !!props.groupedTriggers;

  const handleSelectedRegistrationsChange = useCallback(
    (registrationIds: string[]) => {
      if (props.onSelectedTriggerRegistrationIdsChange) {
        props.onSelectedTriggerRegistrationIdsChange(registrationIds);
      } else {
        setLocalSelectedRegistrations(registrationIds);
      }
    },
    [props.onSelectedTriggerRegistrationIdsChange],
  );

  const selectedRegistrations = props.onSelectedTriggerRegistrationIdsChange
    ? (props.selectedTriggerRegistrationIds ?? [])
    : localSelectedRegistrations;

  const reloadTriggers = useCallback(async () => {
    if (!auth.session?.accessToken) return;
    await props.reloadTriggers?.(auth.session.accessToken);
  }, [props.reloadTriggers]);

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
                  The following triggers have been requested for your agent.
                  Please select one for each, or add a new registration if one
                  does not yet exist.
                </p>
              </div>
              {props.groupedTriggers && (
                <Accordion
                  type="multiple"
                  className="w-full text-blue-900 dark:text-blue-100"
                >
                  {Object.entries(props.groupedTriggers).map(
                    ([provider, { registrations, triggers }]) => (
                      <TriggerAccordionItem
                        key={provider}
                        provider={provider}
                        groupedRegistrations={registrations}
                        triggers={triggers}
                        reloadTriggers={reloadTriggers}
                        selectedRegistrationIds={selectedRegistrations}
                        onSelectedRegistrationChange={
                          handleSelectedRegistrationsChange
                        }
                      />
                    ),
                  )}
                </Accordion>
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
