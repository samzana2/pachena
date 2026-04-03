"use client";

import { useState, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

interface FeatureFlag {
  id: string;
  flag_key: string;
  flag_label: string;
  description: string | null;
  is_enabled: boolean;
  category: string | null;
}

export const useFeatureFlags = () => {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    const fetchFlags = async () => {
      const { data, error } = await supabase
        .from("feature_flags")
        .select("flag_key, is_enabled");

      if (!error && data) {
        const flagMap: Record<string, boolean> = {};
        data.forEach((flag) => {
          flagMap[flag.flag_key] = flag.is_enabled;
        });
        setFlags(flagMap);
      }
      setLoading(false);
    };

    fetchFlags();
  }, []);

  const isEnabled = (flagKey: string): boolean => {
    return flags[flagKey] ?? false;
  };

  return { flags, loading, isEnabled };
};

export const useFeatureFlagsAdmin = () => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFlags = async () => {
    const supabase = createBrowserSupabaseClient();
    const { data, error } = await supabase
      .from("feature_flags")
      .select("*")
      .order("category", { ascending: true })
      .order("flag_label", { ascending: true });

    if (!error && data) {
      setFlags(data as FeatureFlag[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const toggleFlag = async (id: string, currentValue: boolean) => {
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase
      .from("feature_flags")
      .update({ is_enabled: !currentValue })
      .eq("id", id);

    if (!error) {
      setFlags((prev) =>
        prev.map((flag) =>
          flag.id === id ? { ...flag, is_enabled: !currentValue } : flag
        )
      );
      return true;
    }
    return false;
  };

  return { flags, loading, toggleFlag, refetch: fetchFlags };
};
