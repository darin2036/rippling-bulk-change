import { create } from "zustand";
import { uid } from "../../lib/ids";
import { loadJSON, saveJSON } from "../../lib/storage";
import { getEmployees, updateEmployees } from "../people/people.data";
import { continueBulkJob } from "./jobs/jobRunner";
import { continueCsvImportJob } from "./jobs/csvImportRunner";
import type { BulkChangeDraft, BulkChangeJob, BulkField, CsvImportSnapshot, JobEmployeeResult, JobStatus, PropStep } from "./types";
import { groupIssuesByEmployee, validateDraft } from "./grid/validation";

const DRAFT_KEY = "rbp_bulk_draft_v2";
const JOBS_KEY = "rbp_bulk_jobs_v2";

const runningJobs = new Set<string>();
const appSyncRetries = new Set<string>();
const scheduledJobs = new Map<string, number>();

type State = {
  draft: BulkChangeDraft;
  jobs: BulkChangeJob[];

  setSelected: (ids: string[]) => void;
  setSelectedFields: (fields: BulkField[]) => void;
  setApplyToAllField: (field: BulkField, value: unknown) => void;
  setOverrideField: (employeeId: string, field: BulkField, value: unknown) => void;
  clearOverrideField: (employeeId: string, field: BulkField) => void;
  setEffectiveSchedule: (mode: "immediate" | "scheduled", at?: number | null) => void;
  setExceptionOverride: (employeeId: string, override: ExceptionOverride | null) => void;

  resetDraft: () => void;

  startJobFromDraft: () => string | null;
  startCsvJob: (snapshot: CsvImportSnapshot) => string | null;
  ensureJobRunning: (jobId: string) => void;
  updateCsvRecord: (jobId: string, rowId: string, updates: Partial<CsvImportSnapshot["records"][number]>) => void;
  retryCsvRows: (jobId: string, rowIds: string[], note?: string) => void;
  cancelJob: (jobId: string, note?: string) => void;
  retryAppSync: (jobId: string, employeeIds: string[], note?: string) => void;

  addJob: (job: BulkChangeJob) => void;
  updateJob: (job: BulkChangeJob) => void;
};

type ExceptionOverride = {
  reason: string;
  note?: string;
  appliedBy: string;
  appliedAt: number;
};

function newDraft(): BulkChangeDraft {
  return {
    id: uid("draft"),
    createdAt: Date.now(),
    createdBy: "Darin",
    selectedEmployeeIds: [],
    selectedFields: [],
    applyToAll: {},
    overrides: {},
    effectiveMode: "immediate",
    effectiveAt: null,
    exceptionOverrides: undefined,
  };
}

function loadDraft(): BulkChangeDraft {
  return loadJSON<BulkChangeDraft>(DRAFT_KEY, newDraft());
}

function persistDraft(d: BulkChangeDraft) {
  saveJSON(DRAFT_KEY, d);
}

function loadJobs(): BulkChangeJob[] {
  return loadJSON<BulkChangeJob[]>(JOBS_KEY, []);
}

function persistJobs(j: BulkChangeJob[]) {
  saveJSON(JOBS_KEY, j);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function applyDraftToEmployees(job: BulkChangeJob) {
  if (job.changesApplied) return;
  if (job.kind === "csv") return;
  const employees = getEmployees();
  const byId = new Map(employees.map((e) => [e.id, e]));

  const okIds = new Set(job.results.filter((r) => r.ok).map((r) => r.employeeId));
  const fields = job.draftSnapshot.selectedFields;

  if (okIds.size === 0 || fields.length === 0) return;

  const updated = employees.map((emp) => {
    if (!okIds.has(emp.id)) return emp;
    const next: any = { ...emp };
    for (const field of fields) {
      const override = job.draftSnapshot.overrides[emp.id]?.[field];
      const applied = job.draftSnapshot.applyToAll[field];
      const value = override !== undefined ? override : applied;
      if (value === undefined || value === "") continue;
      next[field] = value;
      if (field === "location") next.workLocation = value;
    }

    // If the new manager id doesn't exist in this dataset, keep the old one.
    if (typeof next.managerId === "string" && next.managerId && !byId.has(next.managerId)) {
      next.managerId = emp.managerId;
    }

    return next;
  });

  updateEmployees(updated);
}

function applyValidationOverrideNotes(job: BulkChangeJob): BulkChangeJob {
  if (job.kind === "csv") return job;
  const overrides = job.draftSnapshot.exceptionOverrides;
  if (!overrides || Object.keys(overrides).length === 0) return job;

  const employees = getEmployees().filter((e) => job.employeeIds.includes(e.id));
  const issues = validateDraft(employees, job.draftSnapshot);
  if (issues.length === 0) return job;

  const issuesByEmp = groupIssuesByEmployee(issues);

  const results = job.results.map((r) => {
    if (!r.ok) return r;
    if (!issuesByEmp[r.employeeId]) return r;
    const override = overrides[r.employeeId];
    if (!override) return r;
    const note =
      override.reason === "Other"
        ? `Override: ${override.note || "Other"}`
        : `Override: ${override.reason}${override.note ? ` — ${override.note}` : ""}`;
    return { ...r, message: r.message ? `${r.message} · ${note}` : note };
  });

  const overrideCount = Object.keys(overrides).length;
  const reasonCounts = Object.values(overrides).reduce<Record<string, number>>((acc, o) => {
    const key = o.reason || "Unspecified";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const reasonSummary = Object.entries(reasonCounts)
    .map(([reason, count]) => `${reason} (${count})`)
    .join(", ");
  const auditMsg = `Validation overrides applied: ${overrideCount} employee(s)${reasonSummary ? ` — ${reasonSummary}` : ""}`;

  const auditLog = job.auditLog.some((e) => e.message.startsWith("Validation overrides applied"))
    ? job.auditLog
    : [...job.auditLog, { at: Date.now(), message: auditMsg }];

  return { ...job, results, auditLog };
}

function applyCsvImportToEmployees(job: BulkChangeJob) {
  if (job.changesApplied) return;
  if (job.kind !== "csv" || !job.csv) return;

  const employees = getEmployees();
  const byId = new Map(employees.map((e) => [e.id, e]));
  const recordByRowId = new Map(job.csv.records.map((r) => [r.rowId, r]));
  const okRowIds = new Set(job.results.filter((r) => r.ok).map((r) => r.employeeId));

  if (okRowIds.size === 0) return;

  const updated = employees.map((emp) => {
    // Find any record that resolves to this employee and succeeded.
    let record: (typeof job.csv)["records"][number] | undefined;
    for (const rowId of okRowIds) {
      const r = recordByRowId.get(rowId);
      if (r?.resolvedEmployeeId === emp.id) {
        record = r;
        break;
      }
    }
    if (!record) return emp;

    const next: any = { ...emp };
    for (const [field, value] of Object.entries(record.values)) {
      if (value === undefined || value === null || value === "") continue;
      next[field] = value;
      if (field === "workLocation" || field === "location") {
        next.location = String(value);
        next.workLocation = String(value);
      }
    }

    if (typeof next.managerId === "string" && next.managerId && !byId.has(next.managerId)) {
      next.managerId = emp.managerId;
    }

    return next;
  });

  updateEmployees(updated);
}

export const useBulkStore = create<State>((set, get) => ({
  draft: loadDraft(),
  jobs: loadJobs(),

  setSelected: (ids) => {
    const d = { ...get().draft, selectedEmployeeIds: ids };
    persistDraft(d);
    set({ draft: d });
  },

  setSelectedFields: (fields) => {
    const d = { ...get().draft, selectedFields: fields };
    persistDraft(d);
    set({ draft: d });
  },

  setApplyToAllField: (field, value) => {
    const d = { ...get().draft, applyToAll: { ...get().draft.applyToAll, [field]: value } };
    persistDraft(d);
    set({ draft: d });
  },
  setEffectiveSchedule: (mode, at) => {
    const d = {
      ...get().draft,
      effectiveMode: mode,
      effectiveAt: mode === "scheduled" ? at ?? get().draft.effectiveAt ?? null : null,
    };
    persistDraft(d);
    set({ draft: d });
  },

  setOverrideField: (employeeId, field, value) => {
    const overrides = { ...get().draft.overrides };
    overrides[employeeId] = { ...(overrides[employeeId] || {}), [field]: value };
    const d = { ...get().draft, overrides };
    persistDraft(d);
    set({ draft: d });
  },

  clearOverrideField: (employeeId, field) => {
    const overrides = { ...get().draft.overrides };
    const row = { ...(overrides[employeeId] || {}) };
    delete row[field];
    if (Object.keys(row).length === 0) delete overrides[employeeId];
    else overrides[employeeId] = row;
    const d = { ...get().draft, overrides };
    persistDraft(d);
    set({ draft: d });
  },

  setExceptionOverride: (employeeId, override) => {
    const current = get().draft.exceptionOverrides || {};
    const next = { ...current };
    if (override) next[employeeId] = override;
    else delete next[employeeId];
    const d = { ...get().draft, exceptionOverrides: Object.keys(next).length ? next : undefined };
    persistDraft(d);
    set({ draft: d });
  },

  resetDraft: () => {
    const d = newDraft();
    persistDraft(d);
    set({ draft: d });
  },

  startJobFromDraft: () => {
    const draft = get().draft;
    const employeeIds = draft.selectedEmployeeIds;
    if (employeeIds.length === 0 || draft.selectedFields.length === 0) return null;

    const selectedEmployees = getEmployees().filter((e) => employeeIds.includes(e.id));
    const validationIssues = validateDraft(selectedEmployees, draft);
    const issuesByEmployee = groupIssuesByEmployee(validationIssues);
    const issueEmployeeCount = Object.keys(issuesByEmployee).length;
    const issueCount = validationIssues.length;
    const fieldList = draft.selectedFields.join(", ");
    const overrideCount = draft.exceptionOverrides ? Object.keys(draft.exceptionOverrides).length : 0;

    const jobId = uid("job");
    const scheduled = draft.effectiveMode === "scheduled" && !!draft.effectiveAt && draft.effectiveAt > Date.now();
    const status: JobStatus = scheduled ? "Ready" : "Validating";
    const job: BulkChangeJob = {
      id: jobId,
      createdAt: Date.now(),
      createdBy: draft.createdBy,
      employeeIds,
      status,
      auditLog: [
        { at: Date.now(), message: "Job created" },
        {
          at: Date.now(),
          message: `Scope: ${employeeIds.length} people · Fields: ${fieldList || "—"}`,
        },
        ...(scheduled && draft.effectiveAt
          ? [{ at: Date.now(), message: `Scheduled to run at ${new Date(draft.effectiveAt).toLocaleString()}` }]
          : []),
        {
          at: Date.now(),
          message: `Validation: ${issueCount} issue(s) across ${issueEmployeeCount} employee(s)`,
        },
        ...(draft.exceptionOverrides && Object.keys(draft.exceptionOverrides).length > 0
          ? [
              {
                at: Date.now(),
                message: `Validation overrides requested: ${overrideCount} employee(s)`,
              },
            ]
          : []),
      ],
      results: [],
      processedCount: 0,
      totalCount: employeeIds.length,
      draftSnapshot: JSON.parse(JSON.stringify(draft)) as BulkChangeDraft,
      changesApplied: false,
      kind: "wizard",
    };

    get().addJob(job);
    get().resetDraft();

    // Fire and forget.
    void (async () => {
      get().ensureJobRunning(jobId);
    })();

    return jobId;
  },

  startCsvJob: (snapshot) => {
    if (snapshot.records.length === 0) return null;

    const rowIds = snapshot.records.map((r) => r.rowId);
    const selectedFields = Array.from(
      new Set(
        snapshot.records.flatMap((r) => Object.keys(r.values) as BulkField[])
      )
    );

    const draft: BulkChangeDraft = {
      id: uid("draft"),
      createdAt: Date.now(),
      createdBy: "Darin",
      selectedEmployeeIds: rowIds,
      selectedFields,
      applyToAll: {},
      overrides: Object.fromEntries(snapshot.records.map((r) => [r.rowId, r.values])),
    };

    const jobId = uid("job");
    const scheduled = draft.effectiveMode === "scheduled" && !!draft.effectiveAt && draft.effectiveAt > Date.now();
    const status: JobStatus = scheduled ? "Ready" : "Running";
    const job: BulkChangeJob = {
      id: jobId,
      createdAt: Date.now(),
      createdBy: "Darin",
      employeeIds: rowIds,
      status,
      auditLog: [
        { at: Date.now(), message: "CSV import job created" },
        ...(scheduled && draft.effectiveAt
          ? [{ at: Date.now(), message: `Scheduled to run at ${new Date(draft.effectiveAt).toLocaleString()}` }]
          : []),
      ],
      results: [],
      processedCount: 0,
      totalCount: rowIds.length,
      draftSnapshot: draft,
      changesApplied: false,
      kind: "csv",
      csv: snapshot,
    };

    get().addJob(job);
    get().ensureJobRunning(jobId);
    return jobId;
  },

  ensureJobRunning: (jobId) => {
    if (runningJobs.has(jobId)) return;
    const job = get().jobs.find((j) => j.id === jobId);
    if (!job) return;
    if (job.status === "Canceled" || job.status === "Completed" || job.status === "CompletedWithErrors" || job.status === "Failed") return;
    if (job.processedCount >= job.totalCount) return;

    const effectiveAt = job.draftSnapshot.effectiveAt ?? null;
    const scheduled = job.draftSnapshot.effectiveMode === "scheduled" && effectiveAt && effectiveAt > Date.now();
    if (scheduled) {
      if (!scheduledJobs.has(jobId)) {
        const delay = Math.max(0, effectiveAt - Date.now());
        const timeout = window.setTimeout(() => {
          scheduledJobs.delete(jobId);
          get().ensureJobRunning(jobId);
        }, delay);
        scheduledJobs.set(jobId, timeout);
      }
      if (job.status !== "Ready") {
        const updated: BulkChangeJob = { ...job, status: "Ready" };
        get().updateJob(updated);
      }
      return;
    }

    runningJobs.add(jobId);
    void (async () => {
      try {
        const current = get().jobs.find((j) => j.id === jobId);
        if (!current) return;

        const startStatus: BulkChangeJob =
          current.status === "Ready"
            ? current.kind === "csv"
              ? { ...current, status: "Running", auditLog: [...current.auditLog, { at: Date.now(), message: "Scheduled run started" }] }
              : { ...current, status: "Validating", auditLog: [...current.auditLog, { at: Date.now(), message: "Scheduled run started" }] }
            : current;

        if (startStatus !== current) get().updateJob(startStatus);

        const finalJob =
          startStatus.kind === "csv"
            ? await continueCsvImportJob(startStatus, (nextJob) => {
                get().updateJob(nextJob);
              })
            : await continueBulkJob(startStatus, (nextJob) => {
                get().updateJob(nextJob);
              });

        const finalJobWithOverrides = applyValidationOverrideNotes(finalJob);

        // Ensure final persisted job is the completed one.
        get().updateJob(finalJobWithOverrides);

        if (
          !finalJobWithOverrides.changesApplied &&
          (finalJobWithOverrides.status === "Completed" || finalJobWithOverrides.status === "CompletedWithErrors")
        ) {
          if (finalJobWithOverrides.kind === "csv") applyCsvImportToEmployees(finalJobWithOverrides);
          else applyDraftToEmployees(finalJobWithOverrides);
          get().updateJob({ ...finalJobWithOverrides, changesApplied: true });
        }
      } finally {
        runningJobs.delete(jobId);
      }
    })();
  },

  updateCsvRecord: (jobId, rowId, updates) => {
    const job = get().jobs.find((j) => j.id === jobId);
    if (!job || job.kind !== "csv" || !job.csv) return;
    const records = job.csv.records.map((r) => (r.rowId === rowId ? { ...r, ...updates } : r));
    const csv = { ...job.csv, records };
    get().updateJob({ ...job, csv });
  },

  retryCsvRows: (jobId, rowIds, note) => {
    const job = get().jobs.find((j) => j.id === jobId);
    if (!job || job.kind !== "csv") return;
    const rowSet = new Set(rowIds);
    const results = job.results.filter((r) => !rowSet.has(r.employeeId));
    const status: JobStatus = "Running";
    const auditLog = [
      ...job.auditLog,
      {
        at: Date.now(),
        message: `Retry requested for ${rowIds.length} row(s)${note && note.trim().length ? ` — ${note.trim()}` : ""}`,
      },
    ];
    const updated: BulkChangeJob = {
      ...job,
      results,
      processedCount: results.length,
      status,
      auditLog,
    };
    get().updateJob(updated);
    get().ensureJobRunning(jobId);
  },
  cancelJob: (jobId, note) => {
    const job = get().jobs.find((j) => j.id === jobId);
    if (!job) return;
    if (job.status !== "Ready") return;
    const timeout = scheduledJobs.get(jobId);
    if (timeout) {
      window.clearTimeout(timeout);
      scheduledJobs.delete(jobId);
    }
    const auditLog = [
      ...job.auditLog,
      {
        at: Date.now(),
        message: `Job canceled${note && note.trim().length ? ` — ${note.trim()}` : ""}`,
      },
    ];
    const canceled: BulkChangeJob = { ...job, status: "Canceled", auditLog };
    get().updateJob(canceled);
  },
  retryAppSync: (jobId, employeeIds, note) => {
    if (appSyncRetries.has(jobId)) return;
    const job = get().jobs.find((j) => j.id === jobId);
    if (!job) return;
    const idSet = new Set(employeeIds);
    const targets = job.results.filter((r) => idSet.has(r.employeeId) && r.failedStep === "thirdPartySync");
    if (targets.length === 0) return;

    const auditLog = [
      ...job.auditLog,
      {
        at: Date.now(),
        message: `App sync retry requested for ${targets.length} ${job.kind === "csv" ? "row(s)" : "employee(s)"}${
          note && note.trim().length ? ` — ${note.trim()}` : ""
        }`,
      },
    ];

    const updated: BulkChangeJob = { ...job, status: "Running", auditLog };
    get().updateJob(updated);

    appSyncRetries.add(jobId);
    void (async () => {
      try {
        let next = updated;
        for (const target of targets) {
          await sleep(220 + Math.random() * 240);
          const retryOk = Math.random() < 0.8;
          const failMessage = "App sync retry failed — downstream app still rejecting update";
          const results: JobEmployeeResult[] = next.results.map((r) => {
            if (r.employeeId !== target.employeeId) return r;
            const steps = { ...r.steps, thirdPartySync: retryOk ? "ok" : "failed" };
            const ok = Object.values(steps).every((s) => s === "ok" || s === "skipped");
            const failedStep: PropStep | undefined = retryOk ? undefined : "thirdPartySync";
            return {
              ...r,
              ok,
              failedStep,
              message: retryOk ? undefined : failMessage,
              steps,
            };
          });

          next = { ...next, results, processedCount: results.length };
          next.auditLog = [
            ...next.auditLog,
            {
              at: Date.now(),
              message: retryOk
                ? `App sync retry succeeded for ${target.employeeId}`
                : `App sync retry failed for ${target.employeeId}: ${failMessage}`,
            },
          ];
          get().updateJob(next);
        }

        const failures = next.results.filter((r) => !r.ok).length;
        const status: JobStatus = failures === 0 ? "Completed" : "CompletedWithErrors";
        get().updateJob({ ...next, status });
      } finally {
        appSyncRetries.delete(jobId);
      }
    })();
  },

  addJob: (job) => {
    const jobs = [job, ...get().jobs];
    persistJobs(jobs);
    set({ jobs });
  },

  updateJob: (job) => {
    const jobs = get().jobs.map(j => j.id === job.id ? job : j);
    persistJobs(jobs);
    set({ jobs });
  },
}));
