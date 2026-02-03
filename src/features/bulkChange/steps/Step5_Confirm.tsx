import { useMemo } from "react";
import type { Employee } from "../../people/people.data";
import type { BulkField, ValidationIssue } from "../types";

const REASONS = [
  "Executive approval",
  "Policy exception",
  "Data correction",
  "Emergency payroll",
  "Other",
];

type ExceptionOverride = {
  reason: string;
  note?: string;
  appliedBy: string;
  appliedAt: number;
};

export default function Step5Confirm({
  selectedCount,
  selectedFields,
  fieldLabels,
  selectedEmployees,
  issues,
  exceptionOverrides,
  onChangeExceptionOverride,
}: {
  selectedCount: number;
  selectedFields: BulkField[];
  fieldLabels: Partial<Record<BulkField, string>>;
  selectedEmployees: Employee[];
  issues: ValidationIssue[];
  exceptionOverrides?: Record<string, ExceptionOverride>;
  onChangeExceptionOverride: (employeeId: string, override: ExceptionOverride | null) => void;
}) {
  const preview = selectedEmployees.slice(0, 6);
  const fields = selectedFields.map((f) => fieldLabels[f] ?? f);
  const issuesByEmployee = useMemo(() => {
    const map = new Map<string, ValidationIssue[]>();
    issues.forEach((i) => {
      const list = map.get(i.employeeId) || [];
      list.push(i);
      map.set(i.employeeId, list);
    });
    return map;
  }, [issues]);
  const hasBlockingIssues = issues.length > 0;
  const exceptionMap = exceptionOverrides || {};
  const missingOverrideCount = useMemo(() => {
    if (issuesByEmployee.size === 0) return 0;
    let missing = 0;
    issuesByEmployee.forEach((_issues, employeeId) => {
      const o = exceptionMap[employeeId];
      if (!o) {
        missing += 1;
        return;
      }
      if (!o.reason || o.reason.trim().length === 0) {
        missing += 1;
        return;
      }
      if (o.reason === "Other" && (!o.note || o.note.trim().length === 0)) {
        missing += 1;
      }
    });
    return missing;
  }, [issuesByEmployee, exceptionMap]);

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

      <div className="rounded-xl border border-[var(--border)] bg-white p-4 space-y-3">
        <div className="text-sm font-semibold">Validation checks</div>
        {issues.length === 0 ? (
          <div className="text-sm text-emerald-700">No blocking issues found.</div>
        ) : (
          <>
            <div className="text-sm text-[var(--ink-700)]">
              {issues.length} issue(s) across {issuesByEmployee.size} employee(s) must be resolved or overridden.
            </div>
            <div className="border border-[var(--border)] rounded-xl overflow-hidden">
              <table className="min-w-[600px] w-full text-sm">
                <thead className="bg-[var(--cream-100)] text-[var(--ink-500)] border-b border-[var(--border)]">
                  <tr>
                    <th className="p-3 text-left">Employee</th>
                    <th className="p-3 text-left">Issue</th>
                    <th className="p-3 text-left">Override</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from(issuesByEmployee.entries()).slice(0, 8).map(([employeeId, employeeIssues], idx) => {
                    const emp = selectedEmployees.find((e) => e.id === employeeId);
                    const current = exceptionMap[employeeId];
                    const reason = current?.reason ?? "";
                    const note = current?.note ?? "";
                    const enabled = !!current;
                    const invalid = reason.trim().length === 0 || (reason === "Other" && note.trim().length === 0);
                    return (
                      <tr key={`${employeeId}-${idx}`} className="border-b border-[var(--border)] last:border-b-0">
                        <td className="p-3">
                          <div className="font-medium">{emp?.fullName || employeeId}</div>
                          <div className="text-xs text-[var(--ink-500)]">{emp?.email}</div>
                        </td>
                        <td className="p-3">
                          <div className="space-y-1">
                            {employeeIssues.map((issue, issueIdx) => (
                              <div key={issueIdx}>{issue.message}</div>
                            ))}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs">
                              <input
                                type="checkbox"
                                checked={enabled}
                                onChange={(e) => {
                                  if (!e.target.checked) {
                                    onChangeExceptionOverride(employeeId, null);
                                    return;
                                  }
                                  onChangeExceptionOverride(employeeId, {
                                    reason: "Executive approval",
                                    appliedBy: "Darin",
                                    appliedAt: Date.now(),
                                  });
                                }}
                              />
                              Override
                            </label>
                            {enabled ? (
                              <div className="space-y-2">
                                <select
                                  className="h-8 w-full border border-[var(--border)] rounded-lg bg-white px-2 text-xs"
                                  value={reason}
                                  onChange={(e) =>
                                    onChangeExceptionOverride(employeeId, {
                                      reason: e.target.value,
                                      note: note.trim().length ? note : undefined,
                                      appliedBy: "Darin",
                                      appliedAt: Date.now(),
                                    })
                                  }
                                >
                                  <option value="">Select a reason</option>
                                  {REASONS.map((r) => (
                                    <option key={r} value={r}>
                                      {r}
                                    </option>
                                  ))}
                                </select>
                                <textarea
                                  className="w-full min-h-[70px] border border-[var(--border)] rounded-lg bg-white p-2 text-xs"
                                  placeholder="Add notes for audit logs..."
                                  value={note}
                                  onChange={(e) =>
                                    onChangeExceptionOverride(employeeId, {
                                      reason: reason,
                                      note: e.target.value,
                                      appliedBy: "Darin",
                                      appliedAt: Date.now(),
                                    })
                                  }
                                />
                                {invalid ? (
                                  <div className="text-[10px] text-amber-900">
                                    Provide a reason and notes when selecting Other.
                                  </div>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {issuesByEmployee.size > 8 ? (
                    <tr>
                      <td colSpan={3} className="p-3 text-xs text-[var(--ink-500)]">
                        And {issuesByEmployee.size - 8} more…
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </>
        )}
        {hasBlockingIssues && missingOverrideCount > 0 ? (
          <div className="text-xs text-[var(--ink-500)]">
            Add an exception override for each affected employee to proceed with unresolved issues.
          </div>
        ) : null}
      </div>
    </div>
  );
}
