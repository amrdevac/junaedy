"use client";

import { useDiarySession } from "@/components/providers/DiarySessionProvider";
import { createShortcutHandler } from "@/lib/keyboard";
import { useCallback, useEffect, useMemo, useState } from "react";

interface ShortcutMeta {
  title: string;
  description: string;
  combo: string;
}

export function useDiaryControlPanel(shortcuts: readonly ShortcutMeta[]) {
  const diarySession = useDiarySession();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [shortcutQuery, setShortcutQuery] = useState("");

  const filteredShortcuts = useMemo(() => {
    const query = shortcutQuery.trim().toLowerCase();
    if (!query) return shortcuts;
    return shortcuts.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.combo.toLowerCase().includes(query)
    );
  }, [shortcutQuery, shortcuts]);

  const toggleBlurSetting = useCallback(
    (field: "composeBlur" | "feedBlurEnabled") => {
      diarySession.updateBlurSettings((prev) => ({
        ...prev,
        [field]: !prev[field],
      }));
    },
    [diarySession.updateBlurSettings]
  );

  const shortcutHandler = useMemo(
    () =>
      createShortcutHandler([
        {
          combo: "ctrl+alt+k",
          handler: () => setShortcutsOpen(true),
        },
        {
          combo: "ctrl+alt+c",
          handler: () => toggleBlurSetting("composeBlur"),
        },
        {
          combo: "ctrl+alt+t",
          handler: () => toggleBlurSetting("feedBlurEnabled"),
        },
      ]),
    [toggleBlurSetting]
  );

  useEffect(() => {
    window.addEventListener("keydown", shortcutHandler);
    return () => window.removeEventListener("keydown", shortcutHandler);
  }, [shortcutHandler]);

  const handleQueryChange = useCallback((value: string) => {
    setShortcutQuery(value);
  }, []);

  return {
    shortcutsOpen,
    setShortcutsOpen,
    shortcutQuery,
    handleQueryChange,
    filteredShortcuts,
    toggleComposeBlur: () => toggleBlurSetting("composeBlur"),
    toggleFeedBlur: () => toggleBlurSetting("feedBlurEnabled"),
    diarySession,
  };
}
