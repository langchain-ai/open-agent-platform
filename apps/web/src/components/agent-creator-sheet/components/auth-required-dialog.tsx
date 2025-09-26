import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ExternalLink, Info, Zap, ArrowRight } from "lucide-react";
import { useOAuthProviders } from "@/hooks/use-oauth-providers";
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

  const shouldShowTriggers = !!props.groupedTriggers;

  return (
    <AlertDialog
      open={props.open}
      onOpenChange={props.onOpenChange}
    >
      <AlertDialogContent className="flex max-h-[90vh] max-w-7xl flex-col border border-gray-200 bg-white text-gray-900 shadow-lg">
        <AlertDialogHeader className="flex-shrink-0 pb-6">
          <AlertDialogTitle className="flex flex-row items-center text-xl font-medium text-gray-900">
            <Info className="mr-2 h-4 w-4 text-gray-700" />
            Authentication Required
          </AlertDialogTitle>
          <AlertDialogDescription className="mt-1 text-sm text-gray-500">
            Triggers connect external events to your agent. When an event occurs
            (like receiving an email), it automatically activates your agent to
            take action.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Workflow diagram */}
        <div className="flex-shrink-0 pb-4">
          <div className="flex items-center justify-center gap-6">
            <div className="rounded-lg border border-green-200 bg-green-100 px-6 py-3">
              <div className="flex items-center gap-3">
                <Zap className="h-4 w-4 text-green-700" />
                <span className="text-base font-medium text-green-700">
                  Triggers
                </span>
                <span className="inline-flex items-center rounded-full bg-green-200 px-3 py-1 text-xs font-medium text-green-800">
                  SUGGESTED
                </span>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <div className="rounded-lg bg-gray-100 px-6 py-3">
              <span className="text-base font-medium text-gray-700">
                Your Agent
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto py-6 pr-2">
          {props.authUrls.map((url, index) => (
            <div
              key={`${url.provider}-${index}`}
              className="rounded-lg border border-gray-200 bg-gray-50 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-gray-900">
                    {getProviderDisplayName(url.provider)}
                  </h4>
                  {url.tools && url.tools.length > 0 && (
                    <p className="mt-2 text-sm text-gray-600">
                      Required for: {url.tools.join(", ")}
                    </p>
                  )}
                </div>
                <Button
                  size="default"
                  variant="outline"
                  className="ml-4 flex-shrink-0 border-green-600 text-green-700 hover:border-green-700 hover:bg-green-50"
                  onClick={() =>
                    window.open(url.authUrl, "_blank", "noopener,noreferrer")
                  }
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Authenticate
                </Button>
              </div>
            </div>
          ))}
          {shouldShowTriggers && (
            <div className="relative rounded-lg bg-green-50 p-8">
              <div className="absolute top-6 left-6 flex items-center gap-1">
                <Zap className="h-3 w-3 text-black" />
                <span className="text-xs font-bold tracking-wide text-black uppercase">
                  SUGGESTED TRIGGERS
                </span>
              </div>

              <div className="absolute top-6 right-6">
                <span className="text-xs font-bold tracking-wide text-black uppercase">
                  OPTIONAL
                </span>
              </div>

              <div className="mb-4 pt-6"></div>

              <p className="mb-6 max-w-2xl text-sm text-green-800">
                You don't have to select anything — pick events that should
                invoke your agent.
              </p>

              {props.groupedTriggers &&
                Object.entries(props.groupedTriggers).map(
                  ([provider, { registrations, triggers }]) => (
                    <div
                      key={provider}
                      className="rounded-lg border border-gray-200 bg-white p-6"
                    >
                      <h4 className="mb-4 text-base font-medium text-gray-900">
                        {provider.charAt(0).toUpperCase() + provider.slice(1)}
                      </h4>

                      {triggers.map((trigger) => (
                        <div
                          key={trigger.id}
                          className="flex items-center justify-between py-3"
                        >
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {trigger.displayName}
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              No connections yet.
                            </div>
                          </div>
                          <button className="flex h-7 w-7 items-center justify-center rounded border border-green-600 text-green-600 transition-colors hover:bg-green-50">
                            <span className="text-sm font-medium">+</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  ),
                )}
            </div>
          )}
        </div>
        <AlertDialogFooter className="flex-shrink-0 justify-end gap-3 pt-6">
          <Button
            onClick={props.handleSubmit}
            className="bg-[#2F6868] px-8 text-white hover:bg-[#2F6868]/90"
          >
            Continue
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
