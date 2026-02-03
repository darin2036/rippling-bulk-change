import { Link } from "react-router-dom";
import { Card, CardContent } from "../../../components/Card";
import Badge from "../../../components/Badge";
import { useBulkStore } from "../bulkChange.store";
import type { BulkChangeJob, BulkField } from "../types";

const FIELD_LABELS: Record<BulkField, string> = {
  department: "Department",
  location: "Location",
  workLocation: "Work location",
  managerId: "Manager",
  team: "Team",
  title: "Title",
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

function jobName(job: BulkChangeJob) {
  const fields = job.draftSnapshot.selectedFields
    .map((f) => FIELD_LABELS[f] ?? f)
    .slice(0, 4)
    .join(", ");
  if (job.kind === "csv") return `CSV import: ${fields || "Update"}`;
  return `Bulk change: ${fields || "Update"}`;
}

function overrideSummary(job: BulkChangeJob) {
  const overrides = job.draftSnapshot.exceptionOverrides;
  if (!overrides || Object.keys(overrides).length === 0) return null;
  const counts = Object.values(overrides).reduce<Record<string, number>>((acc, o) => {
    const key = o.reason || "Unspecified";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const topReasons = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([reason, count]) => `${reason} ${count}`);
  const reasonText = topReasons.length > 0 ? ` · ${topReasons.join(", ")}` : "";
  return `Overrides: ${total}${reasonText}`;
}

function statusTone(status: BulkChangeJob["status"]) {
  if (status === "Ready") return "purple" as const;
  if (status === "Canceled") return "neutral" as const;
  if (status === "Running") return "purple" as const;
  if (status === "Completed") return "green" as const;
  if (status === "CompletedWithErrors") return "amber" as const;
  if (status === "Failed") return "red" as const;
  return "neutral" as const;
}

export default function ScheduledJobsPage() {
  const { jobs, cancelJob } = useBulkStore();
  const now = Date.now();
  const scheduledJobs = jobs
    .filter(
      (j) =>
        j.status !== "Canceled" &&
        (j.status === "Ready" || j.draftSnapshot.effectiveMode === "scheduled") &&
        !!j.draftSnapshot.effectiveAt &&
        j.draftSnapshot.effectiveAt > now
    )
    .sort((a, b) => (a.draftSnapshot.effectiveAt ?? 0) - (b.draftSnapshot.effectiveAt ?? 0));

  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm text-[var(--ink-500)]">Jobs</div>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">Scheduled updates</h1>
        <div className="text-sm text-[var(--ink-500)]">Upcoming bulk changes that have not run yet.</div>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-[var(--cream-100)] text-[var(--ink-500)] border-b border-[var(--border)]">
              <tr>
                <th className="p-3 text-left">Job</th>
                <th className="p-3 text-left">Scheduled for</th>
                <th className="p-3 text-left">Created by</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {scheduledJobs.length === 0 && (
                <tr><td colSpan={5} className="p-3 text-[var(--ink-500)]">No scheduled jobs.</td></tr>
              )}
              {scheduledJobs.map((j) => (
                <tr key={j.id} className="border-b border-[var(--border)] hover:bg-[var(--cream-100)]">
                  <td className="p-3 font-medium">
                    <div className="space-y-1">
                      <Link className="text-[var(--plum-700)] underline" to={`/jobs/${j.id}`}>
                        {jobName(j)}
                      </Link>
                      {overrideSummary(j) ? (
                        <div>
                          <Badge tone="amber">{overrideSummary(j)}</Badge>
                        </div>
                      ) : null}
                    </div>
                  </td>
                  <td className="p-3">
                    {j.draftSnapshot.effectiveAt ? new Date(j.draftSnapshot.effectiveAt).toLocaleString() : "—"}
                  </td>
                  <td className="p-3">{j.createdBy}</td>
                  <td className="p-3">
                    <Badge tone={statusTone(j.status)}>{j.status}</Badge>
                  </td>
                  <td className="p-3">
                    {j.status === "Ready" ? (
                      <button
                        type="button"
                        className="text-xs text-[var(--plum-700)] underline"
                        onClick={() => cancelJob(j.id)}
                      >
                        Cancel
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
