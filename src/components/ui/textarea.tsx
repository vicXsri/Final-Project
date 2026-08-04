// Shared textarea styling for notes and longer free-text fields.
// Shared textarea styling for notes and longer free-text fields.
// Shared textarea styling for notes and longer free-text fields.
import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-28 w-full rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-slate-400",
        props.className,
      )}
    />
  );
}
