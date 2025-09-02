"use client";

import React from "react";

const VideoBackground = () => {
  return (
    <video
      autoPlay
      loop
      muted
      playsInline
      className="absolute inset-0 h-full w-full object-cover motion-reduce:hidden"
    >
      <source
        src="https://customer-xp1a3vy0ydc4ega7.cloudflarestream.com/bb6cf069546e3d829aa5808ac8b07748/downloads/default.mp4"
        type="video/mp4"
      />
      Your browser does not support the video tag.
    </video>
  );
};

interface VideoBackgroundPageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export default function VideoBackgroundPageWrapper({
  children,
  className,
}: VideoBackgroundPageWrapperProps) {
  return (
    <div className={`relative min-h-screen overflow-hidden ${className || ""}`}>
      <VideoBackground />
      <div className="absolute inset-0 bg-blue-600/20 z-5" />
      <div className="relative z-10 min-h-screen">{children}</div>
    </div>
  );
}