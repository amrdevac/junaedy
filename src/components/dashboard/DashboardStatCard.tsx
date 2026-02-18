"use client";

import { ArrowUp } from "lucide-react";

import useDashboardStore from "@/store/useDashboardStore";
import { Card, CardContent } from "@/ui/card";
import { cn } from "@/lib/utils";

type DashboardStatCardProps = {
  statId: string;
};

const toneStyles: Record<string, string> = {
  primary: "bg-blue-50 text-primary",
  success: "bg-blue-50 text-primary",
  warning: "bg-orange-50 text-warning",
  info: "bg-blue-50 text-primary",
};

function DashboardStatCard(props: DashboardStatCardProps) {
  const stat = useDashboardStore((state) =>
    state.stats.find((item) => item.id === props.statId)
  );

  if (!stat) {
    return null;
  }

  const Icon = stat.icon;
  const toneClass = toneStyles[stat.tone] ?? toneStyles.primary;

  return (
    <Card className="h-40 rounded-2xl border border-slate-100 bg-base-100 shadow-sm">
      <CardContent className="flex h-full flex-col justify-between p-6">
        <div className="flex items-start justify-between">
          <div className={cn("rounded-xl p-2", toneClass)}>
            <Icon className="size-5" />
          </div>
          <span
            className={cn(
              "flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider",
              stat.id === "accuracy" || stat.id === "total-vocab"
                ? "text-success"
                : "text-base-content/40"
            )}
          >
            {stat.id === "accuracy" ? <ArrowUp className="size-3" /> : null}
            {stat.caption}
          </span>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-base-content/40">
            {stat.title}
          </p>
          {stat.value.includes("/") ? (
            <p className="text-3xl font-bold text-success">
              {stat.value.split("/")[0]}
              <span className="ml-1 text-sm font-medium text-base-content/30">
                /{stat.value.split("/")[1]}
              </span>
            </p>
          ) : (
            <p className="text-3xl font-bold text-base-content">{stat.value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default DashboardStatCard;
