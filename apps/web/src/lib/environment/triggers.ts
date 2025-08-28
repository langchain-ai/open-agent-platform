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
