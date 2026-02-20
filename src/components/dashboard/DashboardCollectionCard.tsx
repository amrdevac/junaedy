"use client";

import Link from "next/link";
import { MoreVertical, Pencil, Search, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import useDashboardStore from "@/store/useDashboardStore";
import useHanziCollectionSync from "@/hooks/useHanziCollectionSync";
import { deleteHanziRecord, deleteHanziRecords } from "@/lib/indexeddb/hanziCollection";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Input } from "@/ui/input";
import { cn } from "@/lib/utils";
import ConfirmModal from "@/components/shared/ConfirmModal";
import CollectionColumnSelector from "@/components/collection/CollectionColumnSelector";
import CollectionEmptyState from "@/components/collection/CollectionEmptyState";
import CollectionEditModal from "@/components/collection/CollectionEditModal";

type ColumnOption = {
  id: string;
  label: string;
  isChecked: boolean;
  onToggle: () => void;
};

type DashboardCollectionCardProps = {
  limit?: number;
  showViewAll?: boolean;
};

function DashboardCollectionCard(props: DashboardCollectionCardProps) {
  const limit = props.limit;
  const showViewAll = props.showViewAll ?? false;
  const collectionSync = useHanziCollectionSync();
  const initialBatch = 10;
  const loadStep = 10;

  const characters = useDashboardStore((state) => state.characters);
  const totalCharacters = characters.length;
  const itemsToShowState = useState(initialBatch);
  const itemsToShow = itemsToShowState[0];
  const setItemsToShow = itemsToShowState[1];
  const modalState = useState<string | null>(null);
  const deleteTargetId = modalState[0];
  const setDeleteTargetId = modalState[1];
  const editState = useState<string | null>(null);
  const editTargetId = editState[0];
  const setEditTargetId = editState[1];
  const selectionState = useState<string[]>([]);
  const selectedIds = selectionState[0];
  const setSelectedIds = selectionState[1];
  const bulkModalState = useState(false);
  const isBulkModalOpen = bulkModalState[0];
  const setIsBulkModalOpen = bulkModalState[1];
  const showPinyinState = useState(true);
  const showPinyin = showPinyinState[0];
  const setShowPinyin = showPinyinState[1];
  const showMeaningState = useState(true);
  const showMeaning = showMeaningState[0];
  const setShowMeaning = showMeaningState[1];
  const showCharacterState = useState(true);
  const showCharacter = showCharacterState[0];
  const setShowCharacter = showCharacterState[1];
  const showProficiencyState = useState(true);
  const showProficiency = showProficiencyState[0];
  const setShowProficiency = showProficiencyState[1];
  const showLastReviewedState = useState(true);
  const showLastReviewed = showLastReviewedState[0];
  const setShowLastReviewed = showLastReviewedState[1];
  const showActionsState = useState(true);
  const showActions = showActionsState[0];
  const setShowActions = showActionsState[1];
  const searchQueryState = useState("");
  const searchQuery = searchQueryState[0];
  const setSearchQuery = searchQueryState[1];
  const rowMenuState = useState<string | null>(null);
  const openRowMenuId = rowMenuState[0];
  const setOpenRowMenuId = rowMenuState[1];
  const rowMenuRef = useRef<HTMLDivElement | null>(null);
  const selectAllRef = useRef<HTMLInputElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const isLoadingMoreRef = useRef(false);
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredCharacters = !limit && normalizedQuery
    ? characters.filter((item) => {
        if (item.type === "sentence") return false;
        return [item.hanzi, item.pinyin, item.meaning]
          .some((value) => (value || "").toLowerCase().includes(normalizedQuery));
      })
    : characters.filter((item) => item.type !== "sentence");
  const visibleCharacters = limit
    ? filteredCharacters.slice(0, limit)
    : filteredCharacters.slice(0, itemsToShow);
  const visibleCount = visibleCharacters.length;
  const hasMore = !limit && visibleCount < filteredCharacters.length;
  const columnOptions: ColumnOption[] = [
    {
      id: "character",
      label: "Karakter",
      isChecked: showCharacter,
      onToggle: () => setShowCharacter(!showCharacter),
    },
    {
      id: "pinyin",
      label: "Pinyin",
      isChecked: showPinyin,
      onToggle: () => setShowPinyin(!showPinyin),
    },
    {
      id: "meaning",
      label: "Arti",
      isChecked: showMeaning,
      onToggle: () => setShowMeaning(!showMeaning),
    },
  ];

  const handleDelete = async (id: string) => {
    await deleteHanziRecord(id);
    await collectionSync.refresh();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    await handleDelete(deleteTargetId);
    setDeleteTargetId(null);
  };

  const handleBulkDelete = async () => {
    await deleteHanziRecords(selectedIds);
    setSelectedIds([]);
    await collectionSync.refresh();
    setIsBulkModalOpen(false);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(function (prevIds) {
      if (prevIds.includes(id)) {
        return prevIds.filter(function (itemId) {
          return itemId !== id;
        });
      }
      return [...prevIds, id];
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === characters.length) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(characters.map((item) => item.id));
  };

  useEffect(
    function () {
      if (!selectAllRef.current) return;
      const isPartial =
        selectedIds.length > 0 && selectedIds.length < characters.length;
      selectAllRef.current.indeterminate = isPartial;
    },
    [selectedIds, characters.length]
  );

  useEffect(
    function () {
      if (!openRowMenuId) return;

      const handleClickOutside = (event: MouseEvent) => {
        if (!rowMenuRef.current) return;
        if (!rowMenuRef.current.contains(event.target as Node)) {
          setOpenRowMenuId(null);
        }
      };

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          setOpenRowMenuId(null);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleKeyDown);
      };
    },
    [openRowMenuId]
  );

  useEffect(() => {
    if (limit) return;
    setItemsToShow(function (prev) {
      if (totalCharacters === 0) return initialBatch;
      return Math.min(Math.max(prev, initialBatch), totalCharacters);
    });
  }, [limit, totalCharacters, initialBatch]);

  useEffect(() => {
    if (limit) return;
    const node = loadMoreRef.current;
    if (!node) return;

    const handleLoadMore = () => {
      if (!hasMore || isLoadingMoreRef.current) return;
      isLoadingMoreRef.current = true;
      setItemsToShow(function (prev) {
        return Math.min(prev + loadStep, totalCharacters);
      });
      window.setTimeout(() => {
        isLoadingMoreRef.current = false;
      }, 120);
    };

    const observer = new IntersectionObserver(
      function (entries) {
        if (entries[0]?.isIntersecting) {
          handleLoadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [limit, hasMore, loadStep, totalCharacters]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("dashboard-collection-columns");
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      if (typeof parsed.showCharacter === "boolean") setShowCharacter(parsed.showCharacter);
      if (typeof parsed.showPinyin === "boolean") setShowPinyin(parsed.showPinyin);
      if (typeof parsed.showMeaning === "boolean") setShowMeaning(parsed.showMeaning);
      if (typeof parsed.showProficiency === "boolean") setShowProficiency(parsed.showProficiency);
      if (typeof parsed.showLastReviewed === "boolean") setShowLastReviewed(parsed.showLastReviewed);
      if (typeof parsed.showActions === "boolean") setShowActions(parsed.showActions);
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload = {
      showCharacter,
      showPinyin,
      showMeaning,
      showProficiency,
      showLastReviewed,
      showActions,
    };
    localStorage.setItem("dashboard-collection-columns", JSON.stringify(payload));
  }, [showCharacter, showPinyin, showMeaning, showProficiency, showLastReviewed, showActions]);

  return (
    <Card className="overflow-hidden rounded-xl border border-slate-200 bg-base-100 shadow-md">
      <CardHeader className="flex flex-col gap-4 px-6 pb-4  md:flex-row md:items-center md:justify-between">
        <CardTitle className="text-lg font-bold text-base-content">
          Character Collection
        </CardTitle>
        {limit ? (
          <div className="flex flex-wrap items-center gap-2">
            <CollectionColumnSelector options={columnOptions} />
            {showViewAll ? (
              <Button
                variant="outline"
                size="sm"
                className="border-base-300 text-base-content/70 hover:bg-base-200"
                asChild
              >
                <Link href="/collection">Lihat semua</Link>
              </Button>
            ) : null}
          </div>
        ) : (
          <div />
        )}
      </CardHeader>
      <CardContent className="p-0">
        {limit ? (
          <div className="px-6 pb-6 pt-2">
            {characters.length === 0 ? (
              <CollectionEmptyState message="Belum ada koleksi Hanzi. Tambahkan lewat tombol New Hanzi." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {visibleCharacters.map(function (item) {
                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-base-200 bg-base-100 px-4 py-4 shadow-sm transition-colors hover:border-primary/40 text-center"
                    >
                      <div className="flex items-center justify-center">
                        <span className="hanzi-font text-3xl font-semibold text-base-content">
                          {item.hanzi}
                        </span>
                      </div>
                      {showPinyin ? (
                        <p className="mt-2 text-sm font-semibold text-base-content/70">
                          {item.pinyin}
                        </p>
                      ) : null}
                      {showMeaning ? (
                        <p className="mt-1 text-sm text-base-content/60">
                          {item.meaning}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="px-6 pb-6 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-base-300 text-base-content/70 hover:bg-base-200"
                disabled={selectedIds.length === 0}
                onClick={() => setIsBulkModalOpen(true)}
              >
                Hapus Terpilih ({selectedIds.length})
              </Button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-base-content/50" />
                <Input
                  className="w-56 rounded-lg border-slate-200 bg-base-200 pl-9 text-sm focus-visible:ring-2 focus-visible:ring-primary/40"
                  placeholder="Search characters, pinyin, or meaning..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </div>
              <CollectionColumnSelector options={columnOptions} />
            </div>
            {characters.length === 0 ? (
              <CollectionEmptyState
                className="mt-4"
                message="Belum ada koleksi Hanzi. Tambahkan lewat tombol New Hanzi."
              />
            ) : (
              <div className="mt-4 flex flex-col gap-3">
                {visibleCharacters.map(function (item) {
                  return (
                    <div
                      key={item.id}
                      className="group grid grid-cols-1 gap-3 rounded-xl border border-base-200 bg-base-100 px-5 py-4 shadow-sm transition-colors hover:border-primary/40 md:grid-cols-[180px_minmax(220px,1fr)_220px_160px_48px] md:items-center md:gap-6"
                    >
                      {showCharacter ? (
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            className="size-4 rounded border-base-300"
                            checked={selectedIds.includes(item.id)}
                            onChange={() => handleToggleSelect(item.id)}
                            aria-label={`Select ${item.hanzi}`}
                          />
                          <span className="hanzi-font text-3xl font-medium text-base-content transition-colors group-hover:text-primary truncate">
                            {item.hanzi}
                          </span>
                        </div>
                      ) : null}
                      {showPinyin || showMeaning ? (
                        <div className="flex flex-col min-w-0">
                          {showPinyin ? (
                            <span className="text-sm font-semibold text-primary truncate">
                              {item.pinyin}
                            </span>
                          ) : null}
                          {showMeaning ? (
                            <span className="text-sm text-base-content/60 truncate">
                              {item.meaning}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                      {showProficiency ? (
                        <div className="flex flex-col gap-2">
                          <span className="text-[11px] font-semibold uppercase tracking-widest text-base-content/40">
                            Proficiency
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-full max-w-[120px] rounded-full bg-base-200">
                              <span
                                className={cn(
                                  "block h-1.5 rounded-full",
                                  item.proficiencyTone === "success"
                                    ? "bg-success"
                                    : item.proficiencyTone === "warning"
                                      ? "bg-warning"
                                      : "bg-primary"
                                )}
                                style={{ width: item.proficiencyPercent + "%" }}
                              />
                            </div>
                            <span
                              className={cn(
                                "text-xs font-semibold",
                                item.proficiencyTone === "success"
                                  ? "text-success"
                                  : item.proficiencyTone === "warning"
                                    ? "text-warning"
                                    : "text-primary"
                              )}
                            >
                              {item.proficiencyLabel}
                            </span>
                          </div>
                        </div>
                      ) : null}
                      {showLastReviewed ? (
                        <div className="flex flex-col text-xs text-base-content/60">
                          <span className="text-[11px] font-semibold uppercase tracking-widest text-base-content/40">
                            Last Reviewed
                          </span>
                          <span>{item.lastReviewed}</span>
                        </div>
                      ) : null}
                      {showActions ? (
                        <div className="flex md:ml-auto">
                          <div
                            className="relative inline-flex opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100"
                            ref={openRowMenuId === item.id ? rowMenuRef : null}
                          >
                            <button
                              className="rounded-md p-1.5 text-base-content/40 transition-colors hover:text-primary"
                              onClick={() =>
                                setOpenRowMenuId(openRowMenuId === item.id ? null : item.id)
                              }
                              aria-label="Open actions"
                            >
                              <MoreVertical className="size-4" />
                            </button>
                            {openRowMenuId === item.id ? (
                              <div className="absolute right-0 top-full z-10 mt-2 w-36 rounded-lg border border-base-300 bg-base-100 p-2 text-xs text-base-content/70 shadow-lg">
                                <button
                                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-base-200"
                                  onClick={() => {
                                    setOpenRowMenuId(null);
                                    setEditTargetId(item.id);
                                  }}
                                >
                                  <Pencil className="size-3.5" />
                                  Ubah
                                </button>
                                <button
                                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-base-200 hover:text-error"
                                  onClick={() => {
                                    setOpenRowMenuId(null);
                                    setDeleteTargetId(item.id);
                                  }}
                                >
                                  <Trash2 className="size-3.5" />
                                  Hapus
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
            {!limit ? (
              <div
                ref={loadMoreRef}
                className="flex items-center justify-center py-6 text-xs text-base-content/50"
              >
                {hasMore ? "Scroll untuk memuat lebih banyak" : "Semua data sudah dimuat"}
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
      <ConfirmModal
        isOpen={Boolean(deleteTargetId)}
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Data?"
        message="Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin ingin menghapus karakter Hanzi ini dari koleksi?"
        cancelText="Batal"
        confirmText="Ya, Hapus"
        variant="overlay"
        confirmButtonClassName="bg-error text-white hover:bg-error/90"
        cancelButtonClassName="border-base-300 text-base-content/70 hover:bg-base-200"
      />
      <ConfirmModal
        isOpen={isBulkModalOpen}
        onCancel={() => setIsBulkModalOpen(false)}
        onConfirm={handleBulkDelete}
        title="Hapus Data Terpilih?"
        message={`Anda akan menghapus ${selectedIds.length} karakter dari koleksi. Tindakan ini tidak dapat dibatalkan.`}
        cancelText="Batal"
        confirmText="Ya, Hapus"
        variant="overlay"
        confirmButtonClassName="bg-error text-white hover:bg-error/90"
        cancelButtonClassName="border-base-300 text-base-content/70 hover:bg-base-200"
      />
      <CollectionEditModal
        isOpen={Boolean(editTargetId)}
        recordId={editTargetId}
        onClose={() => setEditTargetId(null)}
        onSaved={() => collectionSync.refresh()}
      />
    </Card>
  );
}

export default DashboardCollectionCard;
