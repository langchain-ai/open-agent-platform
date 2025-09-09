import { ListUserTriggersData } from "@/hooks/use-triggers";

export function generateFormFields(schema: Record<string, any>) {
  const fields: Array<{
    name: string;
    type: string;
    required?: boolean;
    description?: string;
  }> = [];

  if (schema.properties) {
    Object.entries(schema.properties).forEach(([key, value]: [string, any]) => {
      fields.push({
        name: key,
        type: value.type || "string",
        required: schema.required?.includes(key),
        description: value.description,
      });
    });
  }

  return fields;
}

export function groupUserRegisteredTriggersByProvider(
  triggers: ListUserTriggersData[],
): Record<string, ListUserTriggersData[]> {
  const groupedTriggers: Record<string, ListUserTriggersData[]> = {};

  triggers.forEach((trigger) => {
    if (!groupedTriggers[trigger.template_id]) {
      groupedTriggers[trigger.template_id] = [];
    }
    groupedTriggers[trigger.template_id].push(trigger);
  });

  return groupedTriggers;
}
