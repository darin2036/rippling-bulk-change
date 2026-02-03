import type { ReactNode } from "react";
import clsx from "clsx";

export default function Badge({ children, tone="neutral" }: { children: ReactNode; tone?: "neutral"|"green"|"purple"|"red"|"amber" }) {
  const toneClass =
    tone === "green" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
    tone === "purple" ? "bg-[var(--plum-100)] text-[var(--plum-700)] border-[var(--plum-200)]" :
    tone === "red" ? "bg-red-50 text-red-700 border-red-200" :
    tone === "amber" ? "bg-amber-50 text-amber-700 border-amber-200" :
    "bg-[var(--cream-100)] text-[var(--ink-700)] border-[var(--border)]";
  return <span className={clsx("inline-flex items-center px-2 py-0.5 rounded-full text-xs border", toneClass)}>{children}</span>;
}
