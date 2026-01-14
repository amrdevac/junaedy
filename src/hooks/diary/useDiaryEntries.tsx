"use client";

import { useDiarySession } from "@/components/providers/DiarySessionProvider";
import { DiaryEntry } from "@/types/diary";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

const PAGE_SIZE = 10;

interface DiaryQueryData {
  entries: DiaryEntry[];
  nextCursor: number | null;
}

async function fetchDiaryEntries({
  search,
  cursor,
  signal,
}: {
  search: string;
  cursor?: number | null;
  signal?: AbortSignal;
}): Promise<DiaryQueryData> {
  const params = new URLSearchParams();
  params.set("limit", String(PAGE_SIZE));
  if (search) params.set("q", search);
  if (cursor != null) params.set("cursor", String(cursor));

  const res = await fetch(`/api/diary?${params.toString()}`, { cache: "no-store", signal });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data) {
    throw new Error(data?.error || "Tidak bisa memuat diary.");
  }
  return {
    entries: Array.isArray(data.entries) ? data.entries : [],
    nextCursor: typeof data.nextCursor === "number" ? data.nextCursor : null,
  };
}

export function useDiaryEntries(searchQuery = "") {
  const diarySession = useDiarySession();
  const queryClient = useQueryClient();
  const normalizedSearch = useMemo(() => searchQuery.trim().toLowerCase(), [searchQuery]);

  const diaryQuery = useQuery({
    queryKey: ["diaryEntries", normalizedSearch],
    queryFn: ({ signal }) => {
      if (diarySession.status !== "ready" || !diarySession.mode) {
        return Promise.resolve({ entries: [], nextCursor: null });
      }
      return fetchDiaryEntries({ search: normalizedSearch, signal });
    },
    staleTime: 30_000,
  });

  const appendEntry = (entry: DiaryEntry) => {
    queryClient.setQueryData<DiaryQueryData>(["diaryEntries", normalizedSearch], (current) => {
      if (!current) {
        return { entries: [entry], nextCursor: null };
      }
      if (normalizedSearch && !entry.content.toLowerCase().includes(normalizedSearch)) {
        return current;
      }
      if (current.entries.some((existing) => existing.id === entry.id)) {
        return current;
      }
      return { ...current, entries: [entry, ...current.entries] };
    });
  };

  const loadMore = async () => {
    if (diaryQuery.isFetching || !diaryQuery.data?.nextCursor) return;
    const more = await fetchDiaryEntries({ search: normalizedSearch, cursor: diaryQuery.data.nextCursor });
    queryClient.setQueryData<DiaryQueryData>(["diaryEntries", normalizedSearch], (current) => {
      if (!current) return more;
      return {
        entries: [...current.entries, ...more.entries],
        nextCursor: more.nextCursor,
      };
    });
  };

  return {
    entries: diaryQuery.data?.entries ?? [],
    loading: diaryQuery.isLoading,
    loadingMore: false,
    error: diaryQuery.error instanceof Error ? diaryQuery.error.message : null,
    hasMore: Boolean(diaryQuery.data?.nextCursor),
    loadMore,
    refresh: () => queryClient.invalidateQueries({ queryKey: ["diaryEntries", normalizedSearch] }),
    appendEntry,
    removeEntries: (ids: number[]) => {
      queryClient.setQueryData<DiaryQueryData>(["diaryEntries", normalizedSearch], (current) => {
        if (!current) return current;
        return {
          ...current,
          entries: current.entries.filter((entry) => !ids.includes(entry.id)),
        };
      });
    },
  };
}
