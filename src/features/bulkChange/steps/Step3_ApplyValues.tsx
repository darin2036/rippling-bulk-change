import { useMemo, useState } from "react";
import type { Employee } from "../../people/people.data";
import type { ApplyToAll, BulkField, OverridesByEmployee } from "../types";

type Props = {
  employees: Employee[];
  selectedIds: string[];
  fields: BulkField[];
  applyToAll: ApplyToAll;
  overrides: OverridesByEmployee;
  onSetApplyToAllField: (field: BulkField, value: string) => void;
  onSetOverrideField: (employeeId: string, field: BulkField, value: string) => void;
  onClearOverrideField: (employeeId: string, field: BulkField) => void;
  departments: string[];
  locations: string[];
};

const LABELS: Record<BulkField, string> = {
  department: "Department",
  managerId: "Manager",
  location: "Location",
  title: "Title",
  workLocation: "Work location",
  team: "Team",
  level: "Level",
  cashComp: "Cash comp",
  targetBonusPct: "Target bonus %",
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
  departments,
  locations,
}: Props) {
  const [showOverrides, setShowOverrides] = useState(false);
  const selectedEmployees = useMemo(
    () => employees.filter((e) => selectedIds.includes(e.id)),
    [employees, selectedIds]
  );

  const managerOptions = useMemo(
    () => employees.map((e) => ({ id: e.id, name: e.fullName })),
    [employees]
  );

  const renderFieldInput = (field: BulkField, value: string) => {
    if (field === "department") {
      return (
        <select
          className="w-full border border-[var(--border)] rounded-xl px-3 py-2 bg-white text-sm"
          value={value}
          onChange={(e) => onSetApplyToAllField(field, e.target.value)}
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
          value={value}
          onChange={(e) => onSetApplyToAllField(field, e.target.value)}
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
    if (field === "location") {
      return (
        <select
          className="w-full border border-[var(--border)] rounded-xl px-3 py-2 bg-white text-sm"
          value={value}
          onChange={(e) => onSetApplyToAllField(field, e.target.value)}
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
    return (
      <input
        className="w-full border border-[var(--border)] rounded-xl px-3 py-2 bg-white text-sm"
        value={value}
        onChange={(e) => onSetApplyToAllField(field, e.target.value)}
        placeholder="Enter title"
      />
    );
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-[var(--ink-500)]">Apply values to all selected people.</div>
      <div className="grid md:grid-cols-2 gap-4">
        {fields.map((field) => (
          <div key={field} className="space-y-2">
            <div className="text-sm font-semibold">{LABELS[field]}</div>
            {renderFieldInput(field, String(applyToAll[field] ?? ""))}
          </div>
        ))}
      </div>

      <div className="pt-2">
        <button
          type="button"
          className="text-sm text-[var(--plum-700)] underline"
          onClick={() => setShowOverrides((prev) => !prev)}
        >
          {showOverrides ? "Hide overrides" : "Add overrides"}
        </button>
      </div>

      {showOverrides ? (
        <div className="border border-[var(--border)] rounded-xl overflow-auto">
          <table className="min-w-[800px] w-full text-sm">
            <thead className="bg-[var(--cream-100)] text-[var(--ink-500)] border-b border-[var(--border)]">
              <tr>
                <th className="p-3 text-left">Person</th>
                {fields.map((field) => (
                  <th key={field} className="p-3 text-left">
                    {LABELS[field]}
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
                  {fields.map((field) => (
                    <td key={`${emp.id}-${field}`} className="p-3">
                      <input
                        className="w-full border border-[var(--border)] rounded-lg px-2 py-1 text-sm"
                        value={String(overrides[emp.id]?.[field] ?? "")}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (!v) onClearOverrideField(emp.id, field);
                          else onSetOverrideField(emp.id, field, v);
                        }}
                        placeholder="Override"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
