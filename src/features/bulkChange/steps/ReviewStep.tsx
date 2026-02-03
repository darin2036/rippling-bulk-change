import type { Employee } from "../../people/people.data";
import type { BulkFieldSelection } from "./SelectFieldsStep";

type Props = {
  originalEmployees: Employee[];
  updatedEmployees: Employee[];
  selectedIds: string[];
  fields: BulkFieldSelection;
  compact?: boolean;
};

export default function ReviewStep({
  originalEmployees,
  updatedEmployees,
  selectedIds,
  fields,
  compact = false,
}: Props) {
  const originalMap = new Map(originalEmployees.map((e) => [e.id, e]));
  const managerMap = new Map(originalEmployees.map((e) => [e.id, e.fullName]));
  const rows = updatedEmployees.filter((e) => selectedIds.includes(e.id));

  const renderValue = (emp: Employee, key: keyof Employee) => {
    if (key === "managerId" || key === "matrixManagerId") {
      const id = emp[key] as string | null | undefined;
      return id ? managerMap.get(id) ?? "—" : "—";
    }
    return String(emp[key] ?? "—");
  };

  const columns: { key: keyof Employee; label: string; enabled: boolean }[] = [
    { key: "title", label: "Job title", enabled: fields.title },
    { key: "department", label: "Department", enabled: fields.department },
    { key: "managerId", label: "Manager", enabled: fields.manager },
    { key: "employmentType", label: "Employment type", enabled: fields.employmentType },
    { key: "workSchedule", label: "Work schedule", enabled: fields.workSchedule },
    { key: "startDate", label: "Start date", enabled: fields.startDate },
    { key: "terminationDate", label: "Termination date", enabled: fields.terminationDate },
    { key: "location", label: "Work location", enabled: fields.location },
    { key: "costCenter", label: "Cost center", enabled: fields.costCenter },
    { key: "division", label: "Division", enabled: fields.division },
    { key: "businessUnit", label: "Business unit", enabled: fields.businessUnit },
    { key: "teamMemberships", label: "Team memberships", enabled: fields.teamMemberships },
    { key: "matrixManagerId", label: "Matrix manager", enabled: fields.matrixManager },
  ];

  return (
    <div className="space-y-3">
      {!compact ? (
        <div className="text-sm text-[var(--ink-500)]">
          Review the changes before you apply them.
        </div>
      ) : null}
      <div className="overflow-auto border border-[var(--border)] rounded-xl">
        <table className="min-w-[800px] w-full text-sm">
          <thead className="bg-[var(--cream-100)] text-[var(--ink-500)] border-b border-[var(--border)]">
            <tr>
              <th className="p-3 text-left">Person</th>
              {columns
                .filter((col) => col.enabled)
                .map((col) => (
                  <th key={col.label} className="p-3 text-left">
                    {col.label}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((updated) => {
              const original = originalMap.get(updated.id);
              if (!original) return null;
              return (
                <tr key={updated.id} className="border-b border-[var(--border)]">
                  <td className="p-3">
                    <div className="font-medium">{updated.fullName}</div>
                    <div className="text-xs text-[var(--ink-500)]">{updated.email}</div>
                  </td>
                  {columns
                    .filter((col) => col.enabled)
                    .map((col) => (
                      <td key={`${updated.id}-${col.label}`} className="p-3">
                        <div className="text-xs text-[var(--ink-500)]">{renderValue(original, col.key)}</div>
                        <div className="font-medium">{renderValue(updated, col.key)}</div>
                      </td>
                    ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
