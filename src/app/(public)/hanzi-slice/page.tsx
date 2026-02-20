import { Metadata } from "next";
import { Suspense } from "react";
import HanziSlicePage from "@/components/hanzi/HanziSlicePage";

export const metadata: Metadata = {
  title: "Hanzi Slice - Junaedy",
  description: "Kelola hasil pemisahan Hanzi dan arti untuk koleksi Anda.",
};

export default function HanziSlice() {
  return (
    <Suspense fallback={null}>
      <HanziSlicePage />
    </Suspense>
  );
}
