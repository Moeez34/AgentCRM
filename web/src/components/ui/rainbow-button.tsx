import React from "react";
import { cn } from "@/lib/utils";

export interface RainbowButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const RainbowButton = React.forwardRef<
  HTMLButtonElement,
  RainbowButtonProps
>(({ children, className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "group relative inline-flex h-11 items-center justify-center rounded-xl px-6 py-2 text-sm font-semibold text-white transition-all duration-300 active:scale-95 cursor-pointer overflow-hidden border-0",
        "bg-zinc-950",
        className
      )}
      {...props}
    >
      {/* Animated Rainbow Border Glow Layer */}
      <span className="absolute inset-0 -z-10 rounded-xl p-[1.5px] bg-[linear-gradient(90deg,#ff007a,#7928ca,#0070f3,#00dfd8,#ff007a)] bg-[length:200%_auto] animate-rainbow" />
      
      {/* Outer Soft Rainbow Blur Glow Layer */}
      <span className="absolute inset-0 -z-20 rounded-xl bg-[linear-gradient(90deg,#ff007a,#7928ca,#0070f3,#00dfd8,#ff007a)] bg-[length:200%_auto] opacity-60 blur-md animate-rainbow" />

      {/* Button Content Container */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>

      <style jsx>{`
        @keyframes rainbow {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-rainbow {
          animation: rainbow 3s linear infinite;
        }
      `}</style>
    </button>
  );
});

RainbowButton.displayName = "RainbowButton";

export default RainbowButton;
