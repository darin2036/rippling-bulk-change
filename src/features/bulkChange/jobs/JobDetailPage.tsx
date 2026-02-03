import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader } from "../../../components/Card";
import Badge from "../../../components/Badge";
import Button from "../../../components/Button";
import Tabs from "../../../components/Tabs";
import { useBulkStore } from "../bulkChange.store";
import { getEmployees } from "../../people/people.data";
import type { BulkChangeJob, BulkField, PropStep } from "../types";
import clsx from "clsx";

function ConfettiBurst() {
  const pieces = Array.from({ length: 14 }, (_, i) => i);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(320px) rotate(360deg); opacity: 0; }
        }
      `}</style>
      {pieces.map((i) => (
        <span
          key={i}
          className="absolute top-0 h-3 w-1.5 rounded-sm"
          style={{
            left: `${(i * 7) % 100}%`,
            background:
              i % 4 === 0
                ? "#f5b12f"
                : i % 4 === 1
                  ? "#f07a4b"
                  : i % 4 === 2
                    ? "#6e2a50"
                    : "#8c5b7a",
            animation: `confetti-fall ${2.4 + (i % 5) * 0.3}s ease-in ${i * 0.1}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

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
  if (job.kind === "csv") return `CSV import: ${fields || "Update"}`;
  return `Bulk change: ${fields || "Update"}`;
}

function statusTone(status: BulkChangeJob["status"]) {
  if (status === "Completed") return "green" as const;
  if (status === "CompletedWithErrors") return "amber" as const;
  if (status === "Failed") return "red" as const;
  if (status === "Running") return "purple" as const;
  if (status === "Canceled") return "neutral" as const;
  return "neutral" as const;
}

function stepTone(s: "pending" | "ok" | "failed" | "skipped") {
  if (s === "ok") return "green" as const;
  if (s === "failed") return "red" as const;
  if (s === "skipped") return "neutral" as const;
  return "neutral" as const;
}

type AuditGroup = {
  key: "milestones" | "itemsFailed" | "itemsOk" | "admin" | "other";
  title: string;
  items: { at: number; message: string }[];
  limited?: boolean;
  onToggleLimit?: () => void;
};

export default function JobDetailPage() {
  const { jobId } = useParams();
  const nav = useNavigate();
  const { jobs, ensureJobRunning, updateCsvRecord, retryCsvRows, retryAppSync, cancelJob } = useBulkStore();
  const job = jobs.find(j => j.id === jobId);
  const [tab, setTab] = useState("overview");
  const [resultFilter, setResultFilter] = useState<"all" | "failed" | "succeeded">("all");
  const [retryNote, setRetryNote] = useState("");
  const [selectedRetryRows, setSelectedRetryRows] = useState<Set<string>>(new Set());
  const [collapsedGroups, setCollapsedGroups] = useState({
    milestones: false,
    itemsFailed: false,
    itemsOk: true,
    admin: false,
    other: false,
  });
  const [showAllFailed, setShowAllFailed] = useState(false);
  const [showAllOk, setShowAllOk] = useState(false);

  const { peopleById, employeeOptions } = useMemo(() => {
    const emps = getEmployees();
    const map: Record<string, { name: string; title: string; department: string }> = {};
    for (const e of emps) map[e.id] = { name: e.name ?? e.fullName, title: e.title, department: e.department };
    const options = emps.map((e) => ({
      id: e.id,
      label: `${e.name ?? e.fullName} (${e.email})`,
    }));
    return { peopleById: map, employeeOptions: options };
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
  const csvRecordByRowId = useMemo(() => new Map(job.csv?.records.map((r) => [r.rowId, r]) ?? []), [job.csv]);
  const failedRows = useMemo(() => job.results.filter((r) => !r.ok), [job.results]);
  const isComplete = job.status === "Completed" || job.status === "CompletedWithErrors";
  const isSuccess = job.status === "Completed";
  const failedAppSyncIds = useMemo(
    () => job.results.filter((r) => r.failedStep === "thirdPartySync").map((r) => r.employeeId),
    [job.results]
  );
  const auditEntries = useMemo(() => job.auditLog.slice().sort((a, b) => b.at - a.at), [job.auditLog]);
  const auditGroups = useMemo(() => {
    const milestonePrefixes = [
      "Job started",
      "Validating inputs",
      "Starting propagation",
      "Starting CSV import",
      "Job completed",
      "Import completed",
      "Updating HR system",
      "Syncing payroll",
      "Syncing benefits",
      "Updating IT",
      "Updating apps",
    ];
    const groups = {
      milestones: [] as typeof auditEntries,
      itemsFailed: [] as typeof auditEntries,
      itemsOk: [] as typeof auditEntries,
      admin: [] as typeof auditEntries,
      other: [] as typeof auditEntries,
    };

    for (const entry of auditEntries) {
      const msg = entry.message;
      if (msg.startsWith("Validation overrides applied")) {
        groups.admin.push(entry);
        continue;
      }
      if (milestonePrefixes.some((p) => msg.startsWith(p))) {
        groups.milestones.push(entry);
        continue;
      }
      if (msg.startsWith("Updated ") || msg.startsWith("Imported ")) {
        groups.itemsOk.push(entry);
        continue;
      }
      if (msg.startsWith("Failed ") || (msg.startsWith("Row ") && msg.includes(" failed"))) {
        groups.itemsFailed.push(entry);
        continue;
      }
      groups.other.push(entry);
    }

    return groups;
  }, [auditEntries]);

  useEffect(() => {
    if (job.kind !== "csv") return;
    setSelectedRetryRows(new Set(failedRows.map((r) => r.employeeId)));
  }, [job.kind, job.id, failedRows]);

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
          {job.status === "Ready" ? (
            <Button variant="ghost" onClick={() => cancelJob(job.id)}>
              Cancel job
            </Button>
          ) : null}
          <Button onClick={() => nav("/people")}>View People</Button>
        </div>
      </div>

      {isComplete ? (
        <Card>
          <CardHeader className="relative overflow-hidden">
            {isSuccess ? <ConfettiBurst /> : null}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="text-sm text-[var(--ink-500)]">Bulk change complete</div>
                <h2 className="text-xl font-semibold mt-1">
                  {isSuccess ? "All updates finished successfully." : "Completed with some issues."}
                </h2>
                <div className="text-sm text-[var(--ink-500)] mt-1">
                  {job.totalCount} total • {failures} failed • {job.totalCount - failures} succeeded
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => nav("/people")}>View People</Button>
                <Button variant="primary" onClick={() => nav("/bulk-change/new")}>
                  Start another bulk change
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      ) : null}

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
                <div className="text-sm text-[var(--ink-500)] mt-1">
                  {job.kind === "csv" ? "Rows imported" : "People affected"}: {job.totalCount}
                </div>
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
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="text-sm text-[var(--ink-500)]">
                  Showing{" "}
                  <span className="font-semibold text-[var(--ink-900)]">{job.employeeIds.length}</span>{" "}
                  {job.kind === "csv" ? "rows" : "people"}.
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={failedAppSyncIds.length === 0}
                    onClick={() => retryAppSync(job.id, failedAppSyncIds)}
                  >
                    Retry app sync ({failedAppSyncIds.length})
                  </Button>
                  <Button
                    size="sm"
                    variant={resultFilter === "all" ? "secondary" : "ghost"}
                    onClick={() => setResultFilter("all")}
                  >
                    All
                  </Button>
                  <Button
                    size="sm"
                    variant={resultFilter === "failed" ? "secondary" : "ghost"}
                    onClick={() => setResultFilter("failed")}
                  >
                    Failed
                  </Button>
                  <Button
                    size="sm"
                    variant={resultFilter === "succeeded" ? "secondary" : "ghost"}
                    onClick={() => setResultFilter("succeeded")}
                  >
                    Succeeded
                  </Button>
                </div>
              </div>

              <div className="overflow-auto border border-[var(--border)] rounded-xl bg-white">
                <table className="min-w-[980px] w-full text-sm">
                  <thead className="bg-[var(--cream-100)] text-[var(--ink-500)] border-b border-[var(--border)]">
                    <tr>
                      <th className="p-3 text-left">{job.kind === "csv" ? "Row" : "Employee"}</th>
                      <th className="p-3 text-left">Result</th>
                      <th className="p-3 text-left">Override</th>
                      {stepOrder.map((s) => (
                        <th key={s} className="p-3 text-left">{STEP_LABELS[s]}</th>
                      ))}
                      <th className="p-3 text-left">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {job.employeeIds
                      .filter((id) => {
                        if (resultFilter === "all") return true;
                        const res = job.results.find((r) => r.employeeId === id);
                        if (!res) return false;
                        return resultFilter === "failed" ? !res.ok : res.ok;
                      })
                      .map((id) => {
                        const res = job.results.find((r) => r.employeeId === id);
                        const pending = !res;
                        const resultLabel = pending ? "Pending" : res.ok ? "OK" : "Failed";
                        const resultTone = pending ? "neutral" : res.ok ? "green" : "red";

                        if (job.kind === "csv") {
                          const rec = csvRecordByRowId.get(id);
                          const resolved = rec?.resolvedEmployeeId ? peopleById[rec.resolvedEmployeeId] : undefined;
                          return (
                            <tr key={id} className="border-b border-[var(--border)] last:border-b-0">
                              <td className="p-3">
                                <div className="font-medium">{rec?.email || id}</div>
                                <div className="text-xs text-[var(--ink-500)]">
                                  {resolved ? `${resolved.title}, ${resolved.department}` : "Unmatched email"}
                                </div>
                              </td>
                              <td className="p-3"><Badge tone={resultTone}>{resultLabel}</Badge></td>
                              <td className="p-3 text-[var(--ink-700)]">—</td>
                              {stepOrder.map((s) => {
                                const stepStatus = pending ? "pending" : res.steps[s];
                                return (
                                  <td key={`${id}-${s}`} className="p-3">
                                    <Badge tone={stepTone(stepStatus)}>{stepStatus}</Badge>
                                  </td>
                                );
                              })}
                              <td className="p-3 text-[var(--ink-700)]">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span>{pending ? "—" : res.message || "—"}</span>
                                  {!pending && res.failedStep === "thirdPartySync" ? (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => retryAppSync(job.id, [id])}
                                    >
                                      Retry app sync
                                    </Button>
                                  ) : null}
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        const meta = peopleById[id];
                        const override = job.draftSnapshot.exceptionOverrides?.[id];
                        const overrideLabel = override
                          ? override.reason === "Other"
                            ? override.note || "Other"
                            : `${override.reason}${override.note ? ` — ${override.note}` : ""}`
                          : "—";
                        return (
                          <tr key={id} className="border-b border-[var(--border)] last:border-b-0">
                            <td className="p-3">
                              <div className="font-medium">{meta?.name || id}</div>
                              <div className="text-xs text-[var(--ink-500)]">{meta ? `${meta.title}, ${meta.department}` : ""}</div>
                            </td>
                            <td className="p-3"><Badge tone={resultTone}>{resultLabel}</Badge></td>
                            <td className="p-3 text-[var(--ink-700)]">{overrideLabel}</td>
                            {stepOrder.map((s) => {
                              const stepStatus = pending ? "pending" : res.steps[s];
                              return (
                                <td key={`${id}-${s}`} className="p-3">
                                  <Badge tone={stepTone(stepStatus)}>{stepStatus}</Badge>
                                </td>
                              );
                            })}
                            <td className="p-3 text-[var(--ink-700)]">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span>{pending ? "—" : res.message || "—"}</span>
                                {!pending && res.failedStep === "thirdPartySync" ? (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => retryAppSync(job.id, [id])}
                                  >
                                    Retry app sync
                                  </Button>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {job.kind === "csv" && failedRows.length > 0 ? (
                <Card>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div>
                        <div className="text-sm font-semibold">Remediate & retry</div>
                        <div className="text-xs text-[var(--ink-500)]">
                          Fix validation issues, map employees, then retry the failed rows.
                        </div>
                      </div>
                      <div className="text-xs text-[var(--ink-500)]">
                        {selectedRetryRows.size}/{failedRows.length} selected
                      </div>
                    </div>

                    <div className="overflow-auto border border-[var(--border)] rounded-xl bg-white">
                      <table className="min-w-[980px] w-full text-sm">
                        <thead className="bg-[var(--cream-100)] text-[var(--ink-500)] border-b border-[var(--border)]">
                          <tr>
                            <th className="p-3 text-left">Retry</th>
                            <th className="p-3 text-left">Row</th>
                            <th className="p-3 text-left">Issue</th>
                            <th className="p-3 text-left">Resolve</th>
                          </tr>
                        </thead>
                        <tbody>
                          {failedRows.slice(0, 20).map((r) => {
                            const rec = csvRecordByRowId.get(r.employeeId);
                            const selected = selectedRetryRows.has(r.employeeId);
                            return (
                              <tr key={`retry-${r.employeeId}`} className="border-b border-[var(--border)] last:border-b-0">
                                <td className="p-3">
                                  <input
                                    type="checkbox"
                                    checked={selected}
                                    onChange={(e) => {
                                      const next = new Set(selectedRetryRows);
                                      if (e.target.checked) next.add(r.employeeId);
                                      else next.delete(r.employeeId);
                                      setSelectedRetryRows(next);
                                    }}
                                  />
                                </td>
                                <td className="p-3">
                                  <div className="font-medium">{rec?.email || r.employeeId}</div>
                                </td>
                                <td className="p-3">
                                  {r.message ? (
                                    <div className="text-xs text-[var(--ink-500)]">{r.message}</div>
                                  ) : null}
                                  {rec?.issues?.length ? (
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <div className="text-xs text-[var(--ink-500)]">
                                          {rec.issues.length} validation issue(s)
                                        </div>
                                        <button
                                          type="button"
                                          className="text-xs text-[var(--plum-700)] underline"
                                          onClick={() =>
                                            updateCsvRecord(job.id, r.employeeId, {
                                              issues: [],
                                            })
                                          }
                                        >
                                          Resolve all
                                        </button>
                                      </div>
                                      {rec.issues.map((issue, idx) => (
                                        <label key={`${issue.field}-${idx}`} className="flex items-start gap-2 text-xs">
                                          <input
                                            type="checkbox"
                                            checked={false}
                                            onChange={() => {
                                              const nextIssues = rec.issues.filter((_, i) => i !== idx);
                                              updateCsvRecord(job.id, r.employeeId, {
                                                issues: nextIssues,
                                              });
                                            }}
                                          />
                                          <span>{issue.message}</span>
                                        </label>
                                      ))}
                                    </div>
                                  ) : r.message ? null : (
                                    <div className="text-[var(--ink-500)]">No validation issues</div>
                                  )}
                                </td>
                                <td className="p-3 space-y-2">
                                  <div className="text-xs text-[var(--ink-500)]">Map employee</div>
                                  <select
                                    className="h-8 w-full border border-[var(--border)] rounded-lg bg-white px-2 text-xs"
                                    value={rec?.resolvedEmployeeId ?? ""}
                                    onChange={(e) =>
                                      updateCsvRecord(job.id, r.employeeId, {
                                        resolvedEmployeeId: e.target.value || null,
                                      })
                                    }
                                  >
                                    <option value="">Unmapped</option>
                                    {employeeOptions.map((opt) => (
                                      <option key={opt.id} value={opt.id}>
                                        {opt.label}
                                      </option>
                                    ))}
                                  </select>
                                  {rec?.issues?.length ? (
                                    <div className="text-xs text-[var(--ink-500)]">
                                      Resolve issues above before retry.
                                    </div>
                                  ) : null}
                                </td>
                              </tr>
                            );
                          })}
                          {failedRows.length > 20 ? (
                            <tr>
                              <td colSpan={4} className="p-3 text-xs text-[var(--ink-500)]">
                                Showing first 20 failed rows.
                              </td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <input
                        className="h-9 min-w-[240px] flex-1 border border-[var(--border)] rounded-lg bg-white px-3 text-sm"
                        placeholder="Remediation note (optional)"
                        value={retryNote}
                        onChange={(e) => setRetryNote(e.target.value)}
                      />
                      <Button
                        variant="primary"
                        onClick={() => retryCsvRows(job.id, Array.from(selectedRetryRows), retryNote)}
                        disabled={selectedRetryRows.size === 0}
                      >
                        Retry selected rows
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          ) : null}

          {tab === "audit" ? (
            <div className="border border-[var(--border)] rounded-xl bg-white overflow-hidden">
              {job.auditLog.length === 0 ? (
                <div className="p-3 text-sm text-[var(--ink-500)]">No audit events.</div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {([
                    { key: "milestones", title: "Milestones", items: auditGroups.milestones },
                    {
                      key: "itemsFailed",
                      title: job.kind === "csv" ? "Failed rows" : "Failed updates",
                      items: auditGroups.itemsFailed,
                      limited: !showAllFailed,
                      onToggleLimit: () => setShowAllFailed((prev) => !prev),
                    },
                    {
                      key: "itemsOk",
                      title: job.kind === "csv" ? "Imported rows" : "Successful updates",
                      items: auditGroups.itemsOk,
                      limited: !showAllOk,
                      onToggleLimit: () => setShowAllOk((prev) => !prev),
                    },
                    { key: "admin", title: "Admin notes", items: auditGroups.admin },
                    { key: "other", title: "Other events", items: auditGroups.other },
                  ] satisfies AuditGroup[]).map((group) => {
                    if (group.items.length === 0) return null;
                    const isCollapsed = collapsedGroups[group.key];
                    const limit = group.key === "itemsFailed" || group.key === "itemsOk" ? 25 : undefined;
                    const visibleItems = group.limited && limit ? group.items.slice(0, limit) : group.items;
                    return (
                      <div key={group.key} className="bg-white">
                        <button
                          type="button"
                          className={clsx(
                            "w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-[var(--cream-100)]",
                            isCollapsed ? "text-[var(--ink-700)]" : "text-[var(--ink-900)]"
                          )}
                          onClick={() =>
                            setCollapsedGroups((prev) => ({ ...prev, [group.key]: !prev[group.key] }))
                          }
                        >
                          <span className="flex items-center gap-2">
                            <span className="text-[12px]">{isCollapsed ? "▸" : "▾"}</span>
                            <span>{group.title}</span>
                          </span>
                          <span className="text-xs text-[var(--ink-500)]">{group.items.length}</span>
                        </button>

                        {!isCollapsed ? (
                          <div className="px-4 pb-3">
                            <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                              {visibleItems.map((e, i) => (
                                <div
                                  key={`${group.key}-${i}`}
                                  className="px-3 py-2 border-b border-[var(--border)] last:border-b-0 text-sm flex gap-3"
                                >
                                  <span className="text-[var(--ink-500)] min-w-[86px]">
                                    {new Date(e.at).toLocaleTimeString()}
                                  </span>
                                  <span className="text-[var(--ink-900)]">{e.message}</span>
                                </div>
                              ))}
                            </div>
                            {group.onToggleLimit && limit && group.items.length > limit ? (
                              <button
                                type="button"
                                className="mt-2 text-xs text-[var(--plum-700)] underline"
                                onClick={group.onToggleLimit}
                              >
                                {group.limited ? `Show all ${group.items.length}` : "Show fewer"}
                              </button>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
