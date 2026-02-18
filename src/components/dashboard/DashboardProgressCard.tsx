"use client";

import useDashboardStore from "@/store/useDashboardStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { cn } from "@/lib/utils";

function DashboardProgressCard() {
  const progressLabel = useDashboardStore((state) => state.progressLabel);
  const progressPercent = useDashboardStore((state) => state.progressPercent);
  const progressGoal = useDashboardStore((state) => state.progressGoal);
  const progressStats = useDashboardStore((state) => state.progressStats);

  return (
    <Card className="rounded-xl border border-slate-200 bg-base-100 shadow-md">
      <CardHeader className="px-6 pb-2 pt-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-base-content">
            Weekly Learning Progress
          </CardTitle>
          <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
            {progressGoal}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 px-6 pb-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold uppercase text-primary">
              {progressLabel}
            </span>
            <span className="text-xs font-semibold text-primary">
              {progressPercent}%
            </span>
          </div>
          <div className="h-2 w-full rounded bg-base-200">
            <span
              className={cn("block h-2 rounded bg-primary")}
              style={{ width: progressPercent + "%" }}
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          {progressStats.map(function (item) {
            return (
              <div key={item.id}>
                <p className="text-2xl font-bold text-base-content">
                  {item.value}
                </p>
                <p className="text-[10px] uppercase text-base-content/50">
                  {item.label}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default DashboardProgressCard;
