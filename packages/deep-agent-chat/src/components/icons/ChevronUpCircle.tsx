"use client";

// no-op import removed

type ChevronUpCircleIconProps = {
  className?: string;
  width?: number;
  height?: number;
};

export function ChevronUpCircleIcon({
  className,
  width = 36,
  height = 37,
}: ChevronUpCircleIconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 36 37"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect
        x="0.5"
        y="1.24292"
        width="35"
        height="35"
        rx="17.5"
        fill="white"
      />
      <rect
        x="0.5"
        y="1.24292"
        width="35"
        height="35"
        rx="17.5"
        stroke="#204F4F"
      />
      <path
        d="M17.9993 24.5763V12.9097M17.9993 12.9097L12.166 18.743M17.9993 12.9097L23.8327 18.743"
        stroke="#3F3F46"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
