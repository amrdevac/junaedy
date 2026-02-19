"use client";

import DashboardCollectionCard from "@/components/dashboard/DashboardCollectionCard";
import DashboardFooter from "@/components/dashboard/DashboardFooter";
import DashboardTopNav from "@/components/dashboard/DashboardTopNav";

function CollectionPage() {
  return (
    <div className="min-h-screen bg-base-200 text-base-content">
      <DashboardTopNav />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-16 pt-8">
        <DashboardCollectionCard />
      </main>
      <DashboardFooter />
    </div>
  );
}

export default CollectionPage;
