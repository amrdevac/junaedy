"use client";

import { DiaryEntry, MentionReference } from "@/types/diary";
import { cn } from "@/lib/utils";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Loader2, Search } from "lucide-react";
import { useDiaryFeed } from "@/hooks/diary/useDiaryFeed";
import { useDiaryDashboardStore } from "@/store/diaryDashboardStore";
import { useDiaryEntries } from "@/hooks/diary/useDiaryEntries";
import { useCallback, useMemo } from "react";

export default function DiaryFeed() {
  const diaryDashboardStore = useDiaryDashboardStore();
  const diaryEntries = useDiaryEntries(diaryDashboardStore.search);

  const getRangeIds = useCallback(
    (fromId: number, toId: number) => {
      const startIndex = diaryEntries.entries.findIndex((entry) => entry.id === fromId);
      const endIndex = diaryEntries.entries.findIndex((entry) => entry.id === toId);
      if (startIndex === -1 || endIndex === -1) return [toId];
      const [start, end] = startIndex < endIndex ? [startIndex, endIndex] : [endIndex, startIndex];
      return diaryEntries.entries.slice(start, end + 1).map((entry) => entry.id);
    },
    [diaryEntries.entries]
  );

  const handleSelectEntry = useCallback(
    (id: number | null, options?: { extend?: boolean }) => {
      if (id === null) {
        diaryDashboardStore.setActiveEntry(null);
        diaryDashboardStore.setSelectionAnchor(null);
        diaryDashboardStore.setSelectedEntryIds([]);
        return;
      }
      if (options?.extend) {
        const anchor = diaryDashboardStore.selectionAnchorId ?? diaryDashboardStore.activeEntryId ?? id;
        const range = getRangeIds(anchor, id);
        diaryDashboardStore.setSelectedEntryIds(range);
        diaryDashboardStore.setActiveEntry(id);
        if (!diaryDashboardStore.selectionAnchorId) {
          diaryDashboardStore.setSelectionAnchor(anchor);
        }
        return;
      }
      diaryDashboardStore.setActiveEntry(id);
      diaryDashboardStore.setSelectionAnchor(id);
      diaryDashboardStore.setSelectedEntryIds([id]);
    },
    [
      diaryDashboardStore,
      getRangeIds,
    ]
  );

  const handleAddMention = useCallback(
    (entry: DiaryEntry) => {
      diaryDashboardStore.addMention({
        id: entry.id,
        preview: entry.content.slice(0, 200),
        createdAt: entry.createdAt,
      });
    },
    [diaryDashboardStore]
  );

  const diaryFeed = useDiaryFeed({
    entries: diaryEntries.entries,
    loading: diaryEntries.loading,
    loadingMore: diaryEntries.loadingMore,
    error: diaryEntries.error,
    onRetry: diaryEntries.refresh,
    searchValue: diaryDashboardStore.search,
    onSearchChange: diaryDashboardStore.setSearch,
    activeEntryId: diaryDashboardStore.activeEntryId,
    selectedEntryIds: diaryDashboardStore.selectedEntryIds,
    onSelectEntry: handleSelectEntry,
    deleteError: diaryDashboardStore.deleteError,
    onMentionEntry: handleAddMention,
    hasMore: diaryEntries.hasMore,
    onLoadMore: diaryEntries.loadMore,
    onJumpToMention: diaryDashboardStore.setSearch,
  });

  return (
    <section ref={diaryFeed.feedRef} className="diary-surface rounded-3xl border p-6 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <p className="diary-label">Timeline</p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2" ref={diaryFeed.searchContainerRef}>
          <div className="relative">
            <Input
              ref={diaryFeed.searchRef}
              value={diaryDashboardStore.search}
              onChange={(event) => diaryDashboardStore.setSearch(event.target.value)}
              onFocus={() => diaryFeed.setTimelineFocused(false)}
              placeholder="Cari catatan (Ctrl + /)"
              className="diary-search-input  w-48 rounded-xl  focus:border-0 focus:ring-1 pr-10 text-sm sm:w-64"
              aria-label="Cari catatan di timeline"
            />
            {!diaryEntries.loading ? (
              <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 diary-search-icon" />
            ) : (
              <Loader2 className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin diary-loader" />
            )}
          </div>
        </div>
      </div>
      {diaryDashboardStore.deleteError && (
        <p className="diary-error-text mt-2 text-sm">{diaryDashboardStore.deleteError}</p>
      )}

      <div ref={diaryFeed.timelineRef} className="mt-6 flex flex-col space-y-4" id="timeline-scroll">
        {diaryEntries.loading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="diary-skeleton h-24 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        )}

        {diaryEntries.error && (
          <div className="diary-error-panel rounded-2xl border p-4 text-sm">
            <p>{diaryEntries.error}</p>
            <Button variant="ghost" size="sm" className="mt-2 px-2" onClick={diaryEntries.refresh}>
              Coba lagi
            </Button>
          </div>
        )}

        {diaryFeed.showEmpty && (
          <div className="flex flex-1 items-center justify-center">
            <div className="diary-empty-panel rounded-2xl border border-dashed p-6 text-center">
              <p className="diary-empty-text">Belum ada apa-apa di sini. Tulis sesuatu dulu.</p>
            </div>
          </div>
        )}

        {!diaryEntries.error && !diaryEntries.loading &&
          diaryEntries.entries.map((entry, index) => (
            <DiaryCard
              key={entry.content.replaceAll(" ","") + index + "_baru"}
              entry={entry}
              blurEnabled={diaryFeed.diarySession.blurSettings.feedBlurEnabled}
              selected={diaryDashboardStore.selectedEntryIds.includes(entry.id)}
              active={diaryFeed.timelineFocused && entry.id === diaryDashboardStore.activeEntryId}
              showBlur={diaryFeed.shouldBlurEntry(entry.id)}
              onSelect={(extend) => diaryFeed.handleSelectEntry(entry.id, { extend })}
              onMention={() => handleAddMention(entry)}
              onJumpToMention={diaryFeed.handleJumpToMention}
              innerRef={diaryFeed.registerEntryRef(entry.id)}
            />
          ))}
        <div ref={diaryFeed.loadMoreRef} className="flex justify-center py-4">
          {diaryEntries.loadingMore && <Loader2 className="diary-loader size-5 animate-spin" />}
          {!diaryEntries.loading && !diaryEntries.loadingMore && diaryEntries.hasMore && (
            <button
              type="button"
              onClick={diaryEntries.loadMore}
              className="diary-link text-xs"
            >
              Muat lagi
            </button>
          )}
          {!diaryEntries.hasMore && !diaryEntries.loading && diaryEntries.entries.length > 0 && (
            <span className="diary-text-muted text-xs">Sudah sampai akhir</span>
          )}
        </div>
      </div>
    </section>
  );
}

interface DiaryCardProps {
  entry: DiaryEntry;
  blurEnabled: boolean;
  selected: boolean;
  active: boolean;
  showBlur: boolean;
  onSelect: (extend: boolean) => void;
  onMention: () => void;
  onJumpToMention: (mention: MentionReference) => void;
  innerRef?: (node: HTMLDivElement | null) => void;
}

function DiaryCard({
  entry,
  blurEnabled,
  selected,
  active,
  showBlur,
  onSelect,
  onMention,
  onJumpToMention,
  innerRef,
}: DiaryCardProps) {
  const timestamp = useMemo(() => formatTimeAgo(entry.createdAt), [entry.createdAt]);
  const shouldBlur = blurEnabled && showBlur;

  return (
    <article
      ref={innerRef}
      onClick={(event) => onSelect(event.shiftKey)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(event.shiftKey);
        }
      }}
      className={cn(
        "group relative rounded-2xl border diary-card p-5 shadow-sm transition hover:shadow-md focus:outline-none",
        selected && "ring-2 diary-card-selected",
        active && "ring-2 diary-card-active"
      )}
      aria-pressed={selected}
    >
      <div className="diary-card-label mb-3 flex items-center justify-between text-xs uppercase tracking-widest">
        <span>{timestamp}</span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              onMention();
            }}
            className="h-auto rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.3em]"
          >
            Mention
          </Button>
        </div>
      </div>
      {entry.mentions?.length ? (
        <div
          className={cn(
            "diary-mention-block mb-3 space-y-2 rounded-2xl border p-3 transition",
            shouldBlur && "blur-sm group-hover:blur-none"
          )}
        >
          {entry.mentions.map((mention) => (
            <div key={`${entry.id}-mention-${mention.id}`}>
              <p className="diary-mention-label text-[11px] uppercase tracking-[0.3em]">
                Menyambung {formatTimeAgo(mention.createdAt)}
              </p>
              <p className="diary-mention-text">{mention.preview}</p>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onJumpToMention(mention);
                }}
                className="diary-mention-link mt-2 text-xs font-medium"
              >
                Lihat di timeline
              </button>
            </div>
          ))}
        </div>
      ) : null}
      <div className="relative">
        <p
          className={cn(
            "diary-entry-text whitespace-pre-wrap break-all leading-relaxed transition",
            shouldBlur && "blur-md hover:blur-none group-hover:blur-none"
          )}
        >
          {entry.content}
        </p>
      </div>
    </article>
  );
}

function formatTimeAgo(dateString: string) {
  const parsed = new Date(`${dateString}Z`);
  const now = new Date();
  const diff = parsed.getTime() - now.getTime();
  const minutes = Math.round(diff / 60000);

  if (Math.abs(minutes) < 1) return "baru saja";
  if (Math.abs(minutes) < 60) {
    return `${Math.abs(minutes)} menit lalu`;
  }

  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) {
    return `${Math.abs(hours)} jam lalu`;
  }
  const days = Math.round(hours / 24);
  return `${Math.abs(days)} hari lalu`;
}
