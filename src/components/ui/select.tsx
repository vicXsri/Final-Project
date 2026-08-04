// Shared select styling for dropdown-heavy wizard screens.
// Shared select styling for dropdown-heavy wizard screens.
// Shared select styling for dropdown-heavy wizard screens.
import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "w-full rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm text-[var(--color-ink)]",
        props.className,
      )}
    />
  );
}
