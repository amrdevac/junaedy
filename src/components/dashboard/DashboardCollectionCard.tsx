"use client";

import Link from "next/link";
import { MoreVertical, Pencil, Search, SlidersHorizontal, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import useDashboardStore from "@/store/useDashboardStore";
import useHanziCollectionSync from "@/hooks/useHanziCollectionSync";
import { deleteHanziRecord, deleteHanziRecords } from "@/lib/indexeddb/hanziCollection";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/ui/input";
import { cn } from "@/lib/utils";
import ConfirmModal from "@/components/shared/ConfirmModal";

type ColumnOption = {
  id: string;
  label: string;
  isChecked: boolean;
  onToggle: () => void;
};

type ColumnSelectorProps = {
  options: ColumnOption[];
};

function ColumnSelector(props: ColumnSelectorProps) {
  const options = props.options;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="border-base-300 text-base-content/70 hover:bg-base-200"
          type="button"
          aria-label="Pilih kolom"
        >
          <SlidersHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-56 rounded-xl border-base-300 bg-base-100 p-2 text-xs text-base-content/70 shadow-lg"
      >
        <DropdownMenuLabel className="text-[11px] uppercase tracking-widest text-base-content/40">
          Kolom
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map(function (option) {
          return (
            <DropdownMenuCheckboxItem
              key={option.id}
              checked={option.isChecked}
              onCheckedChange={option.onToggle}
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type DashboardCollectionCardProps = {
  limit?: number;
  showViewAll?: boolean;
};

function DashboardCollectionCard(props: DashboardCollectionCardProps) {
  const limit = props.limit;
  const showViewAll = props.showViewAll ?? false;
  const collectionSync = useHanziCollectionSync();

  const characters = useDashboardStore((state) => state.characters);
  const totalCharacters = characters.length;
  const pageSizeState = useState(10);
  const pageSize = pageSizeState[0];
  const setPageSize = pageSizeState[1];
  const currentPageState = useState(1);
  const currentPage = currentPageState[0];
  const setCurrentPage = currentPageState[1];
  const modalState = useState<string | null>(null);
  const deleteTargetId = modalState[0];
  const setDeleteTargetId = modalState[1];
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
  const rowMenuState = useState<string | null>(null);
  const openRowMenuId = rowMenuState[0];
  const setOpenRowMenuId = rowMenuState[1];
  const rowMenuRef = useRef<HTMLDivElement | null>(null);
  const selectAllRef = useRef<HTMLInputElement | null>(null);
  const totalPages = Math.max(1, Math.ceil(totalCharacters / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalCharacters);
  const visibleCharacters = limit
    ? characters.slice(0, limit)
    : characters.slice(startIndex, endIndex);
  const visibleCount = visibleCharacters.length;
  const rowCountForHeight = limit ? limit : pageSize;
  const tableMinHeight = rowCountForHeight * 64 + 72;
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
    {
      id: "proficiency",
      label: "Proficiency",
      isChecked: showProficiency,
      onToggle: () => setShowProficiency(!showProficiency),
    },
    {
      id: "last-reviewed",
      label: "Last Reviewed",
      isChecked: showLastReviewed,
      onToggle: () => setShowLastReviewed(!showLastReviewed),
    },
    {
      id: "actions",
      label: "Actions",
      isChecked: showActions,
      onToggle: () => setShowActions(!showActions),
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
      if (currentPage !== safePage) {
        setCurrentPage(safePage);
      }
    },
    [currentPage, safePage]
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
      <CardHeader className="flex flex-col gap-4 border-b border-slate-200 px-6 pb-4 pt-6 md:flex-row md:items-center md:justify-between">
        <CardTitle className="text-lg font-bold text-base-content">
          Character Collection
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {limit ? (
          <div className="px-6 pb-6 pt-2">
            {characters.length === 0 ? (
              <div className="rounded-xl border border-base-200 bg-base-100 px-6 py-8 text-center text-sm text-base-content/60">
                Belum ada koleksi Hanzi. Tambahkan lewat tombol New Hanzi.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {visibleCharacters.map(function (item) {
                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-base-200 bg-base-100 px-4 py-4 shadow-sm transition-colors hover:border-primary/40"
                    >
                      <div className="flex items-start justify-between">
                        <span className="hanzi-font text-3xl font-semibold text-base-content">
                          {item.hanzi}
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-base-content/40">
                          Baru
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
          <div className="overflow-x-auto" style={{ minHeight: tableMinHeight }}>
            <table className="min-w-[720px] w-full text-left">
              <thead>
                <tr className="bg-base-200 text-xs font-semibold uppercase tracking-wider text-base-content/50">
                  {showCharacter ? (
                    <th className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <input
                          ref={selectAllRef}
                          type="checkbox"
                          className="size-4 rounded border-base-300"
                          checked={characters.length > 0 && selectedIds.length === characters.length}
                          onChange={handleToggleSelectAll}
                          aria-label="Select all characters"
                        />
                        <span>Character</span>
                      </div>
                    </th>
                  ) : null}
                  {showPinyin ? <th className="px-6 py-4">Pinyin</th> : null}
                  {showMeaning ? <th className="px-6 py-4">Meaning</th> : null}
                  {showProficiency ? <th className="px-6 py-4">Proficiency</th> : null}
                  {showLastReviewed ? <th className="px-6 py-4">Last Reviewed</th> : null}
                  {showActions ? <th className="px-3 py-4 w-[64px] text-center">Actions</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {characters.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-sm text-base-content/60"
                    >
                      Belum ada koleksi Hanzi. Tambahkan lewat tombol New Hanzi.
                    </td>
                  </tr>
                ) : null}
                {visibleCharacters.map(function (item) {
                  return (
                    <tr
                      key={item.id}
                      className="group transition-colors hover:bg-base-200/60"
                    >
                      {showCharacter ? (
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              className="size-4 rounded border-base-300"
                              checked={selectedIds.includes(item.id)}
                              onChange={() => handleToggleSelect(item.id)}
                              aria-label={`Select ${item.hanzi}`}
                            />
                            <span className="hanzi-font text-3xl font-medium text-base-content transition-colors group-hover:text-primary">
                              {item.hanzi}
                            </span>
                          </div>
                        </td>
                      ) : null}
                      {showPinyin ? (
                        <td className="px-6 py-5 text-sm text-base-content/70">
                          {item.pinyin}
                        </td>
                      ) : null}
                      {showMeaning ? (
                        <td className="px-6 py-5 text-sm font-medium text-base-content/70">
                          {item.meaning}
                        </td>
                      ) : null}
                      {showProficiency ? (
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-full max-w-[80px] rounded-full bg-base-200">
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
                        </td>
                      ) : null}
                      {showLastReviewed ? (
                        <td className="px-6 py-5 text-xs text-base-content/50">
                          {item.lastReviewed}
                        </td>
                      ) : null}
                      {showActions ? (
                        <td className="px-3 py-5 w-[64px] text-center">
                          <div
                            className="relative inline-flex opacity-0 transition-opacity group-hover:opacity-100"
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
                                <button className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-base-200">
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
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
    </Card>
  );
}

export default DashboardCollectionCard;
