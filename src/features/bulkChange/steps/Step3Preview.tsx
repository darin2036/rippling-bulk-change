import { useMemo, useState } from "react";
import Button from "../../../components/Button";
import Badge from "../../../components/Badge";
import { Card, CardContent } from "../../../components/Card";
import type { Employee } from "../../people/people.data";
import { useBulkStore } from "../bulkChange.store";
import { computeDiff, summarizeByField } from "../grid/diff";
import { groupIssuesByEmployee, validateDraft } from "../grid/validation";
import { runBulkJob } from "../jobs/jobRunner";
import { uid } from "../../../lib/ids";
import type { BulkChangeJob } from "../types";
import { useNavigate } from "react-router-dom";

export default function Step3Preview({ employees, onBack }: { employees: Employee[]; onBack: () => void }) {
  const nav = useNavigate();
  const { draft, addJob, updateJob } = useBulkStore();
  const [running, setRunning] = useState(false);
  const [progressMsg, setProgressMsg] = useState<string | null>(null);

  const selectedEmployees = useMemo(() => {
    const set = new Set(draft.selectedEmployeeIds);
    return employees.filter(e => set.has(e.id));
  }, [employees, draft.selectedEmployeeIds]);

  const diff = useMemo(() => computeDiff(selectedEmployees, draft), [selectedEmployees, draft]);
  const summary = useMemo(() => summarizeByField(diff), [diff]);

  const issues = useMemo(() => validateDraft(selectedEmployees, draft), [selectedEmployees, draft]);
  const issuesByEmp = useMemo(() => groupIssuesByEmployee(issues), [issues]);
  const blocking = issues.some(i => i.severity === "error");

  async function run() {
    setRunning(true);
    setProgressMsg("Starting job...");
    const jobId = uid("job");
    const initialJob: BulkChangeJob = {
      id: jobId,
      createdAt: Date.now(),
      createdBy: draft.createdBy,
      employeeIds: draft.selectedEmployeeIds,
      status: "Running",
      auditLog: [{ at: Date.now(), message: "Job started" }],
      results: [],
      processedCount: 0,
      totalCount: draft.selectedEmployeeIds.length,
      draftSnapshot: draft,
    };
    addJob(initialJob);

    const finalJob = await runBulkJob(draft, draft.selectedEmployeeIds, (p) => {
      setProgressMsg(`${p.processedCount}/${draft.selectedEmployeeIds.length} processed — ${p.audit}`);
      updateJob({
        ...initialJob,
        processedCount: p.processedCount,
        results: p.results,
        auditLog: [...initialJob.auditLog, { at: Date.now(), message: p.audit }],
        status: "Running",
      });
    });

    updateJob(finalJob);
    setProgressMsg(null);
    setRunning(false);
    nav(`/jobs/${finalJob.id}`);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="text-sm font-semibold">Preview changes</div>
            <div className="text-sm text-zinc-600">
              Showing diffs for <span className="font-semibold text-zinc-900">{selectedEmployees.length}</span> employees.
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <Button onClick={onBack}>Back</Button>
            <Button variant="primary" disabled={blocking || running || selectedEmployees.length === 0} onClick={run}>
              {running ? "Running..." : "Run bulk change"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {progressMsg && (
        <Card>
          <CardContent className="text-sm">{progressMsg}</CardContent>
        </Card>
      )}

      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-4">
          <CardContent className="space-y-3">
            <div className="text-sm font-semibold">Summary</div>
            <div className="space-y-2">
              {Object.keys(summary).length === 0 && (
                <div className="text-sm text-zinc-600">No changes detected yet.</div>
              )}
              {Object.entries(summary).map(([field, count]) => (
                <div key={field} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-700">{field}</span>
                  <Badge tone="purple">{count}</Badge>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <div className="text-sm font-semibold">Validation</div>
              {issues.length === 0 ? (
                <div className="text-sm text-emerald-700 mt-2">No blocking issues ✅</div>
              ) : (
                <div className="space-y-2 mt-2">
                  <div className="text-sm text-red-700">
                    {blocking ? "Fix errors before running." : "Warnings present."}
                  </div>
                  <div className="text-xs text-zinc-600">
                    {issues.length} issue(s) across {Object.keys(issuesByEmp).length} employee(s)
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-8">
          <CardContent className="space-y-3">
            <div className="text-sm font-semibold">Diffs (before → after)</div>
            <div className="overflow-auto border border-zinc-200 rounded-lg">
              <table className="min-w-[900px] w-full text-sm">
                <thead className="bg-zinc-50 text-zinc-600 border-b border-zinc-200">
                  <tr>
                    <th className="p-2 text-left">Employee</th>
                    <th className="p-2 text-left">Field</th>
                    <th className="p-2 text-left">Before</th>
                    <th className="p-2 text-left">After</th>
                    <th className="p-2 text-left">Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {diff.length === 0 && (
                    <tr><td className="p-3 text-zinc-600" colSpan={5}>No diffs yet. Go back and configure changes.</td></tr>
                  )}
                  {diff.slice(0, 200).map((d, idx) => (
                    <tr key={idx} className="border-b border-zinc-100">
                      <td className="p-2 font-medium">{d.employeeName}</td>
                      <td className="p-2">{d.field}</td>
                      <td className="p-2 text-zinc-600">{String(d.before)}</td>
                      <td className="p-2">{String(d.after)}</td>
                      <td className="p-2">
                        {(issuesByEmp[d.employeeId] || [])
                          .filter(i => i.field === d.field)
                          .map((i, j) => <Badge key={j} tone="red">{i.message}</Badge>)
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {diff.length > 200 && (
              <div className="text-xs text-zinc-500">Showing first 200 diffs (prototype limit).</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
