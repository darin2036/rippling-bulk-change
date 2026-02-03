import { useEffect, useState, type ReactNode } from "react";

export default function Drawer({
  open,
  title,
  onClose,
  widthClass = "w-[420px]",
  children,
}: {
  open: boolean;
  title?: string;
  onClose: () => void;
  widthClass?: string;
  children: ReactNode;
}) {
  const [render, setRender] = useState(open);

  useEffect(() => {
    if (open) setRender(true);
  }, [open]);

  useEffect(() => {
    if (!render) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, render]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  // Allow the slide-out animation to complete before unmounting.
  useEffect(() => {
    if (open) return;
    if (!render) return;
    const t = window.setTimeout(() => setRender(false), 220);
    return () => window.clearTimeout(t);
  }, [open, render]);

  if (!render) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close drawer"
        className={`absolute inset-0 bg-black/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />

      <aside
        className={[
          "absolute right-0 top-0 h-full bg-white border-l border-[var(--border)] shadow-[0_30px_80px_rgba(0,0,0,0.25)]",
          "transform transition-transform duration-200 ease-out",
          widthClass,
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
        aria-label={title || "Drawer"}
      >
        <div className="h-full flex flex-col">
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between gap-3">
            <div className="font-semibold">{title}</div>
            <button
              type="button"
              aria-label="Close"
              className="w-9 h-9 rounded-full border border-[var(--border)] bg-white hover:bg-[var(--cream-100)] flex items-center justify-center"
              onClick={onClose}
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-auto">{children}</div>
        </div>
      </aside>
    </div>
  );
}

