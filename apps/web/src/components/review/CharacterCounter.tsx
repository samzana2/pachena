import { cn } from "@/lib/utils";

interface CharacterCounterProps {
  current: number;
  max: number;
  min?: number;
  className?: string;
}

/**
 * Character counter with polite prompt when below minimum.
 * Always displays in muted gray color.
 */
export function CharacterCounter({ current, max, min = 0, className }: CharacterCounterProps) {
  const isBelowMin = min > 0 && current < min;
  const charsNeeded = min - current;

  return (
    <p className={cn("text-xs text-right text-muted-foreground", className)}>
      {current}/{max}
      {isBelowMin && ` (please add ${charsNeeded} more)`}
    </p>
  );
}