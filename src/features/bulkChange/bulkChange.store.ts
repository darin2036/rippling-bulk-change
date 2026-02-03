import { create } from "zustand";
import { uid } from "../../lib/ids";
import { loadJSON, saveJSON } from "../../lib/storage";
import { getEmployees, updateEmployees } from "../people/people.data";
import { continueBulkJob } from "./jobs/jobRunner";
import { continueCsvImportJob } from "./jobs/csvImportRunner";
import type { BulkChangeDraft, BulkChangeJob, BulkField, CsvImportSnapshot } from "./types";
import { groupIssuesByEmployee, validateDraft } from "./grid/validation";

const DRAFT_KEY = "rbp_bulk_draft_v2";
const JOBS_KEY = "rbp_bulk_jobs_v2";

const runningJobs = new Set<string>();

type State = {
  draft: BulkChangeDraft;
  jobs: BulkChangeJob[];

  setSelected: (ids: string[]) => void;
  setSelectedFields: (fields: BulkField[]) => void;
  setApplyToAllField: (field: BulkField, value: unknown) => void;
  setOverrideField: (employeeId: string, field: BulkField, value: unknown) => void;
  clearOverrideField: (employeeId: string, field: BulkField) => void;
  setExceptionOverride: (employeeId: string, override: ExceptionOverride | null) => void;

  resetDraft: () => void;

  startJobFromDraft: () => string | null;
  startCsvJob: (snapshot: CsvImportSnapshot) => string | null;
  ensureJobRunning: (jobId: string) => void;

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
  const auditMsg = `Validation overrides applied: ${overrideCount} employee(s)`;

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

    const jobId = uid("job");
    const job: BulkChangeJob = {
      id: jobId,
      createdAt: Date.now(),
      createdBy: draft.createdBy,
      employeeIds,
      status: "Validating",
      auditLog: [
        { at: Date.now(), message: "Job created" },
        ...(draft.exceptionOverrides && Object.keys(draft.exceptionOverrides).length > 0
          ? [
              {
                at: Date.now(),
                message: `Validation overrides requested: ${Object.keys(draft.exceptionOverrides).length} employee(s)`,
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
    const job: BulkChangeJob = {
      id: jobId,
      createdAt: Date.now(),
      createdBy: "Darin",
      employeeIds: rowIds,
      status: "Running",
      auditLog: [{ at: Date.now(), message: "CSV import job created" }],
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
    if (job.status === "Completed" || job.status === "CompletedWithErrors" || job.status === "Failed") return;
    if (job.processedCount >= job.totalCount) return;

    runningJobs.add(jobId);
    void (async () => {
      try {
        const current = get().jobs.find((j) => j.id === jobId);
        if (!current) return;

        const finalJob =
          current.kind === "csv"
            ? await continueCsvImportJob(current, (nextJob) => {
                get().updateJob(nextJob);
              })
            : await continueBulkJob(current, (nextJob) => {
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
