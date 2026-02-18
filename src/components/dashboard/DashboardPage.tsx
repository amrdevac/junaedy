"use client";

import DashboardCollectionCard from "@/components/dashboard/DashboardCollectionCard";
import DashboardFooter from "@/components/dashboard/DashboardFooter";
import DashboardHero from "@/components/dashboard/DashboardHero";
import DashboardProgressCard from "@/components/dashboard/DashboardProgressCard";
import DashboardQuizCard from "@/components/dashboard/DashboardQuizCard";
import DashboardStatGrid from "@/components/dashboard/DashboardStatGrid";
import DashboardTopNav from "@/components/dashboard/DashboardTopNav";

function DashboardPage() {
  return (
    <div className="min-h-screen bg-base-200 text-base-content">
      <DashboardTopNav />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-16 pt-8">
        <DashboardHero />
        <DashboardStatGrid />
        <DashboardCollectionCard />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <DashboardProgressCard />
          <DashboardQuizCard />
        </div>
      </main>
      <DashboardFooter />
    </div>
  );
}

export default DashboardPage;
