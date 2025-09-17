import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { prettifyText } from "@/features/agent-inbox/utils";
import { ListTriggerRegistrationsData, Trigger } from "@/types/triggers";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { AuthenticateTriggerDialog } from "./authenticate-trigger-dialog";
import { UseFormReturn } from "react-hook-form";
import { AgentTriggersFormData } from "@/components/agent-creator-sheet/components/agent-triggers-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox } from "@/components/ui/combobox";

const getRegistrationText = (
  registration: ListTriggerRegistrationsData,
): string => {
  const resource = registration.resource;
  if (typeof resource === "string") return resource;
  if (typeof resource === "object" && resource !== null)
    return Object.values(resource)[0];
  return "";
};

function RegistrationsBadge(props: {
  registrations: ListTriggerRegistrationsData[];
}) {
  const { registrations } = props;

  if (!registrations.length) {
    return null;
  }

  if (registrations.length === 1) {
    return (
      <Badge variant="secondary">{getRegistrationText(registrations[0])}</Badge>
    );
  }

  return (
    <HoverCard>
      <HoverCardTrigger>
        <Badge variant="secondary">{registrations.length} Registrations</Badge>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <ul className="space-y-2">
          {registrations.map((registration) => (
            <li
              key={registration.id}
              className="flex items-center gap-2 text-sm"
            >
              <div className="bg-muted-foreground h-1.5 w-1.5 flex-shrink-0 rounded-full" />
              <span className="break-words">
                {getRegistrationText(registration)}
              </span>
            </li>
          ))}
        </ul>
      </HoverCardContent>
    </HoverCard>
  );
}

export function TriggerAccordionItem(props: {
  provider: string;
  groupedRegistrations: {
    [templateId: string]: ListTriggerRegistrationsData[];
  };
  triggers: Trigger[];
  form?: UseFormReturn<AgentTriggersFormData>;
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

  const isSelected = (triggerId: string): boolean => {
    const registrations = getRegistrationsFromTriggerId(triggerId);
    return registrations.some((registration) =>
      selectedTriggerIds.includes(registration.id),
    );
  };

  return (
    <AccordionItem
      value={props.provider}
      className="border-muted"
    >
      <AccordionTrigger className="hover:bg-muted rounded px-4 hover:cursor-pointer">
        <span className="flex flex-col items-start justify-start gap-2">
          <p className="text-sm font-semibold">{props.provider}</p>
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
                  {props.form && <Checkbox checked={isSelected(trigger.id)} />}
                  {prettifyText(trigger.id)}
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
                  />
                ) : null}
                {!props.form &&
                getRegistrationsFromTriggerId(trigger.id)?.length ? (
                  <RegistrationsBadge
                    registrations={getRegistrationsFromTriggerId(trigger.id)}
                  />
                ) : null}
                <AuthenticateTriggerDialog trigger={trigger} />
              </div>
            </div>
            {index < arr.length - 1 && <hr />}
          </span>
        ))}
      </AccordionContent>
    </AccordionItem>
  );
}
