"use client";

import { cn } from "@/lib/utils";

type CollectionEmptyStateProps = {
  message: string;
  className?: string;
};

function CollectionEmptyState(props: CollectionEmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-base-200 bg-base-100 px-6 py-8 text-center text-sm text-base-content/60",
        props.className
      )}
    >
      {props.message}
    </div>
  );
}

export default CollectionEmptyState;
