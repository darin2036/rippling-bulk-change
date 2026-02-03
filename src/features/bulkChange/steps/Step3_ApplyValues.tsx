import { useEffect, useMemo } from "react";
import type { Employee } from "../../people/people.data";
import type { BulkField, OverridesByEmployee } from "../types";
import ScheduleControls from "../components/ScheduleControls";

type Props = {
  employees: Employee[];
  selectedIds: string[];
  fields: BulkField[];
  overrides: OverridesByEmployee;
  onSetOverrideField: (employeeId: string, field: BulkField, value: string | number) => void;
  effectiveMode: "immediate" | "scheduled";
  effectiveAt?: number | null;
  onChangeEffectiveSchedule: (mode: "immediate" | "scheduled", at?: number | null) => void;
};

const LABELS: Partial<Record<BulkField, string>> = {
  department: "Department",
  managerId: "Manager",
  location: "Location",
  title: "Title",
  workLocation: "Work location",
  team: "Team",
  level: "Level",
  cashComp: "Cash comp",
  targetBonusPct: "Target bonus %",
  payPeriod: "Pay period",
  status: "Status",
  startDate: "Start date",
  endDate: "End date",
  employmentType: "Employment type",
  jurisdiction: "Jurisdiction",
  legalEntity: "Legal entity",
};

export default function Step3ApplyValues({
  employees,
  selectedIds,
  fields,
  overrides,
  onSetOverrideField,
  effectiveMode,
  effectiveAt,
  onChangeEffectiveSchedule,
}: Props) {
  const selectedEmployees = useMemo(
    () => employees.filter((e) => selectedIds.includes(e.id)),
    [employees, selectedIds]
  );

  const managerIdToName = useMemo(() => new Map(employees.map((e) => [e.id, e.fullName])), [employees]);
  const managerLookup = useMemo(() => {
    const map = new Map<string, string>();
    employees.forEach((e) => {
      map.set(e.id.toLowerCase(), e.id);
      map.set(e.fullName.toLowerCase(), e.id);
      if ((e as any).email) map.set(String((e as any).email).toLowerCase(), e.id);
    });
    return map;
  }, [employees]);

  const normalizeFieldValue = (value: unknown): string | number => {
    if (typeof value === "number") return value;
    if (typeof value === "string") return value;
    return "";
  };

  const getManagerDisplayValue = (raw: unknown) => {
    const value = String(raw ?? "");
    return managerIdToName.get(value) ?? value;
  };

  const resolveManagerInput = (raw: string) => {
    const trimmed = raw.trim();
    if (trimmed.length === 0) return "";
    const resolved = managerLookup.get(trimmed.toLowerCase());
    return resolved ?? trimmed;
  };

  useEffect(() => {
    if (fields.length === 0 || selectedEmployees.length === 0) return;
    selectedEmployees.forEach((emp) => {
      fields.forEach((field) => {
        const existing = overrides[emp.id]?.[field];
        if (existing !== undefined) return;
        const currentValue = (emp as any)[field];
        onSetOverrideField(emp.id, field, normalizeFieldValue(currentValue));
      });
    });
  }, [fields, selectedEmployees, overrides, onSetOverrideField]);

  return (
    <div className="space-y-4">
      <ScheduleControls
        mode={effectiveMode}
        effectiveAt={effectiveAt}
        onChange={onChangeEffectiveSchedule}
        label="When should these changes take effect?"
      />

      <div className="text-sm text-[var(--ink-500)]">
        Edit directly in the table. Cells start with current values and save as you type.
      </div>

      <div className="border border-[var(--border)] rounded-xl overflow-auto bg-white">
        <table className="min-w-[980px] w-full text-sm">
          <thead className="bg-[var(--cream-100)] text-[var(--ink-500)] border-b border-[var(--border)]">
            <tr>
              <th className="p-3 text-left">Person</th>
              {fields.map((field) => (
                <th key={field} className="p-3 text-left">
                  {LABELS[field] ?? field}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {selectedEmployees.map((emp) => (
              <tr key={emp.id} className="border-b border-[var(--border)]">
                <td className="p-3">
                  <div className="font-medium">{emp.fullName}</div>
                  <div className="text-xs text-[var(--ink-500)]">{emp.email}</div>
                </td>
                {fields.map((field) => {
                  const overrideValue = overrides[emp.id]?.[field];
                  const inputValue =
                    field === "managerId"
                      ? getManagerDisplayValue(overrideValue)
                      : normalizeFieldValue(overrideValue);
                  return (
                    <td key={`${emp.id}-${field}`} className="p-3">
                      <input
                        type={field === "cashComp" || field === "targetBonusPct" ? "number" : field === "startDate" || field === "endDate" ? "date" : "text"}
                        className="w-full border border-[var(--border)] rounded-xl px-3 py-2 bg-white text-sm"
                        value={inputValue}
                        placeholder={field === "managerId" ? "Manager name or id" : undefined}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === "") {
                            onSetOverrideField(emp.id, field, "");
                            return;
                          }
                          if (field === "cashComp" || field === "targetBonusPct") {
                            const num = Number(raw);
                            if (Number.isFinite(num)) onSetOverrideField(emp.id, field, num);
                            return;
                          }
                          if (field === "managerId") {
                            onSetOverrideField(emp.id, field, resolveManagerInput(raw));
                            return;
                          }
                          onSetOverrideField(emp.id, field, raw);
                        }}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
