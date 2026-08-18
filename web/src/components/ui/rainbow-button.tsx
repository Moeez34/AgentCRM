"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * MagicUI-style Rainbow Button
 *
 * Uses a scrolling multi-stop linear gradient as a border via the
 * CSS background-clip trick: two stacked backgrounds —
 *   1. padding-box fill (transparent for outline, dark for default)
 *   2. border-box rainbow gradient
 *
 * The `animate-rainbow` class (defined in globals.css) scrolls the
 * background-position to create the rotating rainbow effect.
 */

export interface RainbowButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline";
}

export const RainbowButton = React.forwardRef<
  HTMLButtonElement,
  RainbowButtonProps
>(({ children, className, variant = "default", ...props }, ref) => {
  const rainbow =
    "linear-gradient(90deg,#ff0000,#ff7300,#ffff00,#00ff00,#0070f3,#7928ca,#ff0000)";

  return (
    <button
      ref={ref}
      className={cn(
        // Layout
        "group relative inline-flex items-center justify-center gap-2",
        "rounded-2xl text-sm font-semibold whitespace-nowrap transition-all duration-300",
        "cursor-pointer active:scale-95 disabled:pointer-events-none disabled:opacity-50",
        // Border via background-clip trick
        "[border:2px_solid_transparent]",
        "bg-[length:200%_auto] animate-rainbow",
        variant === "default" && "text-white",
        variant === "outline" && "text-white/90",
        className
      )}
      style={{
        background: `linear-gradient(#09090b, #09090b) padding-box, ${rainbow} border-box`,
        backgroundSize: "200% auto",
        animation: "rainbow 3s linear infinite",
      }}
      {...props}
    >
      {/* Subtle inner glow behind content */}
      <span className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/5" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
});

RainbowButton.displayName = "RainbowButton";

export default RainbowButton;
