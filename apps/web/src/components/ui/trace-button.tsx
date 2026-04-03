"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

type EntryDirection = "top" | "right" | "bottom" | "left" | null;

const getClipPath = (direction: EntryDirection, isHovered: boolean): string => {
  if (!isHovered) {
    switch (direction) {
      case "top": return "inset(0 0 100% 0)";
      case "right": return "inset(0 0 0 100%)";
      case "bottom": return "inset(100% 0 0 0)";
      case "left": return "inset(0 100% 0 0)";
      default: return "inset(0 100% 100% 0)";
    }
  }
  return "inset(0 0 0 0)";
};

const colorMap = {
  green: "border-green-600",
  red: "border-red-600",
  black: "border-black",
};

interface TraceButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  traceColor?: "green" | "red" | "black";
}

const TraceButton = React.forwardRef<HTMLButtonElement, TraceButtonProps>(
  ({ className, children, traceColor = "black", disabled, ...props }, ref) => {
    const isMobile = useIsMobile();
    const [isHovered, setIsHovered] = React.useState(false);
    const [entryDirection, setEntryDirection] = React.useState<EntryDirection>(null);
    const btnRef = React.useRef<HTMLButtonElement>(null);

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isMobile) return;
      const element = btnRef.current;
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const distTop = y;
      const distBottom = rect.height - y;
      const distLeft = x;
      const distRight = rect.width - x;
      const min = Math.min(distTop, distBottom, distLeft, distRight);
      if (min === distTop) setEntryDirection("top");
      else if (min === distRight) setEntryDirection("right");
      else if (min === distBottom) setEntryDirection("bottom");
      else setEntryDirection("left");
      setIsHovered(true);
    };

    const handleMouseLeave = () => setIsHovered(false);

    return (
      <button
        ref={(node) => {
          (btnRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
        }}
        className={cn(
          "relative overflow-hidden inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium",
          "bg-white text-foreground",
          isHovered ? "border border-transparent" : "border border-muted-foreground/20",
          "transition-colors",
          "disabled:opacity-50 disabled:pointer-events-none",
          className,
          isHovered && "!border-transparent"
        )}
        disabled={disabled}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <div
          className={cn(
            "absolute inset-0 pointer-events-none border rounded-md z-10",
            colorMap[traceColor]
          )}
          style={{
            clipPath: getClipPath(entryDirection, isHovered),
            transition: "clip-path 0.2s ease-out",
          }}
        />
        {children}
      </button>
    );
  }
);

TraceButton.displayName = "TraceButton";

export { TraceButton };
