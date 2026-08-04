// Small wrapper so labels and form controls stay consistent everywhere.
// Small wrapper so labels and form controls stay consistent everywhere.
// Small wrapper so labels and form controls stay consistent everywhere.
import type { PropsWithChildren } from "react";

export function FormField({
  label,
  hint,
  children,
}: PropsWithChildren<{ label: string; hint?: string }>) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-[var(--color-ink)]">{label}</span>
      {children}
      {hint ? <span className="text-xs text-[var(--color-slate)]">{hint}</span> : null}
    </label>
  );
}
