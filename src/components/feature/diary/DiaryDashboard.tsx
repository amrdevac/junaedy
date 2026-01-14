"use client";

import DiaryComposer from "./DiaryComposer";
import DiaryFeed from "./DiaryFeed";
import DiaryControlPanel from "./DiaryControlPanel";
import ConfirmModal from "@/components/shared/ConfirmModal";
import { useDeleteConfirmStore } from "@/store/deleteConfirmStore";
import { useDiaryDeletion } from "@/hooks/diary/useDiaryDeletion";
import { useCallback } from "react";

export default function DiaryDashboard() {
  const deleteConfirmStore = useDeleteConfirmStore();
  const deleteEntries = useDiaryDeletion();

  const confirmDelete = useCallback(async () => {
    if (!deleteConfirmStore.entryIds.length) return;
    deleteConfirmStore.setPending(true);
    try {
      await deleteEntries(deleteConfirmStore.entryIds);
      deleteConfirmStore.closeConfirm();
    } catch {
      // error surfaced via deleteError state
    } finally {
      deleteConfirmStore.setPending(false);
    }
  }, [deleteConfirmStore, deleteEntries]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 lg:flex-row">
        <div className="flex-1 space-y-6">
          <Hero />
          <DiaryComposer />
          <DiaryFeed />
        </div>
        <div className="w-full lg:w-[320px]">
          <DiaryControlPanel />
        </div>
      </div>
      <ConfirmModal
        isOpen={deleteConfirmStore.open}
        onCancel={() => {
          if (!deleteConfirmStore.pending) deleteConfirmStore.closeConfirm();
        }}
        onConfirm={confirmDelete}
        title="Hapus catatan ini?"
        message={deleteConfirmStore.message}
        confirmText="Konfirmasi hapus"
        cancelText="Batal"
        autoFocusConfirm
        variant="overlay"
      />
    </div>
  );
}

function Hero() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
      <p className="text-sm uppercase tracking-[0.4em] text-slate-400">
        Private diary
      </p>
    </section>
  );
}
