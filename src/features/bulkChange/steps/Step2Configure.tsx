import { useMemo } from "react";
import Button from "../../../components/Button";
import { Card, CardContent } from "../../../components/Card";
import Badge from "../../../components/Badge";
import type { Employee } from "../../people/people.data";
import { useBulkStore } from "../bulkChange.store";
import type { BulkField } from "../types";

const APPLY_FIELDS: { field: BulkField; label: string; type: "text"|"select" }[] = [
  { field: "workLocation", label: "Work location", type: "text" },
  { field: "department", label: "Department", type: "text" },
  { field: "team", label: "Team", type: "text" },
];

const EDIT_FIELDS: { field: BulkField; label: string; type: "text"|"number"|"select" }[] = [
  { field: "title", label: "Title", type: "text" },
  { field: "level", label: "Level (L1–L7)", type: "text" },
  { field: "cashComp", label: "Cash comp", type: "number" },
  { field: "targetBonusPct", label: "Target bonus %", type: "number" },
];

export default function Step2Configure({
  employees,
  onNext,
  onBack,
}: {
  employees: Employee[];
  onNext: () => void;
  onBack: () => void;
}) {
  const { draft, setApplyToAllField, setOverrideField, clearOverrideField } = useBulkStore();

  const selectedEmployees = useMemo(() => {
    const set = new Set(draft.selectedEmployeeIds);
    return employees.filter(e => set.has(e.id));
  }, [employees, draft.selectedEmployeeIds]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <Card className="col-span-4">
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Apply to all</div>
            <Badge tone="purple">{draft.selectedEmployeeIds.length} selected</Badge>
          </div>

          <div className="text-sm text-zinc-600">
            Set uniform values that apply to every selected employee. You can override per person in the grid.
          </div>

          <div className="space-y-2">
            {APPLY_FIELDS.map(({ field, label }) => (
              <div key={field} className="space-y-1">
                <div className="text-xs text-zinc-600">{label}</div>
                <input
                  className="h-9 w-full border border-zinc-200 rounded-md px-3 text-sm"
                  value={String(draft.applyToAll[field] ?? "")}
                  onChange={(e) => setApplyToAllField(field, e.target.value)}
                  placeholder={`Set ${label.toLowerCase()} for all`}
                />
              </div>
            ))}
          </div>

          <div className="pt-2 flex gap-2">
            <Button onClick={onBack}>Back</Button>
            <Button variant="primary" onClick={onNext}>Validate & preview</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-8">
        <CardContent className="space-y-3">
          <div className="text-sm font-semibold">Edit individually</div>
          <div className="text-sm text-zinc-600">
            Click a cell to edit. Values from “Apply to all” show as inherited; any per-employee override is marked.
          </div>

          <div className="overflow-auto border border-zinc-200 rounded-lg">
            <table className="min-w-[900px] w-full text-sm">
              <thead className="bg-zinc-50 text-zinc-600 border-b border-zinc-200">
                <tr>
                  <th className="p-2 text-left">Employee</th>
                  {EDIT_FIELDS.map(f => <th key={f.field} className="p-2 text-left">{f.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {selectedEmployees.slice(0, 40).map(e => (
                  <tr key={e.id} className="border-b border-zinc-100">
                    <td className="p-2">
                      <div className="font-medium">{e.name ?? e.fullName}</div>
                      <div className="text-xs text-zinc-500">{e.email}</div>
                    </td>

                    {EDIT_FIELDS.map(({ field, type }) => {
                      const hasOverride = draft.overrides[e.id]?.[field] !== undefined;
                      const inherited = !hasOverride && draft.applyToAll[field] !== undefined;
                      const value =
                        hasOverride ? draft.overrides[e.id]?.[field] :
                        draft.applyToAll[field] !== undefined ? draft.applyToAll[field] :
                        (e as any)[field];

                      return (
                        <td key={field} className="p-2 align-top">
                          <div className="flex items-center gap-2">
                            <input
                              className="h-9 w-44 border border-zinc-200 rounded-md px-2 text-sm"
                              value={String(value ?? "")}
                              onChange={(ev) => {
                                const raw = ev.target.value;
                                const v = type === "number" ? (raw === "" ? "" : Number(raw)) : raw;
                                setOverrideField(e.id, field, v);
                              }}
                            />
                            {inherited && <Badge tone="neutral">inherited</Badge>}
                            {hasOverride && (
                              <button
                                className="text-xs text-[#6B1B56] underline"
                                onClick={() => clearOverrideField(e.id, field)}
                                title="Clear override"
                              >
                                clear
                              </button>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-xs text-zinc-500">
            Showing up to 40 selected employees in this grid (prototype limitation).
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
