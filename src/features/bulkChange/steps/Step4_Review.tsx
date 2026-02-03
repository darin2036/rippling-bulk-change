import { useMemo } from "react";
import type { Employee } from "../../people/people.data";
import type { ApplyToAll, BulkField, OverridesByEmployee } from "../types";

type Props = {
  employees: Employee[];
  selectedIds: string[];
  fields: BulkField[];
  applyToAll: ApplyToAll;
  overrides: OverridesByEmployee;
};

const LABELS: Partial<Record<BulkField, string>> = {
  department: "Department",
  managerId: "Manager",
  location: "Work location",
  title: "Title",
};

function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M4 10h11M12 6l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Avatar({ name }: { name: string }) {
  const letter = (name.trim()[0] || "?").toUpperCase();
  return (
    <div className="w-7 h-7 rounded-full bg-[var(--plum-100)] border border-[var(--plum-200)] text-[var(--plum-700)] flex items-center justify-center text-xs font-semibold">
      {letter}
    </div>
  );
}

export default function Step4Review({ employees, selectedIds, fields, applyToAll, overrides }: Props) {
  const selectedEmployees = useMemo(
    () => employees.filter((e) => selectedIds.includes(e.id)),
    [employees, selectedIds]
  );
  const managerMap = useMemo(() => new Map(employees.map((e) => [e.id, e.fullName])), [employees]);

  const groups = useMemo(() => {
    const out: {
      field: BulkField;
      label: string;
      rows: { emp: Employee; beforeRaw: unknown; afterRaw: unknown; before: string; after: string }[];
    }[] = [];

    for (const field of fields) {
      const label = LABELS[field] ?? field;
      const rows: { emp: Employee; beforeRaw: unknown; afterRaw: unknown; before: string; after: string }[] = [];

      for (const emp of selectedEmployees) {
        const beforeRaw = (emp as any)[field];
        const override = overrides[emp.id]?.[field];
        const applied = applyToAll[field];
        const afterRaw = override !== undefined ? override : applied;

        // If the user didn't specify a new value, treat it as no change.
        if (afterRaw === undefined || afterRaw === null || afterRaw === "") continue;

        const same = JSON.stringify(beforeRaw) === JSON.stringify(afterRaw);
        if (same) continue;

        const before =
          field === "managerId"
            ? beforeRaw
              ? managerMap.get(String(beforeRaw)) ?? "—"
              : "—"
            : String(beforeRaw ?? "—");
        const after =
          field === "managerId"
            ? managerMap.get(String(afterRaw)) ?? "—"
            : String(afterRaw ?? "—");

        rows.push({ emp, beforeRaw, afterRaw, before, after });
      }

      if (rows.length > 0) out.push({ field, label, rows });
    }

    return out;
  }, [applyToAll, fields, managerMap, overrides, selectedEmployees]);

  return (
    <div className="space-y-4">
      {groups.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-white p-4 text-sm text-[var(--ink-700)]">
          No changes to review.
        </div>
      ) : null}

      {groups.map((g) => (
        <div key={g.field} className="space-y-2">
          <div className="text-sm font-semibold">{g.label}</div>
          <div className="overflow-auto border border-[var(--border)] rounded-xl bg-white">
            <table className="min-w-[720px] w-full text-sm">
              <thead className="bg-[var(--cream-100)] text-[var(--ink-500)] border-b border-[var(--border)]">
                <tr>
                  <th className="p-3 text-left">Employee</th>
                  <th className="p-3 text-left">Current</th>
                  <th className="p-3 text-left">New</th>
                </tr>
              </thead>
              <tbody>
                {g.rows.map((r) => (
                  <tr key={`${g.field}-${r.emp.id}`} className="border-b border-[var(--border)] last:border-b-0">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={r.emp.fullName} />
                        <div>
                          <div className="font-medium">{r.emp.fullName}</div>
                          <div className="text-xs text-[var(--ink-500)]">{r.emp.title}, {r.emp.department}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-[var(--ink-700)]">{r.before}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2 text-[var(--ink-900)] font-medium">
                        <Arrow />
                        <span>{r.after}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
