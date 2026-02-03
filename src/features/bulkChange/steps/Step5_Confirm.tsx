import type { Employee } from "../../people/people.data";
import type { BulkField } from "../types";

export default function Step5Confirm({
  selectedCount,
  selectedFields,
  fieldLabels,
  selectedEmployees,
}: {
  selectedCount: number;
  selectedFields: BulkField[];
  fieldLabels: Record<BulkField, string>;
  selectedEmployees: Employee[];
}) {
  const preview = selectedEmployees.slice(0, 6);
  const fields = selectedFields.map((f) => fieldLabels[f] ?? f);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--cream-100)] p-4">
        <div className="text-sm font-semibold">Ready to run</div>
        <div className="text-sm text-[var(--ink-700)] mt-1">
          This bulk change will run a job that validates and propagates updates across connected systems.
        </div>
        <div className="text-xs text-[var(--ink-500)] mt-2">
          You can track progress and view errors in the job detail page.
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-white p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-sm font-semibold">Summary</div>
            <div className="text-sm text-[var(--ink-500)] mt-1">
              People affected: <span className="font-semibold text-[var(--ink-900)]">{selectedCount}</span>
            </div>
          </div>
          <div className="text-sm text-[var(--ink-500)]">
            Fields: <span className="font-medium text-[var(--ink-900)]">{fields.join(", ") || "—"}</span>
          </div>
        </div>

        <div className="mt-3 overflow-auto border border-[var(--border)] rounded-xl">
          <table className="min-w-[600px] w-full text-sm">
            <thead className="bg-[var(--cream-100)] text-[var(--ink-500)] border-b border-[var(--border)]">
              <tr>
                <th className="p-3 text-left">Employee</th>
                <th className="p-3 text-left">Department</th>
                <th className="p-3 text-left">Title</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((e) => (
                <tr key={e.id} className="border-b border-[var(--border)] last:border-b-0">
                  <td className="p-3">
                    <div className="font-medium">{e.fullName}</div>
                    <div className="text-xs text-[var(--ink-500)]">{e.email}</div>
                  </td>
                  <td className="p-3">{e.department}</td>
                  <td className="p-3">{e.title}</td>
                </tr>
              ))}
              {selectedCount > preview.length ? (
                <tr>
                  <td colSpan={3} className="p-3 text-xs text-[var(--ink-500)]">
                    And {selectedCount - preview.length} more…
                  </td>
                </tr>
              ) : null}
              {selectedCount === 0 ? (
                <tr>
                  <td colSpan={3} className="p-3 text-sm text-[var(--ink-500)]">
                    No people selected.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

