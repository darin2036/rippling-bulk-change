import { useMemo, useState } from "react";
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

const CATEGORY_LABELS: Record<"Org" | "Employment" | "Compensation" | "Compliance", string> = {
  Org: "Org",
  Employment: "Employment",
  Compensation: "Compensation",
  Compliance: "Compliance",
};

const RECOMMENDED_LINKS: Partial<Record<BulkField, BulkField[]>> = {
  level: ["cashComp", "targetBonusPct"],
  cashComp: ["level", "targetBonusPct", "payPeriod"],
  targetBonusPct: ["level", "cashComp"],
  payPeriod: ["cashComp"],
  location: ["jurisdiction", "legalEntity"],
  workLocation: ["jurisdiction", "legalEntity"],
  jurisdiction: ["location", "workLocation", "legalEntity"],
  legalEntity: ["location", "workLocation", "jurisdiction"],
  department: ["team", "managerId"],
  team: ["department", "managerId"],
  managerId: ["department", "team"],
  title: ["level"],
  employmentType: ["payPeriod", "cashComp"],
  status: ["endDate"],
  endDate: ["status"],
};

export default function Step2ChooseFields({ selectedFields, onChange }: Props) {
  const [activeCategory, setActiveCategory] = useState<"Org" | "Employment" | "Compensation" | "Compliance">(
    "Employment"
  );
  const [query, setQuery] = useState("");

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

  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = useMemo(() => {
    if (!normalizedQuery) return FIELD_OPTIONS;
    return FIELD_OPTIONS.filter((f) => {
      const haystack = `${f.label} ${f.key} ${f.category}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery]);

  const selectedSet = useMemo(() => new Set(selectedFields), [selectedFields]);

  const addRecommended = (field: BulkField) => {
    const recs = RECOMMENDED_LINKS[field] || [];
    if (recs.length === 0) return;
    const next = new Set(selectedFields);
    recs.forEach((r) => next.add(r));
    next.add(field);
    onChange(Array.from(next));
  };

  const removeField = (field: BulkField) => {
    onChange(selectedFields.filter((f) => f !== field));
  };

  const activeFields = normalizedQuery ? filteredOptions : grouped[activeCategory] || [];

  return (
    <div className="space-y-4">
      <div className="text-sm text-[var(--ink-500)]">Select the fields you want to update.</div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
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

      <div className="flex items-center gap-2">
        <input
          className="h-9 w-full max-w-[360px] border border-[var(--border)] rounded-xl px-3 text-sm"
          placeholder="Search fields (e.g., title, department, comp)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query ? (
          <button
            type="button"
            className="text-xs text-[var(--ink-500)] underline"
            onClick={() => setQuery("")}
          >
            Clear
          </button>
        ) : null}
      </div>

      <div className="grid md:grid-cols-[180px_1fr_260px] gap-4">
        <div className="border-r border-[var(--border)] pr-3 space-y-1">
          {Object.keys(CATEGORY_LABELS).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat as keyof typeof CATEGORY_LABELS)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                activeCategory === cat
                  ? "bg-[var(--plum-100)] text-[var(--plum-700)] font-semibold"
                  : "hover:bg-[var(--cream-100)] text-[var(--ink-700)]"
              }`}
            >
              {CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]}
            </button>
          ))}
        </div>

        <div className="space-y-3 pr-2">
          <div className="text-xs uppercase tracking-wide text-[var(--ink-500)]">
            {normalizedQuery ? `Results (${filteredOptions.length})` : `${activeCategory} fields`}
          </div>
          {activeFields.length === 0 ? (
            <div className="rounded-xl border border-[var(--border)] bg-white p-4 text-sm text-[var(--ink-700)]">
              No fields match “{query}”.
            </div>
          ) : (
            <div className="space-y-2">
              {activeFields.map((field) => {
                const recommended = RECOMMENDED_LINKS[field.key] || [];
                const missingRecs = recommended.filter((r) => !selectedSet.has(r));
                return (
                  <div
                    key={field.key}
                    className="flex items-start justify-between gap-3 border border-[var(--border)] rounded-xl p-3"
                  >
                    <label className="flex items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedFields.includes(field.key)}
                        onChange={() => toggle(field.key)}
                      />
                      <span>{field.label}</span>
                    </label>
                    <div className="text-right">
                      {recommended.length > 0 ? (
                        <div className="text-[11px] text-[var(--ink-500)]">
                          Recommended with {recommended.map((r) => FIELD_OPTIONS.find((f) => f.key === r)?.label ?? r).join(", ")}
                        </div>
                      ) : null}
                      {missingRecs.length > 0 ? (
                        <button
                          type="button"
                          className="mt-1 text-[11px] text-[var(--plum-700)] underline"
                          onClick={() => addRecommended(field.key)}
                        >
                          Add recommended
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-l border-[var(--border)] pl-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Selected fields</div>
            <button
              type="button"
              className="text-xs text-[var(--plum-700)] underline"
              onClick={handleClear}
            >
              Clear
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {selectedFields.length === 0 ? (
              <div className="text-sm text-[var(--ink-500)]">No fields selected.</div>
            ) : (
              selectedFields.map((field) => {
                const label = FIELD_OPTIONS.find((f) => f.key === field)?.label ?? field;
                return (
                  <div
                    key={field}
                    className="flex items-center justify-between gap-2 border border-[var(--border)] rounded-full px-3 py-1 text-xs bg-[var(--cream-100)]"
                  >
                    <span>{label}</span>
                    <button type="button" aria-label="Remove field" onClick={() => removeField(field)}>
                      ×
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
