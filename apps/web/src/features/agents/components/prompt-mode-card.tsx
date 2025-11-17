/**
 * Individual prompt template mode card component.
 *
 * Displays a single agent prompt template option that the user can select.
 * Shows the template name, description, category icon, and recommended use cases.
 */

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PromptTemplateSummary } from "@/types/tool";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCategoryStyle, getPrimaryCategory } from "@/lib/prompt-categories";

interface PromptModeCardProps {
  /**
   * The prompt template summary
   */
  template: PromptTemplateSummary;
  /**
   * Whether this mode is currently selected
   */
  selected: boolean;
  /**
   * Callback when user selects this mode
   */
  onSelect: () => void;
  /**
   * Optional tool categories for icon/color selection
   */
  toolCategories?: string[];
  /**
   * Optional className for styling
   */
  className?: string;
}

export function PromptModeCard({
  template,
  selected,
  onSelect,
  toolCategories,
  className,
}: PromptModeCardProps) {
  const categoryStyle = getCategoryStyle(toolCategories);
  const CategoryIcon = categoryStyle.icon;
  const primaryCategory = getPrimaryCategory(toolCategories);

  return (
    <Card
      className={cn(
        "group hover:border-primary/50 cursor-pointer transition-all duration-200 hover:shadow-md",
        selected &&
          "border-primary bg-primary/5 ring-primary/20 shadow-sm ring-2",
        className,
      )}
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <div
              className={cn(
                "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md",
                categoryStyle.bgColor,
              )}
            >
              <CategoryIcon className={cn("size-4", categoryStyle.color)} />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base font-medium">
                {template.name}
              </CardTitle>
              <Badge
                variant="outline"
                className={cn("mt-1 text-xs", categoryStyle.color)}
              >
                {primaryCategory}
              </Badge>
            </div>
          </div>
          {selected && (
            <Check
              className={cn(
                "animate-in fade-in zoom-in mt-0.5 size-5 shrink-0",
                "text-primary",
              )}
            />
          )}
        </div>
        {template.description && (
          <CardDescription className="mt-2 text-sm">
            {template.description}
          </CardDescription>
        )}
      </CardHeader>
      {template.recommended_for && template.recommended_for.length > 0 && (
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-1.5">
            {template.recommended_for.slice(0, 3).map((useCase, index) => (
              <Badge
                key={index}
                variant="outline"
                className="text-xs"
              >
                {useCase}
              </Badge>
            ))}
            {template.recommended_for.length > 3 && (
              <Badge
                variant="outline"
                className="text-muted-foreground text-xs"
              >
                +{template.recommended_for.length - 3} more
              </Badge>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
