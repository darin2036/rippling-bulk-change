import { useMemo } from "react";
import type { Employee } from "../../people/people.data";
import type { ApplyToAll, BulkField, OverridesByEmployee } from "../types";
import ScheduleControls from "../components/ScheduleControls";

type Props = {
  employees: Employee[];
  selectedIds: string[];
  fields: BulkField[];
  applyToAll: ApplyToAll;
  overrides: OverridesByEmployee;
  onSetApplyToAllField: (field: BulkField, value: string | number) => void;
  onSetOverrideField: (employeeId: string, field: BulkField, value: string | number) => void;
  onClearOverrideField: (employeeId: string, field: BulkField) => void;
  effectiveMode: "immediate" | "scheduled";
  effectiveAt?: number | null;
  onChangeEffectiveSchedule: (mode: "immediate" | "scheduled", at?: number | null) => void;
  departments: string[];
  locations: string[];
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
  applyToAll,
  overrides,
  onSetApplyToAllField,
  onSetOverrideField,
  onClearOverrideField,
  effectiveMode,
  effectiveAt,
  onChangeEffectiveSchedule,
  departments,
  locations,
}: Props) {
  const selectedEmployees = useMemo(
    () => employees.filter((e) => selectedIds.includes(e.id)),
    [employees, selectedIds]
  );

  const managerOptions = useMemo(
    () => employees.map((e) => ({ id: e.id, name: e.fullName })),
    [employees]
  );

  const renderFieldInput = (
    field: BulkField,
    value: string | number,
    onChange: (next: string | number) => void,
    placeholder?: string
  ) => {
    const stringValue = value === undefined || value === null ? "" : String(value);
    if (field === "department") {
      return (
        <select
          className="w-full border border-[var(--border)] rounded-xl px-3 py-2 bg-white text-sm"
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select department</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
      );
    }
    if (field === "managerId") {
      return (
        <select
          className="w-full border border-[var(--border)] rounded-xl px-3 py-2 bg-white text-sm"
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select manager</option>
          {managerOptions.map((mgr) => (
            <option key={mgr.id} value={mgr.id}>
              {mgr.name}
            </option>
          ))}
        </select>
      );
    }
    if (field === "location" || field === "workLocation") {
      return (
        <select
          className="w-full border border-[var(--border)] rounded-xl px-3 py-2 bg-white text-sm"
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select location</option>
          {locations.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>
      );
    }
    if (field === "payPeriod") {
      return (
        <select
          className="w-full border border-[var(--border)] rounded-xl px-3 py-2 bg-white text-sm"
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select pay period</option>
          {["Annual", "Hourly"].map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }
    if (field === "status") {
      return (
        <select
          className="w-full border border-[var(--border)] rounded-xl px-3 py-2 bg-white text-sm"
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select status</option>
          {["Active", "Invited", "Inactive"].map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }
    if (field === "employmentType") {
      return (
        <select
          className="w-full border border-[var(--border)] rounded-xl px-3 py-2 bg-white text-sm"
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select employment type</option>
          {["Full-time", "Part-time", "Contractor", "Intern"].map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }
    if (field === "level") {
      return (
        <select
          className="w-full border border-[var(--border)] rounded-xl px-3 py-2 bg-white text-sm"
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select level</option>
          {["L1", "L2", "L3", "L4", "L5", "L6", "L7"].map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }
    if (field === "startDate" || field === "endDate") {
      return (
        <input
          type="date"
          className="w-full border border-[var(--border)] rounded-xl px-3 py-2 bg-white text-sm"
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    }
    if (field === "cashComp" || field === "targetBonusPct") {
      return (
        <input
          type="number"
          className="w-full border border-[var(--border)] rounded-xl px-3 py-2 bg-white text-sm"
          value={stringValue}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") onChange("");
            else onChange(Number(raw));
          }}
          placeholder={placeholder}
        />
      );
    }
    return (
      <input
        className="w-full border border-[var(--border)] rounded-xl px-3 py-2 bg-white text-sm"
        value={stringValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    );
  };

  return (
    <div className="space-y-4">
      <ScheduleControls
        mode={effectiveMode}
        effectiveAt={effectiveAt}
        onChange={onChangeEffectiveSchedule}
        label="When should these changes take effect?"
      />

      <div className="text-sm text-[var(--ink-500)]">
        Edit directly in the grid. The top row applies to all selected people; per-person cells override.
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
            <tr className="border-b border-[var(--border)] bg-[var(--cream-100)]/60">
              <td className="p-3 font-semibold">Apply to all</td>
              {fields.map((field) => (
                <td key={`apply-${field}`} className="p-3">
                  {renderFieldInput(field, applyToAll[field] ?? "", (next) => onSetApplyToAllField(field, next))}
                </td>
              ))}
            </tr>
            {selectedEmployees.map((emp) => (
              <tr key={emp.id} className="border-b border-[var(--border)]">
                <td className="p-3">
                  <div className="font-medium">{emp.fullName}</div>
                  <div className="text-xs text-[var(--ink-500)]">{emp.email}</div>
                </td>
                {fields.map((field) => {
                  const overrideValue = overrides[emp.id]?.[field];
                  const placeholder = applyToAll[field] ? String(applyToAll[field]) : "—";
                  return (
                    <td key={`${emp.id}-${field}`} className="p-3">
                      <div className={overrideValue !== undefined && overrideValue !== "" ? "rounded-lg ring-1 ring-[var(--plum-300)]" : ""}>
                        {renderFieldInput(field, overrideValue ?? "", (next) => {
                          if (next === "" || next === undefined) onClearOverrideField(emp.id, field);
                          else onSetOverrideField(emp.id, field, next);
                        }, placeholder)}
                      </div>
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
