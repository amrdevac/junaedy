"use client";

import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ColumnOption = {
  id: string;
  label: string;
  isChecked: boolean;
  onToggle: () => void;
};

type CollectionColumnSelectorProps = {
  options: ColumnOption[];
};

function CollectionColumnSelector(props: CollectionColumnSelectorProps) {
  const options = props.options;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="border-base-300 text-base-content/70 hover:bg-base-200"
          type="button"
          aria-label="Pilih kolom"
        >
          <SlidersHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-56 rounded-xl border-base-300 bg-base-100 p-2 text-xs text-base-content/70 shadow-lg"
      >
        <DropdownMenuLabel className="text-[11px] uppercase tracking-widest text-base-content/40">
          Kolom
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map(function (option) {
          return (
            <DropdownMenuCheckboxItem
              key={option.id}
              checked={option.isChecked}
              onCheckedChange={option.onToggle}
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default CollectionColumnSelector;
