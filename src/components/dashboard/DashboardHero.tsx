"use client";

import { ArrowRight, Clipboard, Download, Info, Loader2, Plus, SpellCheck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import useDashboardStore from "@/store/useDashboardStore";
import { Button } from "@/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/ui/dialog";
import { Textarea } from "@/ui/textarea";

function DashboardHero() {
  const heroTitle = useDashboardStore((state) => state.heroTitle);
  const heroSubtitle = useDashboardStore((state) => state.heroSubtitle);
  const router = useRouter();
  const hanziInputState = useState("");
  const hanziInput = hanziInputState[0];
  const setHanziInput = hanziInputState[1];
  const isSlicingState = useState(false);
  const isSlicing = isSlicingState[0];
  const setIsSlicing = isSlicingState[1];

  const handleSlice = () => {
    if (isSlicing) return;
    setIsSlicing(true);
    const trimmedInput = hanziInput.trim();
    const queryParam = trimmedInput ? `?hanzi=${encodeURIComponent(trimmedInput)}` : "";
    router.push(`/hanzi-slice${queryParam}`);
  };

  return (
    <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-base-content">
          {heroTitle}
        </h1>
        <p className="text-base text-base-content/60">{heroSubtitle}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          className="border-base-300 bg-base-100 text-sm font-semibold text-base-content/80 shadow-sm hover:bg-base-100/60"
        >
          <Download className="size-4" />
          Export List
        </Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-primary text-sm font-semibold text-primary-content shadow-sm hover:opacity-90">
              <Plus className="size-4" />
              New Hanzi
            </Button>
          </DialogTrigger>
          <DialogContent
            overlayClassName="bg-slate-900/60 backdrop-blur-sm"
            showCloseButton={false}
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-0 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-base-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <SpellCheck className="size-5" />
                </div>
                <DialogTitle className="text-base font-semibold text-base-content">
                  Masukkan Hanzi
                </DialogTitle>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-base-content/40">
                  Mandarin Chinese
                </span>
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
            </div>
            <div className="space-y-4 px-6 py-5">
              <div className="relative">
                <Textarea
                  className="hanzi-font min-h-44 rounded-xl border-base-200 bg-base-100 pr-24 text-sm text-base-content shadow-sm focus-visible:ring-primary/10"
                  placeholder="Contoh: 我今天去学校。(Wǒ jīntiān qù xuéxiào.)"
                  value={hanziInput}
                  onChange={(event) => setHanziInput(event.target.value)}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="absolute bottom-3 right-3 h-8 gap-1.5 rounded-lg border-base-200 bg-base-100 px-3 text-xs text-base-content/70 shadow-sm hover:bg-base-200 hover:text-primary"
                >
                  <Clipboard className="size-3.5" />
                  Tempel
                </Button>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm text-base-content/70">
                <div className="mt-0.5 flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Info className="size-4" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
                    Tips Slicing
                  </p>
                  <p className="mt-1 text-xs leading-relaxed">
                    Sistem kami menggunakan NLP canggih untuk memisahkan kata-kata Mandarin
                    secara akurat bahkan tanpa spasi. Masukkan paragraf penuh untuk hasil
                    terbaik.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-base-200 px-6 py-4">
              <Button
                className="w-full bg-primary text-primary-content shadow-sm hover:bg-primary/90"
                onClick={handleSlice}
                disabled={isSlicing}
              >
                {isSlicing ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    Slice / Pisahkan
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}

export default DashboardHero;
