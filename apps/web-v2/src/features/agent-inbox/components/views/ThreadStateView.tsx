import { StateViewObject } from "../state-view";

interface ThreadStateViewProps {
  threadValues: Record<string, any>;
  expanded?: boolean;
}

export function ThreadStateView({
  threadValues,
  expanded,
}: ThreadStateViewProps) {
  return (
    <div className="w-full flex-1">
      <div className="flex flex-col items-start justify-start gap-1 pt-6 pb-2">
        {Object.entries(threadValues).map(([k, v], idx) => (
          <StateViewObject
            expanded={expanded}
            key={`state-view-${k}-${idx}`}
            keyName={k}
            value={v}
          />
        ))}
      </div>
    </div>
  );
}
