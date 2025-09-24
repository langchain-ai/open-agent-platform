import { BaseMessage, isBaseMessage } from "@langchain/core/messages";
import { format } from "date-fns";
import { startCase } from "lodash";
import {
  HumanInterrupt,
  HumanResponseWithEdits,
  SubmitType,
} from "@/types/inbox";
import { logger } from "./utils/logger";
import { validate } from "uuid";
import { getDeployments } from "@/lib/environment/deployments";
import { toast } from "sonner";

export function prettifyText(action: string) {
  return startCase(action.replace(/_/g, " "));
}

/**
 * Determines if a URL is a deployed (cloud) URL.
 */
export function isDeployedUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    // Simple check: Does it start with https and not contain localhost?
    return (
      parsedUrl.protocol === "https:" &&
      !parsedUrl.hostname.includes("localhost")
    );
  } catch (_) {
    // If parsing fails, assume it's not a valid deployed URL
    return false;
  }
}

export function isArrayOfMessages(
  value: Record<string, any>[],
): value is BaseMessage[] {
  if (
    value.every(isBaseMessage) ||
    (Array.isArray(value) &&
      value.every(
        (v) =>
          typeof v === "object" &&
          "id" in v &&
          "type" in v &&
          "content" in v &&
          "additional_kwargs" in v,
      ))
  ) {
    return true;
  }
  return false;
}

export function baseMessageObject(item: unknown): string {
  if (isBaseMessage(item)) {
    const contentText =
      typeof item.content === "string"
        ? item.content
        : JSON.stringify(item.content, null);
    let toolCallText = "";
    if ("tool_calls" in item) {
      toolCallText = JSON.stringify(item.tool_calls, null);
    }
    if ("type" in item) {
      return `${item.type}:${contentText ? ` ${contentText}` : ""}${toolCallText ? ` - Tool calls: ${toolCallText}` : ""}`;
    } else if ("_getType" in item) {
      return `${item._getType()}:${contentText ? ` ${contentText}` : ""}${toolCallText ? ` - Tool calls: ${toolCallText}` : ""}`;
    }
  } else if (
    typeof item === "object" &&
    item &&
    "type" in item &&
    "content" in item
  ) {
    const contentText =
      typeof item.content === "string"
        ? item.content
        : JSON.stringify(item.content, null);
    let toolCallText = "";
    if ("tool_calls" in item) {
      toolCallText = JSON.stringify(item.tool_calls, null);
    }
    return `${item.type}:${contentText ? ` ${contentText}` : ""}${toolCallText ? ` - Tool calls: ${toolCallText}` : ""}`;
  }

  if (typeof item === "object") {
    return JSON.stringify(item, null);
  } else {
    return item as string;
  }
}

export function unknownToPrettyDate(input: unknown): string | undefined {
  try {
    if (
      Object.prototype.toString.call(input) === "[object Date]" ||
      new Date(input as string)
    ) {
      return format(new Date(input as string), "MM/dd/yyyy hh:mm a");
    }
  } catch (_) {
    // failed to parse date. no-op
  }
  return undefined;
}

export function constructOpenInStudioURL(
  agentId: string,
  deploymentId: string,
  threadId?: string,
): string {
  const deployments = getDeployments();
  const smithStudioBaseUrl = "https://smith.langchain.com/studio/thread";

  const selectedDeployment = deployments.find((d) => d.id === deploymentId);
  if (!selectedDeployment) {
    toast.error("Failed to find selected deployment", { richColors: true });
    return "";
  }

  // Check if deploymentUrl exists before using it
  if (isDeployedUrl(selectedDeployment.deploymentUrl)) {
    if (selectedDeployment.id && selectedDeployment.tenantId && threadId) {
      const url = new URL(smithStudioBaseUrl);
      url.searchParams.set("organizationId", selectedDeployment.tenantId);
      url.searchParams.set("hostProjectId", selectedDeployment.id);
      url.searchParams.set("threadId", threadId);
      return url.toString();
    }
    // Invalid deployment config;
    return "";
  }

  // --- Logic for local/non-deployed URLs ---
  const smithStudioURL = new URL(smithStudioBaseUrl);

  // Make sure deploymentUrl exists before using it
  const trimmedDeploymentUrl = selectedDeployment.deploymentUrl.replace(
    /\/$/,
    "",
  );

  if (threadId) {
    smithStudioURL.searchParams.append("threadId", threadId);
  }

  smithStudioURL.searchParams.append("baseUrl", trimmedDeploymentUrl);
  // -----------------------------------------------------

  return smithStudioURL.toString();
}

export function createDefaultHumanResponse(
  interrupts: HumanInterrupt[],
  initialHumanInterruptEditValue: React.MutableRefObject<
    Record<string, string>
  >,
): {
  responses: HumanResponseWithEdits[];
  defaultSubmitType: SubmitType | undefined;
  hasAccept: boolean;
} {
  const interrupt = interrupts[0];

  const responses: HumanResponseWithEdits[] = [];
  if (interrupt.config) {
    if (interrupt.config) {
      Object.entries(interrupt.action_request.args).forEach(([k, v]) => {
        let stringValue = "";
        if (typeof v === "string") {
          stringValue = v;
        } else {
          stringValue = JSON.stringify(v, null);
        }

        if (
          !initialHumanInterruptEditValue.current ||
          !(k in initialHumanInterruptEditValue.current)
        ) {
          initialHumanInterruptEditValue.current = {
            ...initialHumanInterruptEditValue.current,
            [k]: stringValue,
          };
        } else if (
          k in initialHumanInterruptEditValue.current &&
          initialHumanInterruptEditValue.current[k] !== stringValue
        ) {
          logger.error(
            "KEY AND VALUE FOUND IN initialHumanInterruptEditValue.current THAT DOES NOT MATCH THE ACTION REQUEST",
            {
              key: k,
              value: stringValue,
              expectedValue: initialHumanInterruptEditValue.current[k],
            },
          );
        }
      });
      responses.push({
        type: "edit",
        args: interrupt.action_request,
        acceptAllowed: true,
        editsMade: false,
      });
    } else {
      responses.push({
        type: "edit",
        args: interrupt.action_request,
        acceptAllowed: false,
      });
    }
  }
  // Removed automatic response option - with simplified boolean config, only show accept/ignore

  if (interrupt.config) {
    responses.push({
      type: "ignore",
      args: null,
    });
  }

  // Set the submit type.
  // Priority: accept > response  > edit
  const acceptAllowedConfig = interrupts.find((i) => i.config);
  const ignoreAllowedConfig = interrupts.find((i) => i.config);

  const hasResponse = responses.find((r) => r.type === "response");
  const hasAccept =
    responses.find((r) => r.acceptAllowed) || acceptAllowedConfig;
  const hasEdit = responses.find((r) => r.type === "edit");

  let defaultSubmitType: SubmitType | undefined;
  if (hasAccept) {
    defaultSubmitType = "accept";
  } else if (hasResponse) {
    defaultSubmitType = "response";
  } else if (hasEdit) {
    defaultSubmitType = "edit";
  }

  if (acceptAllowedConfig && !responses.find((r) => r.type === "accept")) {
    responses.push({
      type: "accept",
      args: null,
    });
  }
  if (ignoreAllowedConfig && !responses.find((r) => r.type === "ignore")) {
    responses.push({
      type: "ignore",
      args: null,
    });
  }

  return { responses, defaultSubmitType, hasAccept: !!hasAccept };
}

export function haveArgsChanged(
  args: unknown,
  initialValues: Record<string, string>,
): boolean {
  if (typeof args !== "object" || !args) {
    return false;
  }

  const currentValues = args as Record<string, string>;

  return Object.entries(currentValues).some(([key, value]) => {
    const valueString = ["string", "number"].includes(typeof value)
      ? value.toString()
      : JSON.stringify(value, null);
    return initialValues[key] !== valueString;
  });
}

/**
 * Interface for deployment info response
 */
export interface DeploymentInfoResponse {
  flags: {
    assistants: boolean;
    crons: boolean;
    langsmith: boolean;
  };
  host: {
    kind: string;
    project_id: string | null;
    revision_id: string;
    tenant_id: string | null;
  };
}

/**
 * Fetches information about a deployment from its /info endpoint
 * @param deploymentUrl The URL of the deployment to fetch info from
 */
export async function fetchDeploymentInfo(
  deploymentUrl: string,
): Promise<DeploymentInfoResponse | null> {
  try {
    // Ensure deploymentUrl doesn't end with a slash
    const baseUrl = deploymentUrl.replace(/\/$/, "");
    const infoUrl = `${baseUrl}/info`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const response = await fetch(infoUrl, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      logger.error(`Error fetching deployment info: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    return data as DeploymentInfoResponse;
  } catch (error) {
    logger.error("Error fetching deployment info:", error);
    return null;
  }
}

export function extractProjectId(inboxId: string): string | null {
  if (!inboxId || !inboxId.includes(":")) {
    return null;
  }
  const parts = inboxId.split(":");
  if (parts.length === 2) {
    // Ensure the first part is a valid UUID
    if (validate(parts[0])) {
      return parts[0];
    }
  }
  return null;
}
