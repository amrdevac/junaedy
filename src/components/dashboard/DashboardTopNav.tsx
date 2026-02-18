"use client";

import { Bell, Search } from "lucide-react";

import useDashboardStore from "@/store/useDashboardStore";
import { Input } from "@/ui/input";
import { cn } from "@/lib/utils";

function DashboardTopNav() {
  const appName = useDashboardStore((state) => state.appName);
  const navItems = useDashboardStore((state) => state.navItems);
  const user = useDashboardStore((state) => state.user);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-base-300 bg-base-100 shadow-sm">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 md:h-16 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
              <span className="text-lg font-semibold">{user.initials}</span>
            </div>
            <div className="text-xl font-bold tracking-tight text-base-content">
              {appName}
            </div>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
          {navItems.map(function (item) {
            return (
              <a
                key={item.id}
                href={item.href}
                className={cn(
                  "border-b-2 border-transparent py-5 text-sm font-medium text-base-content/60 transition-colors hover:text-primary",
                  item.isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-base-content/60"
                )}
              >
                {item.label}
              </a>
            );
          })}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden items-center rounded-lg border border-transparent bg-base-200 px-3 py-1.5 lg:flex">
            <Search className="size-4 text-base-content/40" />
            <Input
              className="h-6 w-48 border-none bg-transparent px-2 py-0 text-sm shadow-none focus-visible:ring-0"
              placeholder="Quick search..."
            />
          </div>
          <button className="relative rounded-lg p-2 text-base-content/60 hover:bg-base-200">
            <Bell className="size-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-base-100 bg-error" />
          </button>
          <div className="h-8 w-px bg-base-300" />
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold text-base-content leading-none">
                {user.name}
              </p>
              <p className="text-[10px] font-medium text-base-content/50">
                {user.level}
              </p>
            </div>
            <div
              className="size-9 rounded-full border-2 border-base-100 bg-primary/10 shadow-sm"
              style={{
                backgroundImage: user.avatarUrl
                  ? `url('${user.avatarUrl}')`
                  : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}

export default DashboardTopNav;
