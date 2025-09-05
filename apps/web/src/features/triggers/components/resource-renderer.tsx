import { cn } from "@/lib/utils";

interface ResourceRendererProps {
  resource: unknown;
  className?: string;
  maxDepth?: number;
}

export function ResourceRenderer({
  resource,
  className,
  maxDepth = 3,
}: ResourceRendererProps) {
  // Check if this is a simple object with only string key-value pairs
  const isSimpleStringObject = (
    obj: unknown,
  ): obj is Record<string, string> => {
    if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
      return false;
    }

    const entries = Object.entries(obj);
    return (
      entries.length > 0 &&
      entries.every(
        ([key, value]) => typeof key === "string" && typeof value === "string",
      )
    );
  };

  // Render simple string objects as clean key-value pairs
  if (isSimpleStringObject(resource)) {
    const entries = Object.entries(resource);

    if (entries.length === 1) {
      const [key, value] = entries[0];
      return (
        <div className={cn("text-sm", className)}>
          <span className="font-medium">{key}:</span> {value}
        </div>
      );
    }

    return (
      <div className={cn("space-y-1 text-sm", className)}>
        {entries.map(([key, value]) => (
          <div key={key}>
            <span className="text-muted-foreground font-medium">{key}:</span>{" "}
            {value}
          </div>
        ))}
      </div>
    );
  }

  const renderValue = (value: unknown, depth = 0): React.ReactNode => {
    if (depth > maxDepth) {
      return <span className="text-muted-foreground italic">...</span>;
    }

    if (value === null) {
      return <span className="text-muted-foreground">null</span>;
    }

    if (value === undefined) {
      return <span className="text-muted-foreground">undefined</span>;
    }

    if (typeof value === "boolean") {
      return (
        <span className="text-blue-600 dark:text-blue-400">
          {String(value)}
        </span>
      );
    }

    if (typeof value === "number") {
      return (
        <span className="text-purple-600 dark:text-purple-400">{value}</span>
      );
    }

    if (typeof value === "string") {
      // Handle URLs
      if (value.startsWith("http://") || value.startsWith("https://")) {
        return (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:no-underline dark:text-blue-400"
          >
            "{value}"
          </a>
        );
      }

      // Handle email addresses
      if (value.includes("@") && value.includes(".")) {
        return (
          <a
            href={`mailto:${value}`}
            className="text-blue-600 underline hover:no-underline dark:text-blue-400"
          >
            "{value}"
          </a>
        );
      }

      return (
        <span className="text-green-600 dark:text-green-400">"{value}"</span>
      );
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-muted-foreground">[]</span>;
      }

      return (
        <div className="ml-4">
          <span className="text-muted-foreground">[</span>
          {value.map((item, index) => (
            <div
              key={index}
              className="ml-4"
            >
              <span className="text-muted-foreground">{index}: </span>
              {renderValue(item, depth + 1)}
              {index < value.length - 1 && (
                <span className="text-muted-foreground">,</span>
              )}
            </div>
          ))}
          <span className="text-muted-foreground">]</span>
        </div>
      );
    }

    if (typeof value === "object" && value !== null) {
      const entries = Object.entries(value);

      if (entries.length === 0) {
        return <span className="text-muted-foreground">{"{}"}</span>;
      }

      return (
        <div className="ml-4">
          <span className="text-muted-foreground">{"{"}</span>
          {entries.map(([key, val], index) => (
            <div
              key={key}
              className="ml-4"
            >
              <span className="font-medium text-orange-600 dark:text-orange-400">
                "{key}"
              </span>
              <span className="text-muted-foreground">: </span>
              {renderValue(val, depth + 1)}
              {index < entries.length - 1 && (
                <span className="text-muted-foreground">,</span>
              )}
            </div>
          ))}
          <span className="text-muted-foreground">{"}"}</span>
        </div>
      );
    }

    // Fallback for any other types
    return <span className="text-muted-foreground">{String(value)}</span>;
  };

  return (
    <div
      className={cn(
        "bg-muted/50 max-h-96 overflow-auto rounded-md p-3 font-mono text-sm",
        className,
      )}
    >
      {renderValue(resource)}
    </div>
  );
}
