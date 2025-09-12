import {
  GroupedTriggerRegistrationsByProvider,
  ListTriggerRegistrationsData,
  Trigger,
} from "@/types/triggers";

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

type DDData = {
  [provider: string]: {
    registrations: {
      [templateId: string]: ListTriggerRegistrationsData[];
    };
    triggers: Trigger[];
  };
};

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
      console.log(
        "no provider found for template_id",
        provider,
        registration.template_id,
      );
      return;
    }

    if (!groupedByProvider[provider]) {
      console.log("no provider in group", provider);
      groupedByProvider[provider] = {
        registrations: {},
        triggers: [],
      };
    }

    if (!groupedByProvider[provider].registrations[registration.template_id]) {
      console.log(
        "no templates in provider group",
        provider,
        registration.template_id,
      );
      groupedByProvider[provider].registrations[registration.template_id] = [];
    }

    groupedByProvider[provider].registrations[registration.template_id].push(
      registration,
    );
  });

  return groupedByProvider;
}
