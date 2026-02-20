"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, X } from "lucide-react";

import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { getHanziRecord, updateHanziRecord, type HanziRecord } from "@/lib/indexeddb/hanziCollection";
import { cn } from "@/lib/utils";

type ProficiencyValue = HanziRecord["proficiency"];

type CollectionEditModalProps = {
  isOpen: boolean;
  recordId: string | null;
  onClose: () => void;
  onSaved: () => void;
};

const PROFICIENCY_OPTIONS: Array<{ value: ProficiencyValue; label: string }> = [
  { value: "baru", label: "Baru" },
  { value: "belajar", label: "Belajar" },
  { value: "mahir", label: "Mahir" },
];

function CollectionEditModal(props: CollectionEditModalProps) {
  const { isOpen, recordId, onClose, onSaved } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hanzi, setHanzi] = useState("");
  const [pinyin, setPinyin] = useState("");
  const [meaning, setMeaning] = useState("");
  const [proficiency, setProficiency] = useState<ProficiencyValue>("baru");
  const [loadError, setLoadError] = useState("");

  const proficiencyLabel = useMemo(() => {
    return PROFICIENCY_OPTIONS.find((option) => option.value === proficiency)?.label ?? "Baru";
  }, [proficiency]);

  useEffect(() => {
    if (!isOpen || !recordId) return;
    setIsLoading(true);
    setLoadError("");

    getHanziRecord(recordId)
      .then((record) => {
        if (!record) {
          setLoadError("Data tidak ditemukan.");
          return;
        }
        setHanzi(record.hanzi || "");
        setPinyin(record.pinyin || "-");
        setMeaning(record.meaning || "");
        setProficiency(record.proficiency || "baru");
      })
      .catch(() => {
        setLoadError("Gagal memuat data. Coba lagi.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isOpen, recordId]);

  const handleClose = () => {
    if (isSaving) return;
    onClose();
  };

  const handleSubmit = async () => {
    if (!recordId || isSaving) return;
    setIsSaving(true);
    try {
      await updateHanziRecord(recordId, {
        meaning: meaning.trim(),
        proficiency,
      });
      onSaved();
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (open ? null : handleClose())}>
      <DialogContent
        overlayClassName="bg-slate-900/60 backdrop-blur-sm"
        showCloseButton={false}
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-0 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-base-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Pencil className="size-5" />
            </div>
            <DialogTitle className="text-base font-semibold text-base-content">
              Ubah Hanzi
            </DialogTitle>
          </div>
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 rounded-full text-base-content/50 hover:bg-base-200 hover:text-base-content"
            >
              <X className="size-4" />
            </Button>
          </DialogClose>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[120px_minmax(0,1fr)_180px]">
            <div className="flex flex-col items-center gap-2 rounded-xl border border-base-200 bg-base-100 px-4 py-4 text-center">
              <span className="hanzi-font text-3xl font-semibold text-base-content">
                {hanzi || "-"}
              </span>
              <span className="text-xs font-medium text-base-content/50">{pinyin}</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-base-content/40">
                Arti (Makna)
              </span>
              <Input
                className="h-10 rounded-lg border-base-200 bg-base-100 text-sm"
                placeholder="Masukkan arti (contoh: Kamu)..."
                value={meaning}
                onChange={(event) => setMeaning(event.target.value)}
                disabled={isLoading || Boolean(loadError)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-base-content/40">
                Tingkat Kemahiran
              </span>
              <Select
                value={proficiency}
                onValueChange={(value) => setProficiency(value as ProficiencyValue)}
                disabled={isLoading || Boolean(loadError)}
              >
                <SelectTrigger className="h-10 w-full rounded-lg border-base-200 bg-base-100 text-sm">
                  <SelectValue placeholder="Pilih tingkat" />
                </SelectTrigger>
                <SelectContent>
                  {PROFICIENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div
                className={cn(
                  "flex h-9 items-center gap-2 rounded-lg border border-base-200 bg-base-100 px-3 text-xs text-base-content/60",
                  isLoading ? "opacity-60" : null
                )}
              >
                <span className="size-2 rounded-full bg-primary" />
                {proficiencyLabel}
              </div>
            </div>
          </div>
          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-base-content/50">
              <Loader2 className="size-4 animate-spin" />
              Memuat data...
            </div>
          ) : null}
          {loadError ? (
            <div className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-xs text-error">
              {loadError}
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-base-200 px-6 py-4">
          <Button
            variant="outline"
            className="border-base-300 text-base-content/70 hover:bg-base-200"
            onClick={handleClose}
            disabled={isSaving}
          >
            Batal
          </Button>
          <Button
            className="bg-primary text-primary-content hover:bg-primary/90"
            onClick={handleSubmit}
            disabled={isLoading || Boolean(loadError) || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Simpan Perubahan"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CollectionEditModal;
