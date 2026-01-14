import { useDiaryDashboardStore } from "@/store/diaryDashboardStore";
import { useToast } from "@/ui/use-toast";
import { useCallback } from "react";
import { useDiaryEntries } from "./useDiaryEntries";

export function useDiaryDeletion() {
  const diaryDashboardStore = useDiaryDashboardStore();
  const diaryEntries = useDiaryEntries(diaryDashboardStore.search);
  const toastApi = useToast();

  const deleteEntries = useCallback(
    async (ids: number[]) => {
      if (!ids.length) return;
      diaryDashboardStore.setDeleteError(null);
      try {
        await Promise.all(
          ids.map(async (id) => {
            const res = await fetch("/api/diary", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id }),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok || !data?.success) {
              throw new Error(data?.error || "Gagal menghapus catatan.");
            }
          })
        );
        diaryEntries.removeEntries(ids);
        toastApi.toast({
          title: ids.length > 1 ? "Catatan terhapus" : "Catatan terhapus",
          description:
            ids.length > 1 ? `${ids.length} catatan berhasil dihapus.` : "Entri berhasil dihapus dari timeline.",
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Gagal menghapus catatan.";
        diaryDashboardStore.setDeleteError(message);
        toastApi.toast({
          title: "Gagal menghapus",
          description: message,
          variant: "destructive",
        });
        throw err;
      }
    },
    [diaryDashboardStore, diaryEntries, toastApi]
  );

  return deleteEntries;
}
