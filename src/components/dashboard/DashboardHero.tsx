"use client";

import { Download, Plus } from "lucide-react";

import useDashboardStore from "@/store/useDashboardStore";
import { Button } from "@/ui/button";

function DashboardHero() {
  const heroTitle = useDashboardStore((state) => state.heroTitle);
  const heroSubtitle = useDashboardStore((state) => state.heroSubtitle);

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
        <Button className="bg-primary text-sm font-semibold text-primary-content shadow-sm hover:opacity-90">
          <Plus className="size-4" />
          New Hanzi
        </Button>
      </div>
    </section>
  );
}

export default DashboardHero;
