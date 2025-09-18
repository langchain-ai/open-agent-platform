import {
  GroupedTriggerRegistrationsByProvider,
  ListTriggerRegistrationsData,
  Trigger,
} from "@/types/triggers";

export function generateFormFields(
  schema: Record<string, any>,
  requireDisplayName?: boolean,
) {
  const fields: Array<{
    name: string;
    type: string;
    required?: boolean;
    description?: string;
  }> = [];

  if (requireDisplayName) {
    fields.push({
      name: "display_name",
      type: "string",
      required: true,
      description: "A display name for this trigger registration",
    });
  }

  if (schema.properties) {
    Object.entries(schema.properties).forEach(([key, value]: [string, any]) => {
      // Skip display_name if it's already in the schema (avoid duplicates)
      if (key === "display_name") return;

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

export function groupTriggerRegistrationsByTemplate(
  registrations: ListTriggerRegistrationsData[],
): Record<string, ListTriggerRegistrationsData[]> {
  const groupedRegistrations: Record<string, ListTriggerRegistrationsData[]> =
    {};

  registrations.forEach((registration) => {
    if (!groupedRegistrations[registration.template_id]) {
      groupedRegistrations[registration.template_id] = [];
    }
    groupedRegistrations[registration.template_id].push(registration);
  });

  return groupedRegistrations;
}

export function groupTriggerRegistrationsByProvider(
  registrations: ListTriggerRegistrationsData[],
  triggers: Trigger[],
): GroupedTriggerRegistrationsByProvider {
  const groupedByProvider: GroupedTriggerRegistrationsByProvider = {};

  const templateToProvider: Record<string, string> = {};

  // Initialize provider groups and create template-to-provider mapping
  triggers.forEach((trigger) => {
    if (!groupedByProvider[trigger.provider]) {
      groupedByProvider[trigger.provider] = {
        registrations: {},
        triggers: [],
      };
    }
    groupedByProvider[trigger.provider].triggers.push(trigger);
    templateToProvider[trigger.id] = trigger.provider;
  });

  // Group registrations by provider and template
  registrations.forEach((registration) => {
    const provider = templateToProvider[registration.template_id];
    if (!provider) {
      return;
    }

    if (!groupedByProvider[provider]) {
      groupedByProvider[provider] = {
        registrations: {},
        triggers: [],
      };
    }

    if (!groupedByProvider[provider].registrations[registration.template_id]) {
      groupedByProvider[provider].registrations[registration.template_id] = [];
    }

    groupedByProvider[provider].registrations[registration.template_id].push(
      registration,
    );
  });

  return groupedByProvider;
}
