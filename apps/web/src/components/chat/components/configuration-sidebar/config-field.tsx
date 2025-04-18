"use client";

import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useConfigStore } from "@/components/chat/hooks/use-config-store";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Option {
  label: string;
  value: string;
}

interface ConfigFieldProps {
  id: string;
  label: string;
  type:
    | "text"
    | "textarea"
    | "number"
    | "switch"
    | "slider"
    | "select"
    | "json";
  description?: string;
  placeholder?: string;
  options?: Option[];
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export function ConfigField({
  id,
  label,
  type,
  description,
  placeholder,
  options = [],
  min,
  max,
  step = 1,
  className,
}: ConfigFieldProps) {
  const { config, updateConfig } = useConfigStore();
  const [jsonError, setJsonError] = useState<string | null>(null);

  const value = config[id];

  const handleChange = (newValue: any) => {
    updateConfig(id, newValue);
  };

  const handleJsonChange = (jsonString: string) => {
    try {
      if (!jsonString.trim()) {
        updateConfig(id, undefined);
        setJsonError(null);
        return;
      }

      const parsed = JSON.parse(jsonString);
      updateConfig(id, parsed);
      setJsonError(null);
    } catch (error) {
      setJsonError("Invalid JSON format");
      console.error(error);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label
          htmlFor={id}
          className="text-sm font-medium"
        >
          {label}
        </Label>
        {type === "switch" && (
          <Switch
            id={id}
            checked={!!value}
            onCheckedChange={handleChange}
          />
        )}
      </div>

      {description && <p className="text-xs text-gray-500">{description}</p>}

      {type === "text" && (
        <Input
          id={id}
          value={value || ""}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
        />
      )}

      {type === "textarea" && (
        <Textarea
          id={id}
          value={value || ""}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[100px]"
        />
      )}

      {type === "number" && (
        <Input
          id={id}
          type="number"
          value={value !== undefined ? value : ""}
          onChange={(e) => handleChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
        />
      )}

      {type === "slider" && (
        <div className="pt-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-gray-500">{min}</span>
            <span className="text-sm font-medium">
              {value !== undefined ? value : (min! + max!) / 2}
            </span>
            <span className="text-xs text-gray-500">{max}</span>
          </div>
          <Slider
            id={id}
            value={[value !== undefined ? value : (min! + max!) / 2]}
            min={min}
            max={max}
            step={step}
            onValueChange={(vals) => handleChange(vals[0])}
          />
        </div>
      )}

      {type === "select" && (
        <Select
          value={value}
          onValueChange={handleChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {type === "json" && (
        <>
          <Textarea
            id={id}
            value={value ? JSON.stringify(value, null, 2) : ""}
            onChange={(e) => handleJsonChange(e.target.value)}
            placeholder={placeholder || '{\n  "key": "value"\n}'}
            className="min-h-[120px] font-mono text-sm"
          />
          {jsonError && (
            <Alert
              variant="destructive"
              className="py-2"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                {jsonError}
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
    </div>
  );
}
