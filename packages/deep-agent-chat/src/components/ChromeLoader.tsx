import React from "react";
import { LoadingSpinner } from "./LoadingSpinner";

interface ChromeLoaderProps {
  size?: number;
  className?: string;
}

export const ChromeLoader: React.FC<ChromeLoaderProps> = ({
  size = 14,
  className = "",
}) => {
  return (
    <LoadingSpinner
      size={size}
      className={`${className} animate-spin`}
    />
  );
};
