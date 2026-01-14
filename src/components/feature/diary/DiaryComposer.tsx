"use client";

import { cn } from "@/lib/utils";
import { Textarea } from "@/ui/textarea";
import { Button } from "@/ui/button";
import { useDiaryComposer } from "@/hooks/diary/useDiaryComposer";
import { createShortcutHandler } from "@/lib/keyboard";
import { useEffect, useMemo } from "react";
import { useDiaryDashboardStore } from "@/store/diaryDashboardStore";
import { useDiaryEntries } from "@/hooks/diary/useDiaryEntries";

export default function DiaryComposer() {
  const diaryDashboardStore = useDiaryDashboardStore();
  const diaryEntries = useDiaryEntries(diaryDashboardStore.search);
  const diaryComposer = useDiaryComposer({
    onPosted: (entry) => {
      diaryEntries.appendEntry(entry);
      diaryDashboardStore.clearMentions();
    },
    mentions: diaryDashboardStore.mentionDrafts,
  });
  const textareaRef = diaryComposer.textareaRef;

  const isTextareaFocused = () => document.activeElement === textareaRef.current;

  const handleKeyDown = useMemo(
    () =>
      createShortcutHandler([
        {
          combo: "escape",
          when: () => isTextareaFocused(),
          handler: () => {
            diaryComposer.setHoldReveal(false);
            textareaRef.current?.blur();
          },
        },
        {
          combo: "ctrl+alt+i",
          handler: () => textareaRef.current?.focus(),
        },
        {
          combo: "ctrl+alt+s",
          when: () => isTextareaFocused(),
          handler: () => diaryComposer.setHoldReveal(true),
        },
        {
          combo: "ctrl+enter",
          when: () => isTextareaFocused(),
          handler: () => diaryComposer.submitDiary(),
        },
      ]),
    [diaryComposer.setHoldReveal, diaryComposer.submitDiary, textareaRef]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleKeyUp = useMemo(() => {
    const releaseHold = () => diaryComposer.setHoldReveal((prev) => (prev ? false : prev));
    const isComposerFocused = () => document.activeElement === textareaRef.current;
    return createShortcutHandler([
      {
        combo: "s",
        allowExtraModifiers: true,
        preventDefault: false,
        when: isComposerFocused,
        handler: releaseHold,
      },
      {
        combo: "ctrl",
        allowExtraModifiers: true,
        preventDefault: false,
        when: isComposerFocused,
        handler: releaseHold,
      },
      {
        combo: "alt",
        allowExtraModifiers: true,
        preventDefault: false,
        when: isComposerFocused,
        handler: releaseHold,
      },
    ]);
  }, [diaryComposer.setHoldReveal, textareaRef]);

  useEffect(() => {
    window.addEventListener("keyup", handleKeyUp);
    return () => window.removeEventListener("keyup", handleKeyUp);
  }, [handleKeyUp]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    diaryComposer.submitDiary();
  };

  return (
    <section
      className="diary-surface rounded-3xl border p-6 shadow-sm backdrop-blur bg-white"
      data-section="compose"
    >
      <div className="mb-4 flex flex-wrap items-center gap-3 justify-between">
        <div>
          <p className="diary-label font-semibold">
            Compose
          </p>
        </div>
        <div>
          {diaryComposer.composeBlurEnabled && (
            <Button
              variant={"outlineDefault"}
              type="button"
              onClick={() => diaryComposer.togglePlainView()}
              className="diary-blur-toggle rounded-full"
            >
              {diaryComposer.showPlain ? "Blur lagi" : "Lihat teks"}
            </Button>
          )}
        </div>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        {diaryDashboardStore.mentionDrafts.length > 0 && (
          <div
            className={cn(
              "diary-mention-block rounded-2xl border p-4 space-y-2 transition-all",
              diaryComposer.shouldBlurContent && "filter blur-[4px] hover:blur-none"
            )}
          >
            <p className="diary-label">Menanggapi</p>
            {diaryDashboardStore.mentionDrafts.map((mention) => (
              <div key={`mention-preview-${mention.id}`} className="diary-mention-preview rounded-xl border p-3">
                <div className="diary-mention-preview-meta flex items-center justify-between">
                  <span>{formatTimeAgo(mention.createdAt)}</span>
                  <button
                    type="button"
                    onClick={() => diaryDashboardStore.removeMention(mention.id)}
                    className="diary-mention-remove"
                  >
                    Hapus
                  </button>
                </div>
                <p className="diary-mention-text">{mention.preview}</p>
              </div>
            ))}
          </div>
        )}
        <div className="relative group">
          <Textarea
            ref={diaryComposer.textareaRef}
            value={diaryComposer.content}
            onChange={(event) => diaryComposer.handleContentChange(event.target.value)}
            data-id="diary-composer-textarea"
            placeholder={diaryComposer.placeholder}
            className={cn(
              "min-h-[150px] resize-none rounded-2xl diary-textarea leading-relaxed shadow-inner border focus-within:ring-0",
              diaryComposer.shouldBlurContent ? "filter blur-[4px] group-hover:blur-none transition-all" : ""
            )}
            disabled={diaryComposer.isPosting}
            onBlur={() => diaryComposer.setHoldReveal(false)}
          />
          
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm diary-text-muted">
          <span className="diary-char-counter font-mono">
            {diaryComposer.remaining} karakter tersisa
          </span>
          {diaryComposer.error && <span className="diary-error-text">{diaryComposer.error}</span>}
          <Button
            type="submit"
            disabled={!diaryComposer.canPost}
            variant="default"
            className="ml-auto rounded-full px-6"
          >
            {diaryComposer.isPosting ? "Menyimpan..." : "Posting"}
          </Button>
        </div>
      </form>
    </section>
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
