"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/ui/combobox";
import { ResourceRenderer } from "@/components/ui/resource-renderer";
import { AuthenticateTriggerDialog } from "@/features/triggers/components/authenticate-trigger-dialog";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UseFormReturn } from "react-hook-form";
import type { AgentTriggersFormData } from "@/components/agent-creator-sheet/components/agent-triggers-form";
import type {
  GroupedTriggerRegistrationsByProvider,
  Trigger,
} from "@/types/triggers";

export function SelectedTriggersStrip({
  groupedTriggers,
  form,
}: {
  groupedTriggers?: GroupedTriggerRegistrationsByProvider;
  form: UseFormReturn<AgentTriggersFormData>;
}) {
  const ids = (form?.watch("triggerIds") || []) as string[];

  // Build map from registration id -> display label (provider/trigger + resource)
  const idToLabel: Record<string, string> = React.useMemo(() => {
    const map: Record<string, string> = {};
    if (!groupedTriggers) return map;
    for (const [, { registrations, triggers }] of Object.entries(
      groupedTriggers,
    )) {
      const triggerMap: Record<string, Trigger> = {};
      triggers.forEach((t) => (triggerMap[t.id] = t));
      for (const [templateId, regs] of Object.entries(registrations)) {
        const trig = triggerMap[templateId];
        regs.forEach((reg) => {
          // Build a concise label from resource
          let resourceLabel = "";
          const res = reg.resource as any;
          if (typeof res === "string") resourceLabel = res;
          else if (res && typeof res === "object") {
            const first = Object.values(res)[0];
            resourceLabel = String(first ?? "");
          }
          map[reg.id] =
            `${trig?.displayName ?? templateId}${resourceLabel ? `: ${resourceLabel}` : ""}`;
        });
      }
    }
    return map;
  }, [groupedTriggers]);

  // Only show selected items once registration metadata is available
  const visibleIds = React.useMemo(() => {
    if (!groupedTriggers) return [] as string[];
    return ids.filter((id) => Boolean(idToLabel[id]));
  }, [groupedTriggers, ids, idToLabel]);

  const isLoadingSelected = ids.length > 0 && !groupedTriggers;

  const remove = (id: string) => {
    const current = (form.getValues("triggerIds") || []) as string[];
    form.setValue(
      "triggerIds",
      current.filter((x) => x !== id),
      { shouldDirty: true },
    );
  };

  const containerCls =
    (visibleIds.length > 0 || isLoadingSelected)
      ? "rounded-md bg-gray-50 px-2 py-1 min-h-10 flex items-center"
      : "px-2 py-1 min-h-10 flex items-center";
  return (
    <div className={containerCls}>
      <div className="flex w-full items-center gap-1 overflow-x-auto whitespace-nowrap">
        {ids.length === 0 && (
          <span className="text-xs text-gray-500">No triggers selected</span>
        )}
        {isLoadingSelected && (
          <span className="text-xs text-gray-500">Loading selected triggers…</span>
        )}
        {visibleIds.map((id) => (
          <Badge
            key={`trig-${id}`}
            variant="outline"
            className="inline-flex cursor-pointer border-gray-300 pr-1 text-gray-700"
            onClick={() => remove(id)}
            title="Click to remove"
          >
            <span className="truncate">{idToLabel[id] ?? id}</span>
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function TriggersAddPopoverContent({
  groupedTriggers,
  form,
  reloadTriggers,
  inline = false,
}: {
  groupedTriggers?: GroupedTriggerRegistrationsByProvider;
  form: UseFormReturn<AgentTriggersFormData>;
  reloadTriggers?: () => Promise<void>;
  inline?: boolean;
}) {
  const selected = (form?.watch("triggerIds") || []) as string[];

  if (!groupedTriggers || Object.keys(groupedTriggers).length === 0) {
    return (
      <div className="w-[560px] max-w-[90vw] p-3 text-sm text-gray-500">
        No triggers available
      </div>
    );
  }

  return (
    <div className={inline ? "p-0" : "w-[560px] max-w-[90vw] p-3"}>
      <div className={inline ? "" : ""}>
        <div
          className={
            inline ? "max-h-64 overflow-auto" : "max-h-80 overflow-auto"
          }
        >
          {Object.entries(groupedTriggers).map(([provider, group]) => (
            <div
              key={provider}
              className=""
            >
              <div className="sticky top-0 z-10 bg-white/90 px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                {provider}
              </div>
              {group.triggers.map((t) => {
                const regs = group.registrations[t.id] || [];
                const selectedForTrigger = selected.filter((id) =>
                  regs.some((r) => r.id === id),
                );
                const selectedLabelsRaw = selectedForTrigger.map((id) => {
                  const reg = regs.find((r) => r.id === id);
                  const res = reg?.resource as any;
                  if (typeof res === "string") return res;
                  if (res && typeof res === "object") {
                    const first = Object.values(res)[0];
                    return String(first ?? id);
                  }
                  return id;
                });
                const selectedLabels = (() => {
                  if (selectedLabelsRaw.length === 0) return "None";
                  if (selectedLabelsRaw.length <= 2)
                    return selectedLabelsRaw.join(", ");
                  const shown = selectedLabelsRaw.slice(0, 2).join(", ");
                  return `${shown} +${selectedLabelsRaw.length - 2}`;
                })();
                const displayText = `${t.displayName} • ${selectedLabels}`;
                return (
                  <div
                    key={t.id}
                    className="px-3 py-3"
                  >
                    <div className="mb-2 flex items-center justify-between text-sm font-medium text-gray-800">
                      <span>{t.displayName}</span>
                      <AuthenticateTriggerDialog
                        trigger={t}
                        reloadTriggers={reloadTriggers}
                      />
                    </div>
                    {t.description && (
                      <div className="mb-2 text-xs text-gray-500">
                        {t.description}
                      </div>
                    )}
                    {regs.length > 0 && (
                      <Combobox
                        displayText={displayText}
                        options={regs.map((reg) => ({
                          value: reg.id,
                          label: reg.id,
                        }))}
                        selectedOptions={selected}
                        optionRenderer={(option) => {
                          const reg = regs.find((r) => r.id === option.value);
                          return (
                            <>
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selected.includes(option.value)
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              <ResourceRenderer resource={reg?.resource} />
                            </>
                          );
                        }}
                        onSelect={(val) => {
                          const cur = (form.getValues("triggerIds") ||
                            []) as string[];
                          if (cur.includes(val))
                            form.setValue(
                              "triggerIds",
                              cur.filter((x) => x !== val),
                              { shouldDirty: true },
                            );
                          else
                            form.setValue("triggerIds", [...cur, val], {
                              shouldDirty: true,
                            });
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
