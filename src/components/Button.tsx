import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
};

export default function Button({ variant="secondary", size="md", className, ...props }: Props) {
  const base = "inline-flex items-center justify-center rounded-lg border text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = size === "sm" ? "h-8 px-3" : "h-10 px-4";
  const variants =
    variant === "primary"
      ? "bg-[var(--plum-600)] border-[var(--plum-600)] text-white hover:brightness-110 shadow-[0_8px_18px_rgba(107,27,86,0.2)]"
      : variant === "ghost"
      ? "border-transparent text-[var(--ink-700)] hover:bg-[var(--plum-100)]"
      : "bg-white border-[var(--border)] text-[var(--ink-900)] hover:bg-[var(--cream-100)]";
  return <button className={clsx(base, sizes, variants, className)} {...props} />;
}
