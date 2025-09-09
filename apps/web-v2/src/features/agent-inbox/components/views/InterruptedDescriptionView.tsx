import { MarkdownText } from "@/components/ui/markdown-text";

interface InterruptedDescriptionViewProps {
  description: string | undefined;
}

export function InterruptedDescriptionView({
  description,
}: InterruptedDescriptionViewProps) {
  return (
    <div className="pt-6 pb-2">
      <MarkdownText className="text-wrap break-words whitespace-pre-wrap">
        {description || "No description provided"}
      </MarkdownText>
    </div>
  );
}
