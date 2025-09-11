import * as React from "react";
import { type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { buttonVariants } from "./button";

interface SplitButtonItem {
  label: string;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
}

interface SplitButtonProps extends VariantProps<typeof buttonVariants> {
  buttons: SplitButtonItem[];
  className?: string;
}

/**
 * A split button component that renders multiple buttons as a single unit with dividers.
 * Built on top of the existing Button component with consistent styling.
 */
function SplitButton({ buttons, variant, size, className }: SplitButtonProps) {
  if (buttons.length < 2) {
    throw new Error("SplitButton requires at least 2 buttons");
  }

  return (
    <div
      className={cn(
        "inline-flex items-center",
        "overflow-hidden p-0",
        className,
      )}
    >
      {buttons.map((button, index) => (
        <React.Fragment key={index}>
          <button
            onClick={button.onClick}
            disabled={button.disabled}
            className={cn(
              "h-full flex-1 px-4 py-2 text-sm font-medium transition-colors",
              buttonVariants({ variant, size }),
              index === 0 ? "rounded-r-none" : "rounded-l-none",
              index < buttons.length - 1 ? "rounded-r-none" : "",
              "disabled:pointer-events-none disabled:opacity-50",
            )}
          >
            {button.label}
          </button>
          {index < buttons.length - 1 && (
            <div
              className={cn(
                "w-px bg-current opacity-20",
                "h-[80%] self-center",
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export { SplitButton, type SplitButtonProps, type SplitButtonItem };