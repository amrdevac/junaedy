"use client";
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DiaryEntry } from "@/types/diary";
import { useDiarySession } from "@/components/providers/DiarySessionProvider";

const PAGE_SIZE = 10;

export function useDiaryEntries(searchQuery = "") {
  const diarySession = useDiarySession();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const cursorRef = useRef<number | null>(null);

  const normalizedSearch = useMemo(() => searchQuery.trim().toLowerCase(), [searchQuery]);

  const fetchEntries = useCallback(
    async ({ reset }: { reset?: boolean } = {}) => {
      if (diarySession.status !== "ready" || !diarySession.mode) {
        setEntries([]);
        setHasMore(false);
        cursorRef.current = null;
        return;
      }
      const isReset = Boolean(reset);
      setError(null);
      if (isReset) {
        setLoading(true);
        cursorRef.current = null;
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }
      try {
        const params = new URLSearchParams();
        params.set("limit", String(PAGE_SIZE));
        if (normalizedSearch) {
          params.set("q", normalizedSearch);
        }
        const currentCursor = cursorRef.current;
        if (!isReset) {
          if (currentCursor == null) {
            setLoadingMore(false);
            setHasMore(false);
            return;
          }
          params.set("cursor", String(currentCursor));
        }
        const res = await fetch(`/api/diary?${params.toString()}`, { cache: "no-store" });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data) {
          throw new Error(data?.error || "Tidak bisa memuat diary.");
        }
        const newEntries = Array.isArray(data.entries) ? data.entries : [];
        cursorRef.current = typeof data.nextCursor === "number" ? data.nextCursor : null;
        setHasMore(Boolean(cursorRef.current));
        setEntries((prev) => (isReset ? newEntries : [...prev, ...newEntries]));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Kesalahan tidak terduga.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [diarySession.status, diarySession.mode, normalizedSearch]
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      fetchEntries({ reset: true });
    }, normalizedSearch ? 600 : 0);
    return () => {
      window.clearTimeout(timeout);
    };
  }, [fetchEntries, normalizedSearch]);

  const appendEntry = useCallback(
    (entry: DiaryEntry) => {
      setEntries((prev) => {
        if (normalizedSearch && !entry.content.toLowerCase().includes(normalizedSearch)) {
          return prev;
        }
        if (prev.some((existing) => existing.id === entry.id)) {
          return prev;
        }
        return [entry, ...prev];
      });
    },
    [normalizedSearch]
  );

  return {
    entries,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore: () => fetchEntries({ reset: false }),
    refresh: () => fetchEntries({ reset: true }),
    appendEntry,
  };
}
