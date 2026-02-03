import clsx from "clsx";

export type Tab = { key: string; label: string };

export default function Tabs({
  tabs,
  activeKey,
  onChange,
}: {
  tabs: Tab[];
  activeKey: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={clsx(
            "text-sm px-3 py-1.5 rounded-full border transition",
            activeKey === t.key
              ? "bg-[var(--plum-100)] border-[var(--plum-200)] text-[var(--plum-700)] font-semibold"
              : "bg-white border-[var(--border)] text-[var(--ink-700)] hover:bg-[var(--cream-100)]"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
