import { create } from "zustand";
import { MentionReference } from "@/types/diary";

interface DiaryDashboardState {
  search: string;
  activeEntryId: number | null;
  selectionAnchorId: number | null;
  selectedEntryIds: number[];
  mentionDrafts: MentionReference[];
  deleteError: string | null;
  setSearch: (value: string) => void;
  setActiveEntry: (id: number | null) => void;
  setSelectionAnchor: (id: number | null) => void;
  setSelectedEntryIds: (ids: number[]) => void;
  selectRange: (ids: number[]) => void;
  addMention: (entry: MentionReference) => void;
  removeMention: (id: number) => void;
  clearMentions: () => void;
  setDeleteError: (message: string | null) => void;
}

export const useDiaryDashboardStore = create<DiaryDashboardState>((set) => ({
  search: "",
  activeEntryId: null,
  selectionAnchorId: null,
  selectedEntryIds: [],
  mentionDrafts: [],
  deleteError: null,
  setSearch: (value) => set({ search: value }),
  setActiveEntry: (id) => set({ activeEntryId: id }),
  setSelectionAnchor: (id) => set({ selectionAnchorId: id }),
  setSelectedEntryIds: (ids) => set({ selectedEntryIds: ids }),
  selectRange: (ids) => set({ selectedEntryIds: ids }),
  addMention: (entry) =>
    set((state) =>
      state.mentionDrafts.some((item) => item.id === entry.id)
        ? state
        : { mentionDrafts: [...state.mentionDrafts, entry] }
    ),
  removeMention: (id) =>
    set((state) => ({ mentionDrafts: state.mentionDrafts.filter((mention) => mention.id !== id) })),
  clearMentions: () => set({ mentionDrafts: [] }),
  setDeleteError: (message) => set({ deleteError: message }),
}));
