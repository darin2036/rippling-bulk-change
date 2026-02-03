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
};

function jobName(job: BulkChangeJob) {
  const fields = job.draftSnapshot.selectedFields
    .map((f) => FIELD_LABELS[f] ?? f)
    .slice(0, 4)
    .join(", ");
  return `Bulk change: ${fields || "Update"}`;
}

function statusTone(status: BulkChangeJob["status"]) {
  if (status === "Completed") return "green" as const;
  if (status === "CompletedWithErrors") return "amber" as const;
  if (status === "Failed") return "red" as const;
  if (status === "Running") return "purple" as const;
  return "neutral" as const;
}

export default function JobsPage() {
  const { jobs } = useBulkStore();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
        <div className="text-sm text-[var(--ink-500)]">History of bulk change jobs.</div>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-[var(--cream-100)] text-[var(--ink-500)] border-b border-[var(--border)]">
              <tr>
                <th className="p-3 text-left">Job</th>
                <th className="p-3 text-left">Created by</th>
                <th className="p-3 text-left">Created at</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Progress</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 && (
                <tr><td colSpan={5} className="p-3 text-[var(--ink-500)]">No jobs yet. Run a bulk change.</td></tr>
              )}
              {jobs.map(j => (
                <tr key={j.id} className="border-b border-[var(--border)] hover:bg-[var(--cream-100)]">
                  <td className="p-3 font-medium">
                    <Link className="text-[var(--plum-700)] underline" to={`/jobs/${j.id}`}>
                      {jobName(j)}
                    </Link>
                  </td>
                  <td className="p-3">{j.createdBy}</td>
                  <td className="p-3">{new Date(j.createdAt).toLocaleString()}</td>
                  <td className="p-3">
                    <Badge tone={statusTone(j.status)}>{j.status}</Badge>
                  </td>
                  <td className="p-3 text-[var(--ink-700)]">
                    {j.processedCount}/{j.totalCount}
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
