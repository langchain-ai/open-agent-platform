"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type InputSchema = {
  type: "object";
  properties?: Record<string, any>;
  required?: string[];
};

interface SchemaRendererProps {
  schema: InputSchema;
  className?: string;
}

export function SchemaRenderer({ schema, className }: SchemaRendererProps) {
  if (!schema || schema.type !== "object") {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-yellow-600">
            <AlertCircle className="h-4 w-4" />
            <span>Invalid schema format</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="px-4">
        <div className="mb-2 text-sm font-medium">Schema</div>
        <div className="space-y-1">
          {schema.properties && Object.keys(schema.properties).length > 0 ? (
            Object.entries(schema.properties).map(([key, value]) => (
              <PropertyItem
                key={key}
                name={key}
                value={value}
                isRequired={schema.required?.includes(key) || false}
                depth={0}
              />
            ))
          ) : (
            <div className="text-muted-foreground text-sm">
              No properties defined
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface PropertyItemProps {
  name: string;
  value: any;
  isRequired: boolean;
  depth: number;
}

function PropertyItem({ name, value, isRequired, depth }: PropertyItemProps) {
  const [isExpanded, setIsExpanded] = useState(depth < 1);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "string":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "number":
      case "integer":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "boolean":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "array":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300";
      case "object":
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const isExpandable = value.type === "object" || value.type === "array";

  const handleToggle = () => {
    if (isExpandable) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div
      className={cn(
        "border-l-2 pl-3",
        depth > 0 ? "mt-2 ml-4" : "border-transparent",
      )}
    >
      <div
        className={cn(
          "flex items-start gap-2",
          isExpandable && "hover:bg-muted/50 cursor-pointer rounded-sm",
        )}
        onClick={handleToggle}
      >
        {isExpandable && (
          <div className="mt-1">
            {isExpanded ? (
              <ChevronDown className="text-muted-foreground h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="text-muted-foreground h-3.5 w-3.5" />
            )}
          </div>
        )}

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{name}</span>

            <Badge
              variant="outline"
              className={cn("text-xs font-normal", getTypeColor(value.type))}
            >
              {value.type}
            </Badge>

            {isRequired && (
              <Badge
                variant="outline"
                className="bg-red-100 text-xs font-normal text-red-800 dark:bg-red-900 dark:text-red-300"
              >
                required
              </Badge>
            )}

            {value.description && (
              <span className="text-muted-foreground text-xs">
                {value.description}
              </span>
            )}
          </div>

          {value.enum && (
            <div className="mt-2">
              <div className="text-muted-foreground mb-1 text-xs">
                Allowed values:
              </div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {value.enum.map((enumValue: any, index: number) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="bg-slate-100 px-2 py-0.5 font-mono text-xs transition-colors dark:bg-slate-800"
                  >
                    {typeof enumValue === "string"
                      ? enumValue
                      : JSON.stringify(enumValue)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {isExpanded && value.type === "object" && value.properties && (
            <div className="mt-2 space-y-1">
              {Object.entries(value.properties).map(([subKey, subValue]) => (
                <PropertyItem
                  key={subKey}
                  name={subKey}
                  value={subValue}
                  isRequired={value.required?.includes(subKey) || false}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}

          {isExpanded && value.type === "array" && value.items && (
            <div className="mt-2 ml-2 border-l-2 pl-3">
              <div className="text-muted-foreground mb-1 text-xs">
                Array items:
              </div>
              <PropertyItem
                name="items"
                value={value.items}
                isRequired={false}
                depth={depth + 1}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
