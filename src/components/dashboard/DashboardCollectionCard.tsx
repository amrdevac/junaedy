"use client";

import { Pencil, Search, SlidersHorizontal, Trash2 } from "lucide-react";

import useDashboardStore from "@/store/useDashboardStore";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Input } from "@/ui/input";
import { cn } from "@/lib/utils";

function DashboardCollectionCard() {
  const characters = useDashboardStore((state) => state.characters);

  return (
    <Card className="overflow-hidden rounded-xl border border-slate-200 bg-base-100 shadow-md">
      <CardHeader className="flex flex-col gap-4 border-b border-slate-200 px-6 pb-4 pt-6 md:flex-row md:items-center md:justify-between">
        <CardTitle className="text-lg font-bold text-base-content">
          Character Collection
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-base-content/50" />
            <Input
              className="w-56 rounded-lg border-slate-200 bg-base-200 pl-9 text-sm focus-visible:ring-2 focus-visible:ring-primary/40"
              placeholder="Search characters, pinyin, or meaning..."
            />
          </div>
          <select className="rounded-lg border border-slate-200 bg-base-200 px-3 py-2 text-sm text-base-content/70 focus:border-primary/50 focus:outline-none">
            <option>Level: All HSK</option>
            <option>HSK 1</option>
            <option>HSK 2</option>
            <option>HSK 3</option>
            <option>HSK 4</option>
          </select>
          <Button
            variant="outline"
            size="icon"
            className="border-base-300 text-base-content/60 hover:text-base-content"
            aria-label="Filter characters"
          >
            <SlidersHorizontal className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-left">
            <thead>
              <tr className="bg-base-200 text-xs font-semibold uppercase tracking-wider text-base-content/50">
                <th className="px-6 py-4">Character</th>
                <th className="px-6 py-4">Pinyin</th>
                <th className="px-6 py-4">Meaning</th>
                <th className="px-6 py-4">Proficiency</th>
                <th className="px-6 py-4">Last Reviewed</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {characters.map(function (item) {
                return (
                  <tr
                    key={item.id}
                    className="group transition-colors hover:bg-base-200/60"
                  >
                    <td className="px-6 py-5">
                      <span className="hanzi-font text-3xl font-medium text-base-content transition-colors group-hover:text-primary">
                        {item.hanzi}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm text-base-content/70">
                      {item.pinyin}
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-base-content/70">
                      {item.meaning}
                    </td>
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
                    <td className="px-6 py-5 text-xs text-base-content/50">
                      {item.lastReviewed}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <button className="rounded-md p-1.5 text-base-content/40 transition-colors hover:text-primary">
                          <Pencil className="size-4" />
                        </button>
                        <button className="rounded-md p-1.5 text-base-content/40 transition-colors hover:text-error">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 text-sm text-base-content/60 md:flex-row md:items-center md:justify-between">
          <span>
            Showing <span className="font-semibold text-base-content">1</span> to{" "}
            <span className="font-semibold text-base-content">4</span> of{" "}
            <span className="font-semibold text-base-content">450</span>{" "}
            characters
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-base-300 text-base-content/70"
              disabled
            >
              Previous
            </Button>
            <Button
              size="sm"
              className="bg-primary text-primary-content hover:bg-primary/90"
            >
              1
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-base-300 text-base-content/70 hover:bg-base-200"
            >
              2
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-base-300 text-base-content/70 hover:bg-base-200"
            >
              3
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-base-300 text-base-content/70 hover:bg-base-200"
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default DashboardCollectionCard;
