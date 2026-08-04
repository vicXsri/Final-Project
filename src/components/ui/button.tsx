// Base button styles live here so feature screens do not repeat them.
// Base button styles live here so feature screens do not repeat them.
// Base button styles live here so feature screens do not repeat them.
import type { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[var(--color-ocean)] text-white hover:bg-[#115e72]",
        outline: "border border-[var(--color-line)] bg-white text-[var(--color-ink)] hover:bg-[var(--color-fog)]",
        ghost: "text-[var(--color-slate)] hover:bg-white/70",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant }), className)} {...props} />;
}
