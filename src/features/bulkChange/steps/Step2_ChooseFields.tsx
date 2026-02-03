import type { BulkField } from "../types";

type Props = {
  selectedFields: BulkField[];
  onChange: (fields: BulkField[]) => void;
};

const FIELD_OPTIONS: { key: BulkField; label: string }[] = [
  { key: "department", label: "Department" },
  { key: "managerId", label: "Manager" },
  { key: "location", label: "Location" },
  { key: "title", label: "Title" },
];

export default function Step2ChooseFields({ selectedFields, onChange }: Props) {
  const toggle = (field: BulkField) => {
    if (selectedFields.includes(field)) {
      onChange(selectedFields.filter((f) => f !== field));
    } else {
      onChange([...selectedFields, field]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-sm text-[var(--ink-500)]">Select the fields you want to update.</div>
      <div className="grid sm:grid-cols-2 gap-3">
        {FIELD_OPTIONS.map((option) => (
          <label
            key={option.key}
            className="flex items-center gap-3 border border-[var(--border)] rounded-xl px-4 py-3 bg-white"
          >
            <input
              type="checkbox"
              checked={selectedFields.includes(option.key)}
              onChange={() => toggle(option.key)}
            />
            <span className="text-sm font-medium">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
