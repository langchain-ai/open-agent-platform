"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import _ from "lodash";

interface SchemaFormProps {
  schema: any;
  onChange: (values: any) => void;
  values: any;
}

export function SchemaForm({ schema, onChange, values }: SchemaFormProps) {
  const [formValues, setFormValues] = useState<Record<string, any>>(
    values || {},
  );

  useEffect(() => {
    // Initialize default values from schema
    if (schema && schema.properties) {
      const defaults: any = {};
      Object.entries(schema.properties).forEach(
        ([key, prop]: [string, any]) => {
          if (prop.default !== undefined && formValues[key] === undefined) {
            defaults[key] = prop.default;
          }
        },
      );

      if (Object.keys(defaults).length > 0) {
        setFormValues((prev) => ({ ...prev, ...defaults }));
      }
    }
  }, [schema]);

  useEffect(() => {
    onChange(formValues);
  }, [formValues, onChange]);

  const handleChange = (name: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  if (!schema || !schema.properties) {
    return <div className="text-gray-500">No input schema available</div>;
  }

  return (
    <div className="space-y-4">
      {Object.entries(schema.properties).map(
        ([name, property]: [string, any]) => {
          const isRequired = schema.required?.includes(name);
          const label = property.title || name;
          const description = property.description;

          return (
            <div
              key={name}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <Label
                  htmlFor={name}
                  className={cn(
                    isRequired &&
                      "after:ml-0.5 after:text-red-500 after:content-['*']",
                  )}
                >
                  {_.startCase(label)}
                </Label>
                {isRequired && (
                  <span className="text-xs text-gray-500">Required</span>
                )}
              </div>

              {description && (
                <p className="text-xs text-gray-500">{description}</p>
              )}

              {renderField(name, property, formValues[name], (value) =>
                handleChange(name, value),
              )}
            </div>
          );
        },
      )}
    </div>
  );
}

function renderField(
  name: string,
  property: any,
  value: any,
  onChange: (value: any) => void,
) {
  const type = property.type;

  if (property.enum) {
    return (
      <Select
        value={value || ""}
        onValueChange={onChange}
      >
        <SelectTrigger id={name}>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          {property.enum.map((option: string) => (
            <SelectItem
              key={option}
              value={option}
            >
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  switch (type) {
    case "string":
      return (
        <Input
          id={name}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={property.example || `Enter ${name}`}
        />
      );

    case "number":
    case "integer":
      if (property.minimum !== undefined && property.maximum !== undefined) {
        return (
          <div className="space-y-2">
            <Slider
              id={name}
              value={[value || property.minimum]}
              min={property.minimum}
              max={property.maximum}
              step={property.type === "integer" ? 1 : 0.1}
              onValueChange={(vals) => onChange(vals[0])}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{property.minimum}</span>
              <span>{value !== undefined ? value : "-"}</span>
              <span>{property.maximum}</span>
            </div>
          </div>
        );
      }

      return (
        <Input
          id={name}
          type="number"
          value={value || ""}
          onChange={(e) => onChange(Number(e.target.value))}
          min={property.minimum}
          max={property.maximum}
          step={property.type === "integer" ? 1 : 0.1}
          placeholder={property.example || `Enter ${name}`}
        />
      );

    case "boolean":
      return (
        <div className="flex items-center space-x-2">
          <Switch
            id={name}
            checked={!!value}
            onCheckedChange={onChange}
          />
          <Label htmlFor={name}>{value ? "Enabled" : "Disabled"}</Label>
        </div>
      );

    default:
      return (
        <Input
          id={name}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${name}`}
        />
      );
  }
}
