import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { prettifyText } from "@/features/agent-inbox/utils";
import { ListTriggerRegistrationsData, Trigger } from "@/types/triggers";
import { AuthenticateTriggerDialog } from "./authenticate-trigger-dialog";
import { UseFormReturn } from "react-hook-form";
import { AgentTriggersFormData } from "@/components/agent-creator-sheet/components/agent-triggers-form";
import { Combobox } from "@/components/ui/combobox";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { ResourceRenderer } from "@/components/ui/resource-renderer";
import { RegistrationsHoverCard } from "./registrations-hover-card";

const getRegistrationText = (
  registration: ListTriggerRegistrationsData,
): string => {
  const resource = registration.resource;
  if (typeof resource === "string") return resource;
  if (typeof resource === "object" && resource !== null)
    return Object.values(resource)[0];
  return "";
};

export function TriggerAccordionItem(props: {
  provider: string;
  groupedRegistrations: {
    [templateId: string]: ListTriggerRegistrationsData[];
  };
  triggers: Trigger[];
  form?: UseFormReturn<AgentTriggersFormData>;
  reloadTriggers?: () => Promise<void>;
}) {
  const getAllTriggerNamesUnique = () => {
    const names = new Set<string>();
    Object.values(props.triggers).forEach((trigger) => {
      names.add(trigger.id);
    });
    return Array.from(names);
  };
  const allTriggerNames = getAllTriggerNamesUnique();

  const getRegistrationsFromTriggerId = (triggerId: string) => {
    if (!(triggerId in props.groupedRegistrations)) {
      return [];
    }

    return props.groupedRegistrations[triggerId];
  };

  const selectedTriggerIds = props.form ? props.form.watch("triggerIds") : [];

  const EnabledTriggersCountBadge = ({ count }: { count: number }) => (
    <div className="flex size-5 items-center justify-center rounded-full border-[0.5px] border-blue-500 bg-blue-50/50 text-xs font-light text-blue-700">
      {count}
    </div>
  );

  const numSelectedRegistrationsForTrigger = (triggerId: string): number => {
    const registrations = getRegistrationsFromTriggerId(triggerId);
    return registrations.filter((registration) =>
      selectedTriggerIds.includes(registration.id),
    ).length;
  };

  return (
    <AccordionItem
      value={props.provider}
      className="border-muted"
    >
      <AccordionTrigger className="hover:bg-muted rounded px-4 hover:cursor-pointer">
        <span className="flex flex-col items-start justify-start gap-2">
          <span className="flex flex-row items-center justify-start gap-2">
            <p className="text-sm font-semibold">{props.provider}</p>{" "}
            {props.form && (
              <EnabledTriggersCountBadge
                count={props.triggers
                  .map((trigger) =>
                    numSelectedRegistrationsForTrigger(trigger.id),
                  )
                  .reduce((a, b) => a + b)}
              />
            )}
          </span>
          <p className="text-muted-foreground text-sm font-normal">
            {allTriggerNames.map((name) => prettifyText(name)).join(", ")}
          </p>
        </span>
      </AccordionTrigger>
      <AccordionContent className="flex flex-col gap-0 pl-8 text-balance">
        {props.triggers.map((trigger, index, arr) => (
          <span
            className="flex flex-col"
            key={trigger.id}
          >
            <div className="flex items-center justify-between py-4">
              <div className="flex flex-col items-start gap-2">
                <div className="flex items-center gap-2">
                  {prettifyText(trigger.id)}
                  {props.form && (
                    <EnabledTriggersCountBadge
                      count={numSelectedRegistrationsForTrigger(trigger.id)}
                    />
                  )}
                </div>
                <p className="text-sm font-medium"></p>
                <p className="text-muted-foreground text-sm font-normal">
                  {trigger.description}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {props.form &&
                getRegistrationsFromTriggerId(trigger.id)?.length ? (
                  <Combobox
                    displayText={(() => {
                      const selectedIds =
                        props.form?.getValues("triggerIds") || [];
                      const registrations = getRegistrationsFromTriggerId(
                        trigger.id,
                      );
                      const selectedRegistrations =
                        registrations?.filter((r) =>
                          selectedIds.includes(r.id),
                        ) || [];

                      if (selectedRegistrations.length === 0) {
                        return "Select Registrations";
                      } else if (selectedRegistrations.length === 1) {
                        return getRegistrationText(selectedRegistrations[0]);
                      } else {
                        return `${selectedRegistrations.length} selected`;
                      }
                    })()}
                    options={getRegistrationsFromTriggerId(trigger.id)?.map(
                      (r) => ({
                        label: getRegistrationText(r),
                        value: r.id,
                      }),
                    )}
                    selectedOptions={props.form?.getValues("triggerIds")}
                    onSelect={(value) => {
                      if (props.form) {
                        const currentTriggerIds =
                          props.form.getValues("triggerIds");
                        const isSelected = currentTriggerIds.includes(value);

                        if (isSelected) {
                          // Remove from selection
                          props.form.setValue(
                            "triggerIds",
                            currentTriggerIds.filter((id) => id !== value),
                            {
                              shouldDirty: true,
                              shouldTouch: true,
                            },
                          );
                        } else {
                          // Add to selection
                          props.form.setValue(
                            "triggerIds",
                            [...currentTriggerIds, value],
                            {
                              shouldDirty: true,
                              shouldTouch: true,
                            },
                          );
                        }
                      }
                    }}
                    optionRenderer={(option) => {
                      const registrations = getRegistrationsFromTriggerId(
                        trigger.id,
                      );
                      const registration = registrations.find(
                        (r) => r.id === option.value,
                      );
                      if (!registration) {
                        return (
                          <>
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                props.form
                                  ?.getValues("triggerIds")
                                  ?.includes(option.value)
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            <span className="text-gray-500">
                              {option.label}
                            </span>
                          </>
                        );
                      }
                      return (
                        <>
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              props.form
                                ?.getValues("triggerIds")
                                ?.includes(option.value)
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          <ResourceRenderer resource={registration.resource} />
                        </>
                      );
                    }}
                  />
                ) : null}
                {!props.form &&
                getRegistrationsFromTriggerId(trigger.id)?.length ? (
                  <RegistrationsHoverCard
                    registrations={getRegistrationsFromTriggerId(trigger.id)}
                  />
                ) : null}
                <AuthenticateTriggerDialog
                  reloadTriggers={props.reloadTriggers}
                  trigger={trigger}
                />
              </div>
            </div>
            {index < arr.length - 1 && <hr />}
          </span>
        ))}
      </AccordionContent>
    </AccordionItem>
  );
}
