type Option = { value: string; label?: string };

export default function MultiSelectPanel({
  options,
  selected,
  onChange,
  emptyLabel = "No options available",
}: {
  options: Option[];
  selected: string[];
  onChange: (next: string[]) => void;
  emptyLabel?: string;
}) {
  const toggle = (value: string) => {
    if (selected.includes(value)) onChange(selected.filter((v) => v !== value));
    else onChange([...selected, value]);
  };

  if (options.length === 0) {
    return <div className="text-sm text-[var(--ink-500)]">{emptyLabel}</div>;
  }

  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <label key={opt.value} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={selected.includes(opt.value)}
            onChange={() => toggle(opt.value)}
          />
          {opt.label ?? opt.value}
        </label>
      ))}
    </div>
  );
}

