"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
const supabase = createBrowserSupabaseClient();

interface DictationButtonProps {
  value: string;
  onChange: (newValue: string) => void;
  fieldName?: string;
}

function AudioWaveform() {
  const BAR_COUNT = 12;
  const [levels, setLevels] = useState<number[]>(Array(BAR_COUNT).fill(2));
  const animFrameRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function startAnalyser() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        const ctx = new AudioContext();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.6;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        function tick() {
          if (cancelled) return;
          analyser.getByteFrequencyData(dataArray);
          const newLevels: number[] = [];
          const step = Math.floor(analyser.frequencyBinCount / BAR_COUNT);
          for (let i = 0; i < BAR_COUNT; i++) {
            const val = dataArray[i * step] ?? 0;
            // Map 0-255 → 2-28px with a curve for drama
            const normalized = val / 255;
            const curved = Math.pow(normalized, 0.7);
            newLevels.push(2 + curved * 26);
          }
          setLevels(newLevels);
          animFrameRef.current = requestAnimationFrame(tick);
        }
        tick();
      } catch {
        // Mic access denied
      }
    }

    startAnalyser();

    return () => {
      cancelled = true;
      cancelAnimationFrame(animFrameRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  return (
    <div className="flex items-end justify-center gap-[2px] h-7">
      {levels.map((h, i) => (
        <span
          key={i}
          className="w-[2.5px] rounded-full bg-primary transition-[height] duration-[50ms] ease-out"
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
  );
}

export function DictationButton({ value, onChange, fieldName = "review" }: DictationButtonProps) {
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const wasListeningRef = useRef(false);
  const [isPolishing, setIsPolishing] = useState(false);

  useEffect(() => { valueRef.current = value; }, [value]);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  const handleTranscript = useCallback(
    (text: string) => {
      const current = valueRef.current;
      const updated = current + (current && !current.endsWith(" ") ? " " : "") + text;
      onChangeRef.current(updated);
    },
    [],
  );

  const { isListening, isSupported, toggle } = useSpeechToText(handleTranscript);

  // Auto-polish when dictation stops
  useEffect(() => {
    if (wasListeningRef.current && !isListening) {
      const text = valueRef.current.trim();
      if (text.length >= 15) {
        setIsPolishing(true);
        supabase.functions.invoke("polish-review-text", {
          body: { text, fieldName },
        }).then(({ data, error }) => {
          if (!error && data?.hasChanges && data.corrected) {
            onChangeRef.current(data.corrected);
          }
          setIsPolishing(false);
        }).catch(() => setIsPolishing(false));
      }
    }
    wasListeningRef.current = isListening;
  }, [isListening, fieldName]);

  if (!isSupported) return null;

  return (
    <div className="flex items-center gap-2">
      {isPolishing && (
        <span className="flex items-center gap-1 text-xs text-muted-foreground animate-in fade-in duration-200">
          <Loader2 className="h-3 w-3 animate-spin" />
          Polishing...
        </span>
      )}
      {isListening && !isPolishing && <AudioWaveform />}
      <Button
        type="button"
        variant={isListening ? "default" : "ghost"}
        size="icon"
        onClick={toggle}
        className={cn(
          "h-8 w-8 rounded-full flex-shrink-0 transition-all duration-200",
          isListening && "bg-primary text-primary-foreground shadow-md",
        )}
        title={isListening ? "Stop dictation" : "Start voice dictation"}
        noTrace
      >
        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      </Button>
    </div>
  );
}
