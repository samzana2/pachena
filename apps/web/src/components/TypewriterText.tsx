"use client";

import { useState, useEffect, useCallback } from "react";

interface TypewriterTextProps {
  phrases: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  pauseBeforeDelete?: number;
  className?: string;
}

const TypewriterText = ({
  phrases,
  typingSpeed = 80,
  deletingSpeed = 40,
  pauseDuration = 500,
  pauseBeforeDelete = 2500,
  className = "",
}: TypewriterTextProps) => {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const currentPhrase = phrases[currentPhraseIndex];

  const tick = useCallback(() => {
    if (isPaused) return;

    if (!isDeleting) {
      // Typing
      if (displayedText.length < currentPhrase.length) {
        setDisplayedText(currentPhrase.slice(0, displayedText.length + 1));
      } else {
        // Finished typing, pause before deleting
        setIsPaused(true);
        setTimeout(() => {
          setIsPaused(false);
          setIsDeleting(true);
        }, pauseBeforeDelete);
      }
    } else {
      // Deleting
      if (displayedText.length > 0) {
        setDisplayedText(displayedText.slice(0, -1));
      } else {
        // Finished deleting, move to next phrase
        setIsDeleting(false);
        setIsPaused(true);
        setTimeout(() => {
          setIsPaused(false);
          setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
        }, pauseDuration);
      }
    }
  }, [displayedText, isDeleting, isPaused, currentPhrase, phrases.length, pauseBeforeDelete, pauseDuration]);

  useEffect(() => {
    const speed = isDeleting ? deletingSpeed : typingSpeed;
    const timer = setTimeout(tick, speed);
    return () => clearTimeout(timer);
  }, [tick, isDeleting, deletingSpeed, typingSpeed]);

  return (
    <span className={className}>
      {displayedText}
      <span className="animate-pulse">|</span>
    </span>
  );
};

export default TypewriterText;
