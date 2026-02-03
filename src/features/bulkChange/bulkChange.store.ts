import { create } from "zustand";
import { uid } from "../../lib/ids";
import { loadJSON, saveJSON } from "../../lib/storage";
import { getEmployees, updateEmployees } from "../people/people.data";
import { continueBulkJob } from "./jobs/jobRunner";
import type { BulkChangeDraft, BulkChangeJob, BulkField } from "./types";

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

  resetDraft: () => void;

  startJobFromDraft: () => string | null;
  ensureJobRunning: (jobId: string) => void;

  addJob: (job: BulkChangeJob) => void;
  updateJob: (job: BulkChangeJob) => void;
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
      auditLog: [{ at: Date.now(), message: "Job created" }],
      results: [],
      processedCount: 0,
      totalCount: employeeIds.length,
      draftSnapshot: JSON.parse(JSON.stringify(draft)) as BulkChangeDraft,
      changesApplied: false,
    };

    get().addJob(job);
    get().resetDraft();

    // Fire and forget.
    void (async () => {
      get().ensureJobRunning(jobId);
    })();

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

        const finalJob = await continueBulkJob(current, (nextJob) => {
          get().updateJob(nextJob);
        });

        // Ensure final persisted job is the completed one.
        get().updateJob(finalJob);

        if (!finalJob.changesApplied && (finalJob.status === "Completed" || finalJob.status === "CompletedWithErrors")) {
          applyDraftToEmployees(finalJob);
          get().updateJob({ ...finalJob, changesApplied: true });
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
