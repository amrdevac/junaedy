"use client";

import { useDiarySession } from "@/components/providers/DiarySessionProvider";
import { createShortcutHandler } from "@/lib/keyboard";
import { DiaryEntry, MentionReference } from "@/types/diary";
import { useDeleteConfirmStore } from "@/store/deleteConfirmStore";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface UseDiaryFeedParams {
  entries: DiaryEntry[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  onRetry: () => void;
  searchValue: string;
  onSearchChange: (next: string) => void;
  activeEntryId: number | null;
  selectedEntryIds: number[];
  onSelectEntry: (id: number | null, options?: { extend?: boolean }) => void;
  deleteError: string | null;
  onMentionEntry: (entry: DiaryEntry) => void;
  hasMore: boolean;
  onLoadMore: () => void;
  onJumpToMention?: (query: string) => void;
}

export function useDiaryFeed(params: UseDiaryFeedParams) {
  const entries = params.entries;
  const loading = params.loading;
  const loadingMore = params.loadingMore;
  const error = params.error;
  const searchValue = params.searchValue;
  const onSearchChange = params.onSearchChange;
  const activeEntryId = params.activeEntryId;
  const selectedEntryIds = params.selectedEntryIds;
  const onSelectEntry = params.onSelectEntry;
  const onMentionEntry = params.onMentionEntry;
  const hasMore = params.hasMore;
  const onLoadMore = params.onLoadMore;
  const onJumpToMention = params.onJumpToMention;
  const diarySession = useDiarySession();
  const deleteConfirmStore = useDeleteConfirmStore();
  const searchRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const feedRef = useRef<HTMLElement>(null);
  const entryRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const revealSetRef = useRef<Set<number>>(new Set());
  const [, forceRevealUpdate] = useState(0);
  const [timelineFocused, setTimelineFocused] = useState(false);
  const hasSearchedRef = useRef(false);

  const registerEntryRef = useCallback(
    (id: number) => (node: HTMLDivElement | null) => {
      if (node) {
        entryRefs.current.set(id, node);
      } else {
        entryRefs.current.delete(id);
      }
    },
    []
  );

  const handleSelectEntry = useCallback(
    (id: number | null, options?: { extend?: boolean }) => {
      setTimelineFocused(true);
      onSelectEntry(id, options);
    },
    [onSelectEntry]
  );

  const handleJumpToMention = useCallback(
    (mention: MentionReference) => {
      const mentionPreview = mention.preview;
      onSearchChange(mentionPreview);
      onJumpToMention?.(mentionPreview);
      setTimelineFocused(false);
      requestAnimationFrame(() => searchRef.current?.focus());
    },
    [onSearchChange, onJumpToMention]
  );

  const handleShortcutFocus = useCallback(() => {
    searchContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    requestAnimationFrame(() => {
      searchRef.current?.focus();
      searchRef.current?.select();
    });
  }, []);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "/") {
        event.preventDefault();
        handleShortcutFocus();
        return;
      }
      if (event.key === "Escape" && document.activeElement === searchRef.current) {
        event.preventDefault();
        searchRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [handleShortcutFocus]);

  useEffect(() => {
    const handleArrowNav = (event: KeyboardEvent) => {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      if (deleteConfirmStore.open) return;
      const target = event.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName.toLowerCase();
        if (tagName === "input" || tagName === "textarea" || target.isContentEditable) {
          return;
        }
      }
      if (!entries.length) return;
      event.preventDefault();
      const currentIndex = activeEntryId ? entries.findIndex((entry) => entry.id === activeEntryId) : -1;
      if (event.key === "ArrowDown") {
        const next = entries[Math.min(currentIndex + 1, entries.length - 1)];
        const targetId = next?.id ?? entries[entries.length - 1].id;
        handleSelectEntry(targetId, { extend: event.shiftKey });
      } else {
        const prevIndex = currentIndex === -1 ? entries.length - 1 : Math.max(currentIndex - 1, 0);
        const targetId = entries[prevIndex].id;
        handleSelectEntry(targetId, { extend: event.shiftKey });
      }
    };
    window.addEventListener("keydown", handleArrowNav);
    return () => window.removeEventListener("keydown", handleArrowNav);
  }, [deleteConfirmStore.open, entries, handleSelectEntry, activeEntryId]);

  useEffect(() => {
    const handleDeleteKey = (event: KeyboardEvent) => {
      if (event.key !== "Delete") return;
      if (deleteConfirmStore.open) return;
      const target = event.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName.toLowerCase();
        if (tag === "input" || tag === "textarea" || target.isContentEditable) {
          return;
        }
      }
      if (!selectedEntryIds.length) return;
      event.preventDefault();
      deleteConfirmStore.openConfirm(
        selectedEntryIds,
        selectedEntryIds.length > 1
          ? `${selectedEntryIds.length} catatan akan hilang permanen dari timeline.`
          : "Catatan akan hilang permanen dari timeline."
      );
    };
    window.addEventListener("keydown", handleDeleteKey);
    return () => window.removeEventListener("keydown", handleDeleteKey);
  }, [deleteConfirmStore, selectedEntryIds]);

  useEffect(() => {
    const handleEscapeClear = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (!timelineFocused) return;
      event.preventDefault();
      onSelectEntry(null);
      setTimelineFocused(false);
      if (revealSetRef.current.size) {
        revealSetRef.current.clear();
        forceRevealUpdate((prev) => prev + 1);
      }
    };
    window.addEventListener("keydown", handleEscapeClear);
    return () => window.removeEventListener("keydown", handleEscapeClear);
  }, [timelineFocused, onSelectEntry]);

  useEffect(() => {
    if (revealSetRef.current.size) {
      revealSetRef.current.clear();
      forceRevealUpdate((prev) => prev + 1);
    }
  }, [activeEntryId]);

  useEffect(() => {
    const handleHoldReveal = (event: KeyboardEvent) => {
      if (!timelineFocused) return;
      const target = event.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName.toLowerCase();
        if (tagName === "input" || tagName === "textarea" || target.isContentEditable) {
          return;
        }
      }
      if (event.ctrlKey && event.altKey && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (activeEntryId != null && !revealSetRef.current.has(activeEntryId)) {
          revealSetRef.current.add(activeEntryId);
          forceRevealUpdate((prev) => prev + 1);
        }
      }
    };
    const releaseShortcut = createShortcutHandler([
      {
        combo: "s",
        allowExtraModifiers: true,
        preventDefault: false,
        when: () => revealSetRef.current.size > 0,
        handler: () => {
          revealSetRef.current.clear();
          forceRevealUpdate((prev) => prev + 1);
        },
      },
    ]);
    window.addEventListener("keydown", handleHoldReveal);
    window.addEventListener("keyup", releaseShortcut);
    return () => {
      window.removeEventListener("keydown", handleHoldReveal);
      window.removeEventListener("keyup", releaseShortcut);
    };
  }, [activeEntryId, timelineFocused]);

  useEffect(() => {
    const handleMentionShortcut = (event: KeyboardEvent) => {
      if (!timelineFocused) return;
      const entry = entries.find((item) => item.id === activeEntryId);
      if (!entry) return;
      if (event.ctrlKey && event.altKey && event.key.toLowerCase() === "m") {
        event.preventDefault();
        onMentionEntry(entry);
        const composeSection = document.querySelector("[data-section='compose']");
        const textarea = document.querySelector("[data-id='diary-composer-textarea']") as HTMLTextAreaElement | null;
        if (composeSection) {
          composeSection.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        requestAnimationFrame(() => textarea?.focus());
      }
      if (event.ctrlKey && event.altKey && event.key.toLowerCase() === "g") {
        if (!entry.mentions?.length) return;
        event.preventDefault();
        handleJumpToMention(entry.mentions[0]);
      }
    };
    window.addEventListener("keydown", handleMentionShortcut);
    return () => window.removeEventListener("keydown", handleMentionShortcut);
  }, [timelineFocused, entries, activeEntryId, onMentionEntry, handleJumpToMention]);

  useEffect(() => {
    const handleFocusChange = (event: FocusEvent) => {
      if (!feedRef.current) return;
      const inside = feedRef.current.contains(event.target as Node);
      setTimelineFocused(inside);
      if (!inside && revealSetRef.current.size) {
        revealSetRef.current.clear();
        forceRevealUpdate((prev) => prev + 1);
      }
    };
    window.addEventListener("focusin", handleFocusChange, true);
    return () => window.removeEventListener("focusin", handleFocusChange, true);
  }, []);

  useEffect(() => {
    if (searchValue.trim().length > 0) {
      hasSearchedRef.current = true;
    }
  }, [searchValue]);

  useEffect(() => {
    if (!hasSearchedRef.current) return;
    if (loading && timelineRef.current) {
      timelineRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [loading]);

  useEffect(() => {
    if (activeEntryId == null) return;
    const node = entryRefs.current.get(activeEntryId);
    if (node) {
      node.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [activeEntryId]);

  const showEmpty = useMemo(
    () => !loading && !error && entries.length === 0,
    [loading, error, entries.length]
  );

  useEffect(() => {
    if (!hasMore) return;
    const target = loadMoreRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      (entriesObs) => {
        const entry = entriesObs[0];
        if (entry.isIntersecting && !loading && !loadingMore) {
          onLoadMore();
        }
      },
      { root: timelineRef.current, threshold: 0.2 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, onLoadMore]);

  const shouldBlurEntry = useCallback(
    (entryId: number) => !revealSetRef.current.has(entryId),
    []
  );

  return {
    diarySession,
    searchRef,
    searchContainerRef,
    timelineRef,
    feedRef,
    loadMoreRef,
    registerEntryRef,
    handleSelectEntry,
    handleJumpToMention,
    shouldBlurEntry,
    timelineFocused,
    setTimelineFocused,
    showEmpty,
  };
}
