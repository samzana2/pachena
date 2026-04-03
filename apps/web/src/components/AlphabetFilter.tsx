"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

interface AlphabetFilterProps {
  selectedLetter: string | null;
  onLetterClick: (letter: string | null) => void;
  className?: string;
}

const AlphabetFilter = ({ selectedLetter, onLetterClick, className }: AlphabetFilterProps) => {
  const handleLetterClick = (letter: string) => {
    // Toggle off if clicking the same letter
    if (selectedLetter === letter) {
      onLetterClick(null);
    } else {
      onLetterClick(letter);
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop: Centered flex wrap */}
      <div className="hidden md:flex flex-wrap justify-center gap-1">
        <Button
          variant={selectedLetter === null ? "default" : "ghost"}
          size="sm"
          className="px-3 h-9 text-sm font-medium"
          onClick={() => onLetterClick(null)}
        >
          All
        </Button>
        {ALPHABET.map((letter) => (
          <Button
            key={letter}
            variant={selectedLetter === letter ? "default" : "ghost"}
            size="sm"
            className="w-9 h-9 p-0 text-sm font-medium"
            onClick={() => handleLetterClick(letter)}
          >
            {letter}
          </Button>
        ))}
      </div>

      {/* Mobile: Horizontal scroll */}
      <ScrollArea className="md:hidden w-full whitespace-nowrap">
        <div className="flex gap-1 pb-2">
          <Button
            variant={selectedLetter === null ? "default" : "ghost"}
            size="sm"
            className="px-3 h-10 text-sm font-medium shrink-0"
            onClick={() => onLetterClick(null)}
          >
            All
          </Button>
          {ALPHABET.map((letter) => (
            <Button
              key={letter}
              variant={selectedLetter === letter ? "default" : "ghost"}
              size="sm"
              className="w-10 h-10 p-0 text-sm font-medium shrink-0"
              onClick={() => handleLetterClick(letter)}
            >
              {letter}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default AlphabetFilter;
