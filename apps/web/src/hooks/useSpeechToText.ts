"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface SpeechToTextResult {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  start: () => void;
  stop: () => void;
  toggle: () => void;
}

const SpeechRecognitionAPI =
  typeof window !== "undefined"
    ? (window as Window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition ||
      (window as Window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
    : null;

export function useSpeechToText(
  onTranscript: (text: string) => void,
): SpeechToTextResult {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<unknown>(null);
  const onTranscriptRef = useRef(onTranscript);
  const stoppedByUserRef = useRef(false);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  const isSupported = !!SpeechRecognitionAPI;

  const stop = useCallback(() => {
    stoppedByUserRef.current = true;
    if (recognitionRef.current) {
      (recognitionRef.current as { stop: () => void }).stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const start = useCallback(() => {
    if (!SpeechRecognitionAPI) return;

    if (recognitionRef.current) {
      (recognitionRef.current as { stop: () => void }).stop();
    }

    const recognition = new (SpeechRecognitionAPI as new () => { lang: string; continuous: boolean; interimResults: boolean; maxAlternatives: number; onresult: ((e: unknown) => void) | null; onerror: ((e: unknown) => void) | null; onend: (() => void) | null; start: () => void; stop: () => void })();
    recognitionRef.current = recognition;

    recognition.lang = "en-ZW";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let finalTranscript = "";
    stoppedByUserRef.current = false;

    recognition.onresult = (event: unknown) => {
      const e = event as { resultIndex: number; results: { isFinal: boolean; [0]: { transcript: string } }[] };
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        if (result.isFinal) {
          const text = result[0].transcript;
          finalTranscript += text;
          onTranscriptRef.current(text);
        } else {
          interim += result[0].transcript;
        }
      }
      setTranscript(finalTranscript + interim);
    };

    recognition.onerror = (event: unknown) => {
      const e = event as { error: string };
      if (e.error !== "no-speech" && e.error !== "aborted" && e.error !== "network") {
        console.warn("Speech recognition error:", e.error);
        stop();
      }
    };

    recognition.onend = () => {
      if (!stoppedByUserRef.current && recognitionRef.current === recognition) {
        try {
          recognition.start();
        } catch {
          setIsListening(false);
          recognitionRef.current = null;
        }
        return;
      }
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.start();
    setIsListening(true);
    setTranscript("");
  }, [stop]);

  const toggle = useCallback(() => {
    if (isListening) {
      stop();
    } else {
      start();
    }
  }, [isListening, start, stop]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        (recognitionRef.current as { stop: () => void }).stop();
      }
    };
  }, []);

  return { isListening, isSupported, transcript, start, stop, toggle };
}
