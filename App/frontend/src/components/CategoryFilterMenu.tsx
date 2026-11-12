import { useCallback, useRef, useState } from "react";
import { Check, ChevronDown, ListFilter } from "lucide-react";
import type { DiscussionsCategories } from "../schemas/discussion";
import { useDismiss } from "../hooks/useDismiss";

interface CategoryFilterMenuProps {
  categories: DiscussionsCategories[];
  value: string; // "" means all categories
  onChange: (categoryId: string) => void;
}

// category dropdown for the discussion feed
// phone/tablet: round filter icon button, desktop: "All categories" pill
export default function CategoryFilterMenu({
  categories,
  value,
  onChange,
}: CategoryFilterMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = categories.find((c) => c.id === value);
  const options = [{ id: "", name: "All" }, ...categories];

  // close when clicking outside or pressing escape
  const close = useCallback(() => setOpen(false), []);
  useDismiss(rootRef, open, close);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Filter by category"
        className={`flex size-7.5 items-center justify-center rounded-[15px] border transition-colors hover:bg-[#151A24] sm:size-8.5 sm:rounded-[17px] lg:h-8.5 lg:w-auto lg:gap-1.5 lg:px-3.5 ${
          open || value ? "border-[#4DA3F0]/60" : "border-[#314158]"
        }`}
      >
        <ListFilter
          strokeWidth={1.75}
          className="size-3.5 text-[#8B94A5] sm:size-4 lg:hidden"
        />
        <span className="hidden font-['Inter'] text-[13px]/4.5 font-medium text-[#CAD5E2] lg:inline">
          {selected ? selected.name : "All categories"}
        </span>
        <ChevronDown
          strokeWidth={1.75}
          className={`hidden size-3.5 text-[#8B94A5] transition-transform lg:block ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Filter by category"
          className="absolute top-full right-0 z-30 mt-1.5 flex w-55 flex-col gap-0.5 rounded-xl border border-[#2A3342] bg-[#171B22] p-2 shadow-[0_12px_32px_#00000073] sm:w-62"
        >
          <div className="px-2.5 pt-2 pb-2.5 font-geist text-[11px]/3.75 font-semibold tracking-[0.04em] text-[#8B94A5] uppercase">
            Filter by category
          </div>
          {options.map((opt) => {
            const isActive = opt.id === value;
            return (
              <button
                key={opt.id || "all"}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  onChange(opt.id);
                  setOpen(false);
                }}
                className={`flex h-9 shrink-0 items-center justify-between rounded-lg px-2.5 text-left font-geist text-[13px]/4.75 transition-colors sm:h-10 sm:text-sm/5 ${
                  isActive
                    ? "bg-[#1D293D] font-semibold text-[#4DA3F0]"
                    : "font-medium text-[#E9ECF2] hover:bg-[#1B2029]"
                }`}
              >
                <span className="truncate">{opt.name}</span>
                {isActive && (
                  <Check strokeWidth={2} className="size-3.25 shrink-0 text-[#4DA3F0]" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
