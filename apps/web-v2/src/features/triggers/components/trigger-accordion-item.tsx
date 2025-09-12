import {
  Accordion,
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

function RegistrationsBadge(props: {
  registrations: ListTriggerRegistrationsData[];
}) {
  const { registrations } = props;

  const getRegistrationText = (
    registration: ListTriggerRegistrationsData,
  ): string => {
    const resource = registration.resource;
    if (typeof resource === "string") return resource;
    if (typeof resource === "object" && resource !== null)
      return Object.values(resource)[0];
    return "";
  };

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
          <span className="flex flex-col">
            <div
              key={trigger.id}
              className="flex items-center justify-between py-4"
            >
              <p>{prettifyText(trigger.id)}</p>

              <div className="flex items-center gap-3">
                {getRegistrationsFromTriggerId(trigger.id)?.length ? (
                  <RegistrationsBadge
                    registrations={getRegistrationsFromTriggerId(trigger.id)}
                  />
                ) : null}
                <button className="cursor-pointer rounded border border-green-600 px-2 py-1 text-sm text-green-700 transition-colors ease-in-out hover:border-green-700 hover:bg-green-50 hover:text-green-800">
                  Authenticate
                </button>
              </div>
            </div>
            {index < arr.length - 1 && <hr />}
          </span>
        ))}
      </AccordionContent>
    </AccordionItem>
  );
}
