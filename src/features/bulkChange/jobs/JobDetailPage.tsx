import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader } from "../../../components/Card";
import Badge from "../../../components/Badge";
import Button from "../../../components/Button";
import Tabs from "../../../components/Tabs";
import { useBulkStore } from "../bulkChange.store";
import { getEmployees } from "../../people/people.data";
import type { BulkChangeJob, BulkField, PropStep } from "../types";

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

const STEP_LABELS: Record<PropStep, string> = {
  systemOfRecordUpdate: "System",
  payrollSync: "Payroll",
  benefitsSync: "Benefits",
  deviceMgmtSync: "IT",
  thirdPartySync: "Apps",
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

function stepTone(s: "pending" | "ok" | "failed" | "skipped") {
  if (s === "ok") return "green" as const;
  if (s === "failed") return "red" as const;
  if (s === "skipped") return "neutral" as const;
  return "neutral" as const;
}

export default function JobDetailPage() {
  const { jobId } = useParams();
  const nav = useNavigate();
  const { jobs, ensureJobRunning } = useBulkStore();
  const job = jobs.find(j => j.id === jobId);
  const [tab, setTab] = useState("overview");

  const peopleById = useMemo(() => {
    const emps = getEmployees();
    const map: Record<string, { name: string; title: string; department: string }> = {};
    for (const e of emps) map[e.id] = { name: e.name ?? e.fullName, title: e.title, department: e.department };
    return map;
  }, []);

  useEffect(() => {
    if (!jobId) return;
    ensureJobRunning(jobId);
  }, [ensureJobRunning, jobId]);

  if (!job) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Job not found</h1>
        <div className="text-sm text-[var(--ink-500)]">Run a bulk change to create a job.</div>
        <div className="text-sm">
          <Link className="text-[var(--plum-700)] underline" to="/jobs">View jobs</Link>
        </div>
      </div>
    );
  }

  const failures = job.results.filter(r => !r.ok).length;
  const progressPct = job.totalCount === 0 ? 0 : Math.min(100, Math.round((job.processedCount / job.totalCount) * 100));
  const selectedFields = job.draftSnapshot.selectedFields.map((f) => FIELD_LABELS[f] ?? f);
  const stepOrder: PropStep[] = ["systemOfRecordUpdate", "payrollSync", "benefitsSync", "deviceMgmtSync", "thirdPartySync"];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-sm text-[var(--ink-500)]">
            <Link className="text-[var(--plum-700)] underline" to="/jobs">Jobs</Link>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">{jobName(job)}</h1>
          <div className="text-sm text-[var(--ink-500)] mt-1">
            {job.totalCount} people • {failures} failures
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <Badge tone={statusTone(job.status)}>{job.status}</Badge>
          <Button onClick={() => nav("/people")}>View People</Button>
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="text-sm text-[var(--ink-500)]">
              Progress: <span className="font-semibold text-[var(--ink-900)]">{job.processedCount}/{job.totalCount}</span>
            </div>
            <div className="text-sm text-[var(--ink-500)]">Created by {job.createdBy} • {new Date(job.createdAt).toLocaleString()}</div>
          </div>
          <div className="h-2 rounded-full bg-[var(--cream-100)] overflow-hidden border border-[var(--border)]">
            <div className="h-full bg-[var(--plum-600)]" style={{ width: `${progressPct}%` }} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs
            tabs={[
              { key: "overview", label: "Overview" },
              { key: "people", label: "People" },
              { key: "audit", label: "Audit log" },
            ]}
            activeKey={tab}
            onChange={setTab}
          />

          {tab === "overview" ? (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-[var(--border)] bg-white p-4">
                <div className="text-sm font-semibold">Scope</div>
                <div className="text-sm text-[var(--ink-500)] mt-1">People affected: {job.totalCount}</div>
                <div className="text-sm text-[var(--ink-500)] mt-1">Fields: {selectedFields.join(", ") || "—"}</div>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-white p-4">
                <div className="text-sm font-semibold">Systems impacted</div>
                <div className="mt-2 flex gap-2 flex-wrap">
                  {["Payroll", "Benefits", "IT", "Apps"].map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border border-[var(--border)] bg-[var(--cream-100)] text-[var(--ink-700)]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-[var(--ink-500)] mt-2">Changes propagate as downstream systems accept updates.</div>
              </div>
            </div>
          ) : null}

          {tab === "people" ? (
            <div className="overflow-auto border border-[var(--border)] rounded-xl bg-white">
              <table className="min-w-[980px] w-full text-sm">
                <thead className="bg-[var(--cream-100)] text-[var(--ink-500)] border-b border-[var(--border)]">
                  <tr>
                    <th className="p-3 text-left">Employee</th>
                    <th className="p-3 text-left">Result</th>
                    {stepOrder.map((s) => (
                      <th key={s} className="p-3 text-left">{STEP_LABELS[s]}</th>
                    ))}
                    <th className="p-3 text-left">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {job.employeeIds.map((id) => {
                    const meta = peopleById[id];
                    const res = job.results.find((r) => r.employeeId === id);
                    const pending = !res;
                    const resultLabel = pending ? "Pending" : res.ok ? "OK" : "Failed";
                    const resultTone = pending ? "neutral" : res.ok ? "green" : "red";
                    return (
                      <tr key={id} className="border-b border-[var(--border)] last:border-b-0">
                        <td className="p-3">
                          <div className="font-medium">{meta?.name || id}</div>
                          <div className="text-xs text-[var(--ink-500)]">{meta ? `${meta.title}, ${meta.department}` : ""}</div>
                        </td>
                        <td className="p-3"><Badge tone={resultTone}>{resultLabel}</Badge></td>
                        {stepOrder.map((s) => {
                          const stepStatus = pending ? "pending" : res.steps[s];
                          return (
                            <td key={`${id}-${s}`} className="p-3">
                              <Badge tone={stepTone(stepStatus)}>{stepStatus}</Badge>
                            </td>
                          );
                        })}
                        <td className="p-3 text-[var(--ink-700)]">{pending ? "—" : res.message || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}

          {tab === "audit" ? (
            <div className="border border-[var(--border)] rounded-xl bg-white overflow-hidden">
              {job.auditLog.length === 0 ? (
                <div className="p-3 text-sm text-[var(--ink-500)]">No audit events.</div>
              ) : (
                job.auditLog.slice().reverse().map((e, i) => (
                  <div key={i} className="px-3 py-2 border-b border-[var(--border)] last:border-b-0 text-sm">
                    <span className="text-[var(--ink-500)]">{new Date(e.at).toLocaleTimeString()} </span>
                    <span>{e.message}</span>
                  </div>
                ))
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
