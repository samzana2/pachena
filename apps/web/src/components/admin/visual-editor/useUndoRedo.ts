"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export interface FormSnapshot {
  sections: unknown[];
  fields: unknown[];
  ratingCategories: unknown[];
  standardBenefits: unknown[];
}

interface UndoRedoState {
  past: FormSnapshot[];
  present: FormSnapshot;
  future: FormSnapshot[];
}

const MAX_HISTORY_SIZE = 50;

export function useUndoRedo(initialState: FormSnapshot) {
  const [state, setState] = useState<UndoRedoState>({
    past: [],
    present: initialState,
    future: [],
  });

  const isInitialized = useRef(false);

  // Update present state when initial data loads
  useEffect(() => {
    if (!isInitialized.current && (initialState.sections.length > 0 || initialState.fields.length > 0)) {
      setState({
        past: [],
        present: initialState,
        future: [],
      });
      isInitialized.current = true;
    }
  }, [initialState]);

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  const pushState = useCallback((newPresent: FormSnapshot) => {
    setState((prev) => {
      // Don't push if the state hasn't actually changed
      if (JSON.stringify(prev.present) === JSON.stringify(newPresent)) {
        return prev;
      }

      const newPast = [...prev.past, prev.present].slice(-MAX_HISTORY_SIZE);
      return {
        past: newPast,
        present: newPresent,
        future: [], // Clear future on new action
      };
    });
  }, []);

  const undo = useCallback(() => {
    setState((prev) => {
      if (prev.past.length === 0) return prev;

      const newPast = prev.past.slice(0, -1);
      const previousState = prev.past[prev.past.length - 1];

      return {
        past: newPast,
        present: previousState,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState((prev) => {
      if (prev.future.length === 0) return prev;

      const nextState = prev.future[0];
      const newFuture = prev.future.slice(1);

      return {
        past: [...prev.past, prev.present],
        present: nextState,
        future: newFuture,
      };
    });
  }, []);

  const reset = useCallback((newState: FormSnapshot) => {
    setState({
      past: [],
      present: newState,
      future: [],
    });
  }, []);

  return {
    state: state.present,
    canUndo,
    canRedo,
    undo,
    redo,
    pushState,
    reset,
    historyLength: state.past.length,
    futureLength: state.future.length,
  };
}
