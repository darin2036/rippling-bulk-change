import Modal from "../../components/Modal";
import type { ReactNode } from "react";

function IconWand() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 20l10.6-10.6M14.6 9.4l1.6-1.6a2 2 0 0 1 2.8 0l.6.6a2 2 0 0 1 0 2.8l-1.6 1.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M18 3v3M21 6h-3M19 8l2 2M17 8l-2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconDoc() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 3h7l3 3v15a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M14 3v4h4" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8.5 12h7M8.5 15h7M8.5 18h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function OptionCard({
  title,
  description,
  tone,
  icon,
  onClick,
}: {
  title: string;
  description: string;
  tone: "plum" | "blue";
  icon: ReactNode;
  onClick: () => void;
}) {
  const bg = tone === "plum" ? "bg-[var(--plum-100)] border-[var(--plum-200)] text-[var(--plum-700)]" : "bg-blue-50 border-blue-200 text-blue-700";
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-2xl border border-[var(--border)] bg-white p-5 hover:bg-[var(--cream-100)] transition focus:outline-none focus:ring-2 focus:ring-[var(--plum-300)]"
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${bg}`}>
          {icon}
        </div>
        <div className="space-y-1">
          <div className="text-lg font-semibold">{title}</div>
          <div className="text-sm text-[var(--ink-500)] leading-relaxed">{description}</div>
        </div>
      </div>
    </button>
  );
}

export default function StartBulkChangeModal({
  open,
  onClose,
  onUseWizard,
  onImportCsv,
}: {
  open: boolean;
  onClose: () => void;
  onUseWizard: () => void;
  onImportCsv: () => void;
}) {
  return (
    <Modal open={open} title="Start Bulk Change" onClose={onClose} maxWidthClass="max-w-3xl">
      <div className="p-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="text-3xl font-semibold tracking-tight">Start Bulk Change</div>
            <div className="text-lg text-[var(--ink-500)] mt-2">
              Choose how you&apos;d like to make bulk updates to employee records.
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            className="w-10 h-10 rounded-full border border-[var(--border)] bg-white hover:bg-[var(--cream-100)] flex items-center justify-center"
            onClick={onClose}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="mt-8 space-y-4">
          <OptionCard
            title="Use Wizard"
            description="Step-by-step guided flow to select employees, configure changes, and preview before applying."
            tone="plum"
            icon={<IconWand />}
            onClick={onUseWizard}
          />
          <OptionCard
            title="Import from CSV"
            description="Download a template, fill it out offline, then upload to apply changes in bulk."
            tone="blue"
            icon={<IconDoc />}
            onClick={onImportCsv}
          />
        </div>
      </div>
    </Modal>
  );
}
