"use client";

import { Button } from "@/ui/button";

function DashboardFooter() {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-base-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-3 px-4 py-8 text-center text-xs">
        <span className="font-bold uppercase tracking-widest text-base-content/40">
          Mandarin Junaedy Dashboard © 2024
        </span>
        <div className="flex items-center gap-6">
          <Button variant="link" className="h-auto p-0 text-base-content/40">
            Privacy Policy
          </Button>
          <Button variant="link" className="h-auto p-0 text-base-content/40">
            Terms of Service
          </Button>
          <Button variant="link" className="h-auto p-0 text-base-content/40">
            Help Center
          </Button>
        </div>
      </div>
    </footer>
  );
}

export default DashboardFooter;
