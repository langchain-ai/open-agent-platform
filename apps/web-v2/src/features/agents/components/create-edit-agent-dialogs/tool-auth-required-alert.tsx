import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import _ from "lodash";
import { Copy, ExternalLink, Info } from "lucide-react";
import { toast } from "sonner";

export function ToolAuthRequiredAlert({
  authRequiredUrls,
}: {
  authRequiredUrls: { provider: string; authUrl: string }[];
}) {
  return (
    <Alert
      variant="info"
      className="my-4"
    >
      <Info className="h-4 w-4" />
      <AlertTitle>Authentication Required</AlertTitle>
      <AlertDescription>
        <p className="mb-3">
          Please authenticate with the following providers, then click "Create
          Agent" again.
        </p>
        <div className="space-y-3">
          {authRequiredUrls.map((url) => (
            <div
              key={url.provider}
              className="bg-blue-25 rounded-lg border border-blue-200 p-4 dark:border-blue-800 dark:bg-blue-950/50"
            >
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {_.startCase(url.provider)}
                </h4>
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-4 h-9 border-blue-300 px-4 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900"
                  onClick={() =>
                    window.open(url.authUrl, "_blank", "noopener,noreferrer")
                  }
                >
                  <ExternalLink className="mr-2 h-3 w-3" />
                  Authenticate
                </Button>
              </div>
              <div className="flex items-start gap-2 text-xs">
                <code className="flex-1 rounded bg-blue-100 px-2 py-1 font-mono break-all whitespace-pre-wrap text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {url.authUrl}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900"
                  onClick={() => {
                    navigator.clipboard.writeText(url.authUrl);
                    toast.success("URL copied to clipboard", {
                      richColors: true,
                    });
                  }}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
}
