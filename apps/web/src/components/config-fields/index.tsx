"use client";

import React, { useState } from "react";
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
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import _ from "lodash";
import { cn } from "@/lib/utils";
import { ConfigFieldProps } from "./types";

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
  value,
  setValue,
}: ConfigFieldProps) {
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleChange = (newValue: any) => {
    setJsonError(null); // Clear JSON error on any change
    setValue(newValue);
  };

  const handleJsonChange = (jsonString: string) => {
    try {
      if (!jsonString.trim()) {
        handleChange(undefined); // Use the unified handleChange
        setJsonError(null);
        return;
      }

      // Attempt to parse for validation first
      const parsedJson = JSON.parse(jsonString);
      // If parsing succeeds, call handleChange with the raw string and clear error
      handleChange(parsedJson); // Use the unified handleChange
      setJsonError(null);
    } catch (_) {
      // If parsing fails, update state with invalid string but set error
      // This allows the user to see their invalid input and the error message
      setValue(jsonString);
      setJsonError("Invalid JSON format");
    }
  };

  const handleFormatJson = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      // Directly use handleChange to update with the formatted string
      handleChange(parsed);
      setJsonError(null); // Clear error on successful format
    } catch (_) {
      // If formatting fails (because input is not valid JSON), set the error state
      // Do not change the underlying value that failed to parse/format
      setJsonError("Invalid JSON format");
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label
          htmlFor={id}
          className="text-sm font-medium"
        >
          {_.startCase(label)}
        </Label>
        {type === "switch" && (
          <Switch
            id={id}
            checked={!!value}
            onCheckedChange={handleChange}
          />
        )}
      </div>

      {description && (
        <p className="text-xs whitespace-pre-line text-gray-500">
          {description}
        </p>
      )}

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
          onChange={(e) => {
            // Handle potential empty string or invalid number input
            const val = e.target.value;
            if (val === "") {
              handleChange(undefined); // Treat empty string as clearing the value
            } else {
              const num = Number(val);
              // Only call handleChange if it's a valid number
              if (!isNaN(num)) {
                handleChange(num);
              }
              // If not a valid number (e.g., '1.2.3'), do nothing, keep the last valid state
            }
          }}
          min={min}
          max={max}
          step={step}
        />
      )}

      {type === "slider" && (
        <div className="pt-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-gray-500">{min ?? ""}</span>
            <span className="text-sm font-medium">
              {value !== undefined
                ? value
                : min !== undefined && max !== undefined
                  ? (min + max) / 2
                  : ""}
            </span>
            <span className="text-xs text-gray-500">{max ?? ""}</span>
          </div>
          <Slider
            id={id}
            value={[
              value !== undefined
                ? value
                : min !== undefined && max !== undefined
                  ? (min + max) / 2
                  : 0,
            ]}
            min={min}
            max={max}
            step={step}
            onValueChange={(vals) => handleChange(vals[0])}
            disabled={min === undefined || max === undefined}
          />
        </div>
      )}

      {type === "select" && (
        <Select
          value={value ?? ""}
          onValueChange={handleChange}
        >
          <SelectTrigger>
            <SelectValue placeholder={placeholder || "Select an option"} />
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
            value={
              typeof value === "string"
                ? value
                : (JSON.stringify(value, null, 2) ?? "")
            }
            onChange={(e) => handleJsonChange(e.target.value)}
            placeholder={placeholder || '{\n  "key": "value"\n}'}
            className={cn(
              "min-h-[120px] font-mono text-sm",
              jsonError &&
                "border-red-500 focus:border-red-500 focus-visible:ring-red-500", // Add error styling
            )}
          />
          <div className="flex w-full items-start justify-between gap-2 pt-1">
            {" "}
            {/* Use items-start */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFormatJson(value ?? "")}
              // Disable if value is empty, not a string, or already has a JSON error
              disabled={!value || typeof value !== "string" || !!jsonError}
              className="mt-1" // Add margin top to align better with textarea
            >
              Format
            </Button>
            {jsonError && (
              <Alert
                variant="destructive"
                className="flex-grow px-3 py-1" // Adjusted styling
              >
                <div className="flex items-center gap-2">
                  {" "}
                  {/* Ensure icon and text are aligned */}
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />{" "}
                  {/* Added flex-shrink-0 */}
                  <AlertDescription className="text-xs">
                    {jsonError}
                  </AlertDescription>
                </div>
              </Alert>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export * from "./types";
export * from "./mcp";
export * from "./sub-agents";
