import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Star } from "lucide-react";

export function DefaultStar({ className }: { className?: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Star className={className} />
        </TooltipTrigger>
        <TooltipContent>
          <p>Default agent</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
