import type { BulkField } from "../types";

type Props = {
  selectedFields: BulkField[];
  onChange: (fields: BulkField[]) => void;
};

const FIELD_OPTIONS: { key: BulkField; label: string; category: "Org" | "Employment" | "Compensation" | "Compliance" }[] = [
  { key: "department", label: "Department", category: "Org" },
  { key: "team", label: "Team", category: "Org" },
  { key: "managerId", label: "Manager", category: "Org" },
  { key: "title", label: "Title", category: "Employment" },
  { key: "level", label: "Level", category: "Employment" },
  { key: "location", label: "Location", category: "Employment" },
  { key: "workLocation", label: "Work location", category: "Employment" },
  { key: "status", label: "Status", category: "Employment" },
  { key: "startDate", label: "Start date", category: "Employment" },
  { key: "endDate", label: "End date", category: "Employment" },
  { key: "employmentType", label: "Employment type", category: "Employment" },
  { key: "jurisdiction", label: "Jurisdiction", category: "Compliance" },
  { key: "legalEntity", label: "Legal entity", category: "Compliance" },
  { key: "payPeriod", label: "Pay period", category: "Compensation" },
  { key: "cashComp", label: "Cash comp", category: "Compensation" },
  { key: "targetBonusPct", label: "Target bonus %", category: "Compensation" },
];

export default function Step2ChooseFields({ selectedFields, onChange }: Props) {
  const toggle = (field: BulkField) => {
    if (selectedFields.includes(field)) {
      onChange(selectedFields.filter((f) => f !== field));
    } else {
      onChange([...selectedFields, field]);
    }
  };

  const handleSelectAll = () => onChange(FIELD_OPTIONS.map((f) => f.key));
  const handleClear = () => onChange([]);

  const grouped = FIELD_OPTIONS.reduce<Record<string, typeof FIELD_OPTIONS>>((acc, field) => {
    acc[field.category] = acc[field.category] || [];
    acc[field.category].push(field);
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      <div className="text-sm text-[var(--ink-500)]">Select the fields you want to update.</div>
      <div className="flex items-center justify-between">
        <div className="text-xs text-[var(--ink-500)]">{selectedFields.length} selected</div>
        <div className="flex gap-2">
          <button
            type="button"
            className="text-xs text-[var(--plum-700)] underline"
            onClick={handleSelectAll}
          >
            Select all
          </button>
          <button
            type="button"
            className="text-xs text-[var(--ink-500)] underline"
            onClick={handleClear}
          >
            Clear
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {Object.entries(grouped).map(([category, fields]) => (
          <div key={category} className="space-y-2">
            <div className="text-xs uppercase tracking-wide text-[var(--ink-500)]">{category}</div>
            <div className="space-y-1">
              {fields.map((field) => (
                <label key={field.key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedFields.includes(field.key)}
                    onChange={() => toggle(field.key)}
                  />
                  {field.label}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
