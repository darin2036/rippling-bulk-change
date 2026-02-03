import type { BulkChangeDraft, BulkChangeJob, JobEmployeeResult, PropStep } from "../types";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const STEPS: PropStep[] = [
  "systemOfRecordUpdate",
  "payrollSync",
  "benefitsSync",
  "deviceMgmtSync",
  "thirdPartySync",
];

const FAIL_MESSAGES = [
  { step: "payrollSync" as const, msg: "Payroll lock window — comp changes blocked" },
  { step: "thirdPartySync" as const, msg: "Integration conflict — Google Workspace update failed" },
  { step: "systemOfRecordUpdate" as const, msg: "Permission denied for department change" },
  { step: "deviceMgmtSync" as const, msg: "Device inventory mismatch — location change needs IT approval" },
  { step: "systemOfRecordUpdate" as const, msg: "Manager has too many direct reports — reassignment required" },
  { step: "payrollSync" as const, msg: "Tax withholding impacted by location change — payroll review required" },
  { step: "benefitsSync" as const, msg: "Benefits eligibility mismatch — plan update blocked" },
  { step: "thirdPartySync" as const, msg: "App provisioning conflict — Okta group sync failed" },
];

function cloneJob(job: BulkChangeJob): BulkChangeJob {
  return {
    ...job,
    auditLog: [...job.auditLog],
    results: [...job.results],
    draftSnapshot: JSON.parse(JSON.stringify(job.draftSnapshot)) as BulkChangeDraft,
  };
}

export async function continueBulkJob(
  job: BulkChangeJob,
  onUpdate: (job: BulkChangeJob) => void
): Promise<BulkChangeJob> {
  let next = cloneJob(job);

  const audit = (message: string) => {
    next.auditLog = [...next.auditLog, { at: Date.now(), message }];
    onUpdate(next);
  };

  // Validation stage (resume-safe: only runs when job is explicitly in Validating)
  if (next.status === "Validating") {
    audit("Validating inputs…");
    await sleep(600);
    next = { ...next, status: "Running" };
    audit("Starting propagation across connected systems…");
  } else if (next.status !== "Running") {
    next = { ...next, status: "Running" };
    audit("Starting propagation across connected systems…");
  }

  const processed = new Set(next.results.map((r) => r.employeeId));
  const remaining = next.employeeIds.filter((id) => !processed.has(id));
  const total = next.employeeIds.length;

  const hasAudit = (prefix: string) => next.auditLog.some((e) => e.message.startsWith(prefix));
  const maybeAuditMilestone = () => {
    if (total === 0) return;
    const pct = Math.round((next.processedCount / total) * 100);
    if (pct >= 0 && !hasAudit("Updating HR system")) audit("Updating HR system of record…");
    if (pct >= 20 && !hasAudit("Syncing payroll")) audit("Syncing payroll…");
    if (pct >= 40 && !hasAudit("Syncing benefits")) audit("Syncing benefits…");
    if (pct >= 60 && !hasAudit("Updating IT")) audit("Updating IT access & devices…");
    if (pct >= 80 && !hasAudit("Updating apps")) audit("Updating apps & integrations…");
  };

  maybeAuditMilestone();

  for (const empId of remaining) {
    await sleep(80 + Math.random() * 120);

    const shouldFail = Math.random() < 0.08; // ~8%
    const failPick = FAIL_MESSAGES[Math.floor(Math.random() * FAIL_MESSAGES.length)];

    const steps: JobEmployeeResult["steps"] = {
      systemOfRecordUpdate: "pending",
      payrollSync: "pending",
      benefitsSync: "pending",
      deviceMgmtSync: "pending",
      thirdPartySync: "pending",
    };

    let ok = true;
    let failedStep: PropStep | undefined;
    let message: string | undefined;

    for (const s of STEPS) {
      await sleep(30 + Math.random() * 60);

      if (shouldFail && s === failPick.step) {
        steps[s] = "failed";
        ok = false;
        failedStep = s;
        message = failPick.msg;

        for (const rest of STEPS) {
          if (steps[rest] === "pending") steps[rest] = "skipped";
        }
        break;
      }

      steps[s] = "ok";
    }

    const res: JobEmployeeResult = { employeeId: empId, ok, failedStep, message, steps };
    next.results = [...next.results, res];
    next.processedCount = next.results.length;
    onUpdate(next);

    audit(ok ? `Updated ${empId}` : `Failed ${empId}: ${message}`);
    maybeAuditMilestone();
  }

  const failures = next.results.filter((r) => !r.ok).length;
  next.status = failures === 0 ? "Completed" : "CompletedWithErrors";
  audit("Job completed");

  return next;
}

// Backward-compatible wrapper for older prototype steps.
export async function runBulkJob(
  draft: BulkChangeDraft,
  employeeIds: string[],
  onProgress: (partial: { processedCount: number; results: JobEmployeeResult[]; audit: string }) => void
): Promise<BulkChangeJob> {
  const job: BulkChangeJob = {
    id: `job_${Date.now()}`,
    createdAt: Date.now(),
    createdBy: draft.createdBy,
    employeeIds,
    status: "Running",
    auditLog: [{ at: Date.now(), message: "Job started" }],
    results: [],
    processedCount: 0,
    totalCount: employeeIds.length,
    draftSnapshot: draft,
  };

  const final = await continueBulkJob(
    { ...job, status: "Running" },
    (j) => {
      const lastAudit = j.auditLog[j.auditLog.length - 1]?.message ?? "";
      onProgress({ processedCount: j.processedCount, results: j.results, audit: lastAudit });
    }
  );

  return final;
}
