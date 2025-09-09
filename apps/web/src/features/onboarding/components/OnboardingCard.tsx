"use client";

import React from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";

export interface OnboardingCardProps {
  title: string;
  description: string;
  onClick: () => void;
  helperText?: string;
  className?: string;
  align?: "left" | "center";
  arrowInside?: boolean;
  noOuterHoverBorder?: boolean;
  innerBorder?: boolean;
}

export function OnboardingCard({
  title,
  description,
  onClick,
  helperText,
  className,
  align = "center",
  arrowInside = false,
  noOuterHoverBorder = false,
  innerBorder = false,
}: OnboardingCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        className,
        "bg-opacity-88 group relative flex h-80 w-80 flex-col justify-between gap-2.5 border border-transparent transition-all transition-colors duration-300 ease-in-out",
        innerBorder ? "rounded-[20px] p-0" : "rounded-3xl p-3",
        "dark:bg-tertiary bg-[#edebff] hover:bg-[#e8e5ff]",
        !noOuterHoverBorder && "hover:border-[var(--brand-900)]",
      )}
    >
      <div
        className={cn(
          "flex flex-1 flex-col gap-3 bg-white p-[28px] transition-colors duration-300",
          innerBorder
            ? "rounded-[20px] border border-[#0A5982]"
            : "rounded-3xl",
          align === "center"
            ? "items-center justify-center text-center"
            : "items-start justify-start text-left",
          arrowInside && "relative",
          "group-hover:bg-[#F4F3FF]",
        )}
      >
        <div
          className={cn(
            "text-[20px] leading-[120%] font-normal tracking-[-0.2px] text-[var(--colors-text-text-primary-900,#101828)]",
            align === "center" ? "text-center" : "text-left",
          )}
        >
          {title}
        </div>
        <div
          className={cn(
            "text-[16px] leading-[20px] font-normal tracking-[-0.2px] text-[var(--colours-text-text-quaternary-500,#70707B)]",
            align === "center" ? "text-center" : "text-left",
          )}
        >
          {description}
        </div>
        {arrowInside && (
          <div className="absolute right-[28px] bottom-[28px] transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1">
            <Image
              src="/icons/intro-arrow.svg"
              alt="arrow"
              width={25}
              height={25}
            />
          </div>
        )}
      </div>
      {!arrowInside && (
        <div className="flex items-center justify-end gap-2">
          {helperText && (
            <div className="text-brand-green-900 text-sm opacity-0 duration-300 ease-in-out group-hover:opacity-100">
              {helperText}
            </div>
          )}
          <div className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1">
            <Image
              src="/icons/intro-arrow.svg"
              alt="arrow"
              width={25}
              height={25}
            />
          </div>
        </div>
      )}
    </button>
  );
}

export default OnboardingCard;
