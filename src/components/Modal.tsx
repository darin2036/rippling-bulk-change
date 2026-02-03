import { useEffect, type ReactNode } from "react";

export default function Modal({
  open,
  title,
  onClose,
  children,
  maxWidthClass = "max-w-2xl",
}: {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
  maxWidthClass?: string;
}) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title || "Dialog"}
        className={`relative w-full ${maxWidthClass} rounded-2xl bg-white shadow-[0_30px_80px_rgba(0,0,0,0.25)] border border-[var(--border)]`}
      >
        {children}
      </div>
    </div>
  );
}
