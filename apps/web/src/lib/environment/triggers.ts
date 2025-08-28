import { Trigger } from "@/types/triggers";

export function getTriggers(): Trigger[] {
  const triggersConfig = process.env.NEXT_PUBLIC_TRIGGERS_CONFIG;

  if (!triggersConfig) {
    return [];
  }

  try {
    const parsed = JSON.parse(triggersConfig) as Trigger[];
    console.log(parsed);
    return [...parsed];
  } catch (error) {
    console.error("Failed to parse NEXT_PUBLIC_TRIGGERS_CONFIG:", error);
    return [];
  }
}

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
