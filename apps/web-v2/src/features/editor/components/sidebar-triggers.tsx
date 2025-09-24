"use client";

import React from "react";
import type { GroupedTriggerRegistrationsByProvider } from "@/types/triggers";
import { UseFormReturn } from "react-hook-form";
import { AgentTriggersFormData } from "@/components/agent-creator-sheet/components/agent-triggers-form";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Check } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { ResourceRenderer } from "@/components/ui/resource-renderer";
import { prettifyText } from "@/features/agent-inbox/utils";
import { AuthenticateTriggerDialog } from "@/features/triggers/components/authenticate-trigger-dialog";

type SidebarTriggersProps = {
  groupedTriggers?: GroupedTriggerRegistrationsByProvider;
  loading?: boolean;
  showTriggersTab?: boolean;
  form?: UseFormReturn<AgentTriggersFormData>;
  hideHeader?: boolean;
  reloadTriggers?: () => Promise<void>;
  targetLabel?: string;
  note?: string;
};

export function SidebarTriggers({
  groupedTriggers,
  loading = false,
  showTriggersTab,
  form,
  hideHeader = false,
  targetLabel,
  note,
}: SidebarTriggersProps) {

  const CountText = ({ count }: { count: number }) =>
    count > 0 ? <span className="text-xs text-gray-500">{count}</span> : null;

  const [openProvider, setOpenProvider] = React.useState<string | null>(null);
  const toggle = (key: string) =>
    setOpenProvider((curr) => (curr === key ? null : key));
  const selectedIds = form?.watch("triggerIds") || [];

  const getRegistrationsFromTriggerId = (provider: string, triggerId: string) =>
    groupedTriggers?.[provider]?.registrations?.[triggerId] || [];

  const countSelectedForTrigger = (provider: string, triggerId: string) =>
    getRegistrationsFromTriggerId(provider, triggerId).filter((r) =>
      selectedIds.includes(r.id),
    ).length;

  // Helper intentionally omitted for now; provider counts computed inline

  // Early returns after hooks are initialized (satisfies rules-of-hooks)
  if (loading) {
    return (
      <div className="py-2">
        <div className="flex cursor-default items-center gap-1 px-3 py-1 text-xs font-medium uppercase text-gray-500">
          Triggers
        </div>
        <div className="py-3 text-center text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }
  if (showTriggersTab === false) {
    return (
      <div className="py-2">
        <div className="flex cursor-default items-center gap-1 px-3 py-1 text-xs font-medium uppercase text-gray-500">
          Triggers
        </div>
        <div className="py-3 text-center text-sm text-muted-foreground">Coming soon</div>
      </div>
    );
  }
  if (!groupedTriggers || Object.keys(groupedTriggers).length === 0) {
    return (
      <div className="py-2">
        <div className="flex cursor-default items-center gap-1 px-3 py-1 text-xs font-medium uppercase text-gray-500">
          Triggers
        </div>
        <div className="py-3 text-center text-xs text-muted-foreground">No triggers available</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {!hideHeader && (
        <div className="px-3 py-1.5">
          <div className="flex items-center gap-2">
            <div className="cursor-default text-xs font-medium text-gray-500 uppercase">
              Triggers
            </div>
            {targetLabel && (
              <span className="rounded-full border border-gray-300 bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700">
                {targetLabel}
              </span>
            )}
          </div>
          {note && <div className="mt-1 text-[11px] text-gray-500">{note}</div>}
        </div>
      )}
      <div className="space-y-1.5">
        {Object.entries(groupedTriggers).map(([provider, data]) => {
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
                  "text-gray-700 hover:bg-gray-100",
                )}
                onClick={() => toggle(provider)}
                aria-expanded={openProvider === provider}
              >
                <div className="flex items-center gap-2">
                  {openProvider === provider ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                  <span className="font-medium">{provider}</span>
                </div>
                {form && <CountText count={providerCount} />}
              </button>
              {openProvider === provider && (
                <div className="ml-3 space-y-0.5">
                  {triggersAll.map((t, idx) => {
                    const regs = getRegistrationsFromTriggerId(provider, t.id);
                    const hasRegs = regs.length > 0;
                    return (
                      <div key={t.id}>
                        <div className="group px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          <div className="flex items-center justify-between gap-2">
                            <div className="truncate">{prettifyText(t.id)}</div>
                            <div className="flex items-center gap-2 whitespace-nowrap">
                              {hasRegs ? (
                                form && (
                                  <CountText
                                    count={countSelectedForTrigger(
                                      provider,
                                      t.id,
                                    )}
                                  />
                                )
                              ) : (
                                <AuthenticateTriggerDialog
                                  trigger={t as any}
                                  reloadTriggers={async () => {
                                    await reloadTriggers?.();
                                  }}
                                />
                              )}
                            </div>
                          </div>
                          {t.description && (
                            <div className="mt-0.5 line-clamp-2 text-xs text-gray-500">
                              {t.description}
                            </div>
                          )}
                          {form && hasRegs ? (
                            <div className="mt-3">
                              <Combobox
                                displayText={(() => {
                                  const selected = regs.filter((r) =>
                                    selectedIds.includes(r.id),
                                  );
                                  if (selected.length === 0)
                                    return "Select registrations";
                                  if (selected.length === 1) {
                                    const resource = selected[0]
                                      .resource as any;
                                    if (typeof resource === "string")
                                      return resource;
                                    if (
                                      resource &&
                                      typeof resource === "object"
                                    )
                                      return String(Object.values(resource)[0]);
                                    return "1 selected";
                                  }
                                  return `${selected.length} selected`;
                                })()}
                                options={regs.map((r) => ({
                                  label: "",
                                  value: r.id,
                                }))}
                                selectedOptions={selectedIds}
                                onSelect={(value) => {
                                  const current =
                                    form?.getValues("triggerIds") || [];
                                  const isSelected = current.includes(value);
                                  form?.setValue(
                                    "triggerIds",
                                    isSelected
                                      ? current.filter((id) => id !== value)
                                      : [...current, value],
                                    { shouldDirty: true, shouldTouch: true },
                                  );
                                }}
                                optionRenderer={(option) => {
                                  const reg = regs.find(
                                    (r) => r.id === option.value,
                                  );
                                  const active = form
                                    ?.getValues("triggerIds")
                                    ?.includes(option.value);
                                  return (
                                    <>
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          active
                                            ? "text-[#2F6868]"
                                            : "text-transparent",
                                        )}
                                      />
                                      {reg ? (
                                        <ResourceRenderer
                                          resource={reg.resource}
                                        />
                                      ) : (
                                        <span className="text-gray-500">
                                          {option.label}
                                        </span>
                                      )}
                                    </>
                                  );
                                }}
                              />
                            </div>
                          ) : null}
                        </div>
                        {idx < triggersAll.length - 1 && (
                          <div className="mx-3 h-px bg-gray-200" />
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
    </div>
  );
}
