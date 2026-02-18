"use client";

import useDashboardStore from "@/store/useDashboardStore";
import DashboardStatCard from "@/components/dashboard/DashboardStatCard";

function DashboardStatGrid() {
  const stats = useDashboardStore((state) => state.stats);

  return (
    <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map(function (stat) {
        return <DashboardStatCard key={stat.id} statId={stat.id} />;
      })}
    </section>
  );
}

export default DashboardStatGrid;
