// Generic card container used across forms, results, and report pages.
// Generic card container used across forms, results, and report pages.
// Generic card container used across forms, results, and report pages.
import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

export function Card({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <section className={cn("rounded-2xl border border-[var(--color-line)] bg-white/90 p-6 shadow-sm", className)}>
      {children}
    </section>
  );
}
