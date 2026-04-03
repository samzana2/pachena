"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "./card";
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

interface TraceCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  autoTrace?: boolean;
}

const TraceCard = React.forwardRef<HTMLDivElement, TraceCardProps>(
  ({ className, children, autoTrace, ...props }, ref) => {
    const isMobile = useIsMobile();
    const [isHovered, setIsHovered] = React.useState(false);
    const [entryDirection, setEntryDirection] = React.useState<EntryDirection>(null);
    const [autoTraced, setAutoTraced] = React.useState(false);
    const cardRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      if (autoTrace && !autoTraced) {
        const timer = setTimeout(() => {
          setEntryDirection("top");
          setAutoTraced(true);
        }, 100);
        return () => clearTimeout(timer);
      }
    }, [autoTrace, autoTraced]);

    const handleMouseEnter = (e: React.MouseEvent) => {
      if (isMobile) return;
      if (autoTraced) return;
      const element = cardRef.current;
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

    const handleMouseLeave = () => {
      if (autoTraced) return;
      setIsHovered(false);
    };

    const showTrace = autoTraced || isHovered;

    return (
      <Card
        ref={(node) => {
          cardRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        className={cn(
          "relative overflow-hidden transition-colors",
          showTrace ? "border-transparent" : "",
          className
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <div
          className="absolute inset-0 pointer-events-none border border-black rounded-lg"
          style={{
            clipPath: getClipPath(entryDirection, showTrace),
            transition: "clip-path 0.2s ease-out",
          }}
        />
        {children}
      </Card>
    );
  }
);

TraceCard.displayName = "TraceCard";

export { TraceCard };
