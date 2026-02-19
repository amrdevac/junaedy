"use client";

import Link from "next/link";
import { BookOpen, Info, Keyboard, Link2, Save, Scissors, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import pinyin from "pinyin";
import { addHanziRecords, getAllHanziRecords } from "@/lib/indexeddb/hanziCollection";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import { Input } from "@/ui/input";
import { cn } from "@/lib/utils";
import DashboardFooter from "@/components/dashboard/DashboardFooter";
import DashboardTopNav from "@/components/dashboard/DashboardTopNav";

type SliceRow = {
  id: string;
  hanzi: string;
  parts: string[];
  meaning: string;
  meaningPlaceholder: string;
  proficiency: string;
  isDuplicate: boolean;
  existingPinyin: string;
};

function HanziSlicePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hanziParam = searchParams.get("hanzi") ?? "";
  const hanziChars = Array.from(hanziParam).filter(function (char) {
    return /[\u4e00-\u9fff]/.test(char);
  });
  const rowsState = useState<SliceRow[]>([]);
  const rows = rowsState[0];
  const setRows = rowsState[1];
  const isSavingState = useState(false);
  const isSaving = isSavingState[0];
  const setIsSaving = isSavingState[1];
  const existingMapState = useState<Map<string, { meaning?: string; pinyin?: string }>>(
    new Map()
  );
  const existingMap = existingMapState[0];
  const setExistingMap = existingMapState[1];

  useEffect(
    function () {
      const loadRows = async () => {
        const existing = await getAllHanziRecords();
        const nextMap = new Map(existing.map((item) => [item.hanzi, item]));
        const existingSet = new Set(nextMap.keys());

        const nextRows = hanziChars.map(function (char, index) {
          const existingItem = nextMap.get(char);
          const isDuplicate = existingSet.has(char);

          return {
            id: `${char}-${index}`,
            hanzi: char,
            parts: [char],
            meaning: isDuplicate ? existingItem?.meaning || "" : "",
            meaningPlaceholder: "Masukkan arti (contoh: Kamu)...",
            proficiency: "baru",
            isDuplicate,
            existingPinyin: isDuplicate ? existingItem?.pinyin || "-" : "-",
          };
        });
        setRows(nextRows);
        setExistingMap(nextMap);
      };

      loadRows();
    },
    [hanziParam]
  );

  const handleMerge = (index: number) => {
    setRows(function (prevRows) {
      if (index >= prevRows.length - 1) return prevRows;

      const currentRow = prevRows[index];
      const nextRow = prevRows[index + 1];
      const mergedHanzi = `${currentRow.hanzi}${nextRow.hanzi}`;
      const existingItem = existingMap.get(mergedHanzi);
      const isDuplicate = Boolean(existingItem);
      const mergedRow = {
        id: `${currentRow.hanzi}${nextRow.hanzi}-${index}`,
        hanzi: mergedHanzi,
        parts: [...currentRow.parts, ...nextRow.parts],
        meaning: isDuplicate ? existingItem?.meaning || "" : currentRow.meaning,
        meaningPlaceholder: "Masukkan arti (contoh: Kamu)...",
        proficiency: currentRow.proficiency,
        isDuplicate,
        existingPinyin: isDuplicate ? existingItem?.pinyin || "-" : "-",
      };
      const nextList = prevRows.slice();
      nextList.splice(index, 2, mergedRow);
      return nextList;
    });
  };

  const handleSplit = (index: number) => {
    setRows(function (prevRows) {
      const currentRow = prevRows[index];
      if (!currentRow || currentRow.parts.length <= 1) return prevRows;

      const splitRows = currentRow.parts.map(function (char, partIndex) {
        const existingItem = existingMap.get(char);
        const isDuplicate = Boolean(existingItem);
        return {
          id: `${char}-${index}-${partIndex}`,
          hanzi: char,
          parts: [char],
          meaning: isDuplicate ? existingItem?.meaning || "" : "",
          meaningPlaceholder: "Masukkan arti (contoh: Kamu)...",
          proficiency: currentRow.proficiency,
          isDuplicate,
          existingPinyin: isDuplicate ? existingItem?.pinyin || "-" : "-",
        };
      });

      const nextList = prevRows.slice();
      nextList.splice(index, 1, ...splitRows);
      return nextList;
    });
  };

  const handleRemoveRow = (index: number) => {
    setRows(function (prevRows) {
      const nextRows = prevRows.slice();
      nextRows.splice(index, 1);
      return nextRows;
    });
  };

  const handleMeaningChange = (index: number, value: string) => {
    setRows(function (prevRows) {
      const nextRows = prevRows.slice();
      const currentRow = nextRows[index];
      if (!currentRow) return prevRows;
      nextRows[index] = { ...currentRow, meaning: value };
      return nextRows;
    });
  };

  const createId = (index: number) => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`;
  };

  const toPinyin = (value: string) => {
    const raw = pinyin(value, {
      style: pinyin.STYLE_TONE,
      segment: true,
    });
    return raw
      .map(function (group) {
        return group[0];
      })
      .join(" ");
  };

  const handleSave = async () => {
    if (rows.length === 0) return;
    setIsSaving(true);
    const timestamp = new Date().toISOString();
    const records = rows
      .filter(function (row) {
        return !row.isDuplicate;
      })
      .map(function (row, index) {
      return {
        id: createId(index),
        hanzi: row.hanzi,
        pinyin: toPinyin(row.hanzi),
        meaning: row.meaning,
        proficiency: row.proficiency === "mahir" ? "mahir" : row.proficiency === "belajar" ? "belajar" : "baru",
        createdAt: timestamp,
      };
    });

    if (records.length > 0) {
      await addHanziRecords(records);
    }
    setIsSaving(false);
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-base-200 text-base-content">
      <DashboardTopNav />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-16 pt-8">
        <div>
          <h1 className="text-xl font-semibold text-base-content">
            Berikan arti untuk setiap karakter yang telah dipisahkan dari input Anda.
          </h1>
          <p className="mt-1 text-sm text-base-content/60">
            Lengkapi arti dan tingkat kemahiran agar koleksi Hanzi Anda tetap rapi.
          </p>
        </div>

        <Card className="overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm">
          <div className="grid grid-cols-[120px_minmax(0,1fr)_180px] gap-4 border-b border-base-200 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-base-content/40">
            <span className="text-center">Karakter</span>
            <span>Arti (Makna)</span>
            <span>Tingkat Kemahiran</span>
          </div>
          <div className="divide-y divide-base-200">
            {rows.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-base-content/60">
                Tidak ada karakter Hanzi yang bisa diolah. Tambahkan hanzi di
                halaman sebelumnya.
              </div>
            ) : null}
            {rows.map(function (row, index) {
              return (
                <div
                  key={row.id}
                  className="grid grid-cols-[120px_minmax(0,1fr)_180px] items-center gap-4 px-6 py-4"
                >
                  <div className="flex flex-col items-center gap-2 ">
                    <span className="hanzi-font text-3xl font-semibold text-base-content ">
                      {row.hanzi}
                    </span>
                    {row.isDuplicate ? (
                      <span className="text-[11px] font-medium text-base-content/50">
                        {row.existingPinyin}
                      </span>
                    ) : null}
                    {row.isDuplicate ? (
                      <span className="rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[10px] font-semibold text-warning">
                        Sudah ada
                      </span>
                    ) : null}
                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                      {index < rows.length - 1 ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 px-2 text-[11px] text-base-content/50 hover:text-primary hover:bg-base-200"
                          onClick={() => handleMerge(index)}
                        >
                          <Link2 className="size-3.5" />
                          Gabungkan
                        </Button>
                      ) : null}
                      {row.parts.length > 1 ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 px-2 text-[11px] text-base-content/50 hover:text-primary hover:bg-base-200"
                          onClick={() => handleSplit(index)}
                        >
                          <Scissors className="size-3.5" />
                          Pisahkan
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  <Input
                    className="h-10 rounded-lg border-base-200 bg-base-100 text-sm"
                    placeholder={row.meaningPlaceholder}
                    value={row.meaning}
                    onChange={(event) => handleMeaningChange(index, event.target.value)}
                    disabled={row.isDuplicate}
                  />
                  <div className="flex items-center justify-between gap-3">
                    <div
                      className={cn(
                        "flex h-10 items-center gap-2 rounded-lg border border-base-200 bg-base-100 px-3 text-sm text-base-content/70",
                        row.isDuplicate ? "opacity-60" : null
                      )}
                    >
                      <span className="size-2 rounded-full bg-primary" />
                      Baru
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-lg text-base-content/50 hover:bg-base-200 hover:text-error"
                      onClick={() => handleRemoveRow(index)}
                      aria-label="Hapus baris"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-base-200 px-6 py-4 text-sm text-base-content/60">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-base-200 text-base-content/60">
                <Info className="size-4" />
              </div>
              <span>
                Semua data akan disimpan ke koleksi pribadi Anda.
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                className="border-base-300 text-base-content/70 hover:bg-base-200"
                asChild
              >
                <Link href="/">Batal</Link>
              </Button>
              <Button
                className="bg-primary text-primary-content hover:bg-primary/90"
                onClick={handleSave}
                disabled={rows.length === 0 || isSaving}
              >
                <Save className="size-4" />
                {isSaving ? "Menyimpan..." : "Simpan ke Koleksi"}
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="flex gap-4 rounded-xl border border-base-300 bg-base-100 p-4 shadow-sm">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BookOpen className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-base-content">
                Tips Belajar
              </h3>
              <p className="mt-1 text-xs text-base-content/60">
                Gunakan arti yang paling mudah diingat secara personal untuk
                mempercepat hafalan Anda.
              </p>
            </div>
          </Card>
          <Card className="flex gap-4 rounded-xl border border-base-300 bg-base-100 p-4 shadow-sm">
            <div className="flex size-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
              <Keyboard className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-base-content">
                Navigasi Cepat
              </h3>
              <p className="mt-1 text-xs text-base-content/60">
                Gunakan tombol{" "}
                <span className="rounded border border-base-300 bg-base-200 px-1.5 py-0.5 text-[10px] font-semibold text-base-content">
                  Tab
                </span>{" "}
                untuk berpindah antar kolom input dengan cepat.
              </p>
            </div>
          </Card>
        </div>
      </main>
      <DashboardFooter />
    </div>
  );
}

export default HanziSlicePage;
