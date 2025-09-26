import { useCallback } from "react";
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

  return (
    <AlertDialog
      open={props.open}
      onOpenChange={props.onOpenChange}
    >
      <AlertDialogContent className="flex max-h-[90vh] max-w-[60vw] flex-col border border-gray-200 bg-white text-gray-900 shadow-lg">
        <AlertDialogHeader className="flex-shrink-0 pb-6">
          <AlertDialogTitle className="flex flex-row items-center text-xl font-medium text-gray-900">
            <Info className="mr-2 h-4 w-4 text-gray-700" />
            {hasTriggers ? "Select Triggers" : "One thing to note"}
          </AlertDialogTitle>
          <AlertDialogDescription className="mt-1 text-sm text-gray-500">
            {hasTriggers
              ? "Triggers connect external events to your agent. When an event occurs (like receiving an email), it automatically activates your agent to take action."
              : "Your agent is ready to go! You can always add triggers later to connect external events."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Workflow diagram */}
        <div className="flex-shrink-0 pb-4">
          <div className="flex items-center justify-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help rounded-lg bg-gray-100 px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">📧</span>
                    <span className="text-sm font-medium text-gray-700">
                      Events
                    </span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="bg-gray-900 text-white"
              >
                <div className="text-xs">
                  <div className="mb-1 font-medium">Examples:</div>
                  <div>📧 Email received</div>
                  <div>📅 Calendar event</div>
                  <div>📱 Slack message</div>
                  <div>🔔 Webhook notification</div>
                </div>
              </TooltipContent>
            </Tooltip>
            <ArrowRight className="h-3 w-3 text-gray-400" />
            <div className="rounded-lg border border-green-200 bg-green-100 px-4 py-2">
              <div className="flex items-center gap-2">
                <Zap className="h-3 w-3 text-green-700" />
                <span className="text-sm font-medium text-green-700">
                  Triggers
                </span>
                <span className="inline-flex items-center rounded-full bg-green-200 px-2 py-0.5 text-xs font-medium text-green-800">
                  SUGGESTED
                </span>
              </div>
            </div>
            <ArrowRight className="h-3 w-3 text-gray-400" />
            <div className="rounded-lg bg-gray-100 px-4 py-2">
              <span className="text-sm font-medium text-gray-700">Agent</span>
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
          <div className="relative rounded-lg bg-green-50 p-8">
            {hasTriggers ? (
              <>
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

                {props.groupedTriggers && (
                  <Accordion
                    type="multiple"
                    className="w-full text-gray-900"
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
              </>
            ) : (
              <div className="py-12 text-center">
                <p className="text-2xl font-medium text-green-800">
                  Have fun building!
                </p>
              </div>
            )}
          </div>
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
