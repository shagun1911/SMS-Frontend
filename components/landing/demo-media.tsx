"use client";

import { useState } from "react";

interface DemoMediaProps {
  videoSrc?: string;
  gifSrc?: string;
  children: React.ReactNode;
  className?: string;
  /** When true, fallback is scrollable to prevent overflow (e.g. dashboard mock). */
  compact?: boolean;
}

/**
 * Shows video or GIF when available and they load; otherwise shows animated fallback.
 * Video/GIF autoplay muted loop for continuous motion.
 */
export function DemoMedia({ videoSrc, gifSrc, children, className = "", compact = false }: DemoMediaProps) {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [gifLoaded, setGifLoaded] = useState(false);

  const showVideo = Boolean(videoSrc && videoLoaded);
  const showGif = Boolean(gifSrc && gifLoaded && !showVideo);
  const showFallback = !showVideo && !showGif;

  return (
    <div className={`relative h-full w-full overflow-hidden bg-transparent ${className}`}>
      {videoSrc && (
        <video
          autoPlay
          muted
          loop
          playsInline
          className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-500 ${showVideo ? "opacity-100" : "opacity-0"}`}
          onLoadedData={() => setVideoLoaded(true)}
          onError={() => {}}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}
      {gifSrc && (
        <img
          src={gifSrc}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-500 ${showGif ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setGifLoaded(true)}
          onError={() => {}}
        />
      )}
      {showFallback && (
        <div
          className={`relative h-full w-full bg-[hsl(var(--muted))]/20 ${
            compact ? "overflow-y-auto overflow-x-hidden" : "overflow-hidden"
          }`}
        >
          <div className={`w-full animate-demo-fallback ${compact ? "min-h-full" : "flex h-full min-h-full items-stretch"}`}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
