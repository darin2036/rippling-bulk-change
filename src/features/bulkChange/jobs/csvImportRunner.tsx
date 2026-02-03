import type { BulkChangeJob, JobEmployeeResult, PropStep } from "../types";

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
  { step: "payrollSync" as const, msg: "Payroll lock window — compensation updates blocked" },
  { step: "systemOfRecordUpdate" as const, msg: "Invalid department mapping — HR system rejected update" },
  { step: "benefitsSync" as const, msg: "Benefits eligibility mismatch — enrollment update blocked" },
  { step: "deviceMgmtSync" as const, msg: "IT policy requires approval for location change" },
  { step: "thirdPartySync" as const, msg: "App provisioning conflict — Okta group sync failed" },
  { step: "systemOfRecordUpdate" as const, msg: "Manager has too many direct reports — reassignment required" },
  { step: "payrollSync" as const, msg: "Tax withholding impacted by location change — payroll review required" },
];

function cloneJob(job: BulkChangeJob): BulkChangeJob {
  return {
    ...job,
    auditLog: [...job.auditLog],
    results: [...job.results],
    draftSnapshot: JSON.parse(JSON.stringify(job.draftSnapshot)),
    csv: job.csv ? JSON.parse(JSON.stringify(job.csv)) : undefined,
  };
}

function makeFailedSteps(failed: PropStep): JobEmployeeResult["steps"] {
  const steps: JobEmployeeResult["steps"] = {
    systemOfRecordUpdate: "pending",
    payrollSync: "pending",
    benefitsSync: "pending",
    deviceMgmtSync: "pending",
    thirdPartySync: "pending",
  };
  steps[failed] = "failed";
  for (const s of STEPS) {
    if (steps[s] === "pending") steps[s] = "skipped";
  }
  return steps;
}

export async function continueCsvImportJob(
  job: BulkChangeJob,
  onUpdate: (job: BulkChangeJob) => void
): Promise<BulkChangeJob> {
  let next = cloneJob(job);

  const audit = (message: string) => {
    next.auditLog = [...next.auditLog, { at: Date.now(), message }];
    onUpdate(next);
  };

  if (next.status !== "Running") {
    next = { ...next, status: "Running" };
    audit("Starting CSV import…");
  }

  const processed = new Set(next.results.map((r) => r.employeeId));
  const remaining = next.employeeIds.filter((id) => !processed.has(id));
  const total = next.employeeIds.length;

  const hasAudit = (prefix: string) => next.auditLog.some((e) => e.message.startsWith(prefix));
  const maybeAuditMilestone = () => {
    if (total === 0) return;
    const pct = Math.round((next.processedCount / total) * 100);
    if (pct >= 0 && !hasAudit("Updating HR system")) audit("Updating HR system of record…");
    if (pct >= 25 && !hasAudit("Syncing payroll")) audit("Syncing payroll…");
    if (pct >= 50 && !hasAudit("Syncing benefits")) audit("Syncing benefits…");
    if (pct >= 70 && !hasAudit("Updating IT")) audit("Updating IT access & devices…");
    if (pct >= 85 && !hasAudit("Updating apps")) audit("Updating apps & integrations…");
  };

  maybeAuditMilestone();

  const byRowId = new Map(next.csv?.records.map((r) => [r.rowId, r]) ?? []);

  for (const rowId of remaining) {
    await sleep(250 + Math.random() * 350);

    const record = byRowId.get(rowId);
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

    if (!record) {
      ok = false;
      failedStep = "systemOfRecordUpdate";
      message = "Row could not be resolved (internal error)";
      Object.assign(steps, makeFailedSteps("systemOfRecordUpdate"));
    } else if (record.issues.length > 0) {
      ok = false;
      failedStep = "systemOfRecordUpdate";
      message = record.issues.map((i) => i.message).slice(0, 3).join(" • ");
      Object.assign(steps, makeFailedSteps("systemOfRecordUpdate"));
    } else if (!record.resolvedEmployeeId) {
      ok = false;
      failedStep = "systemOfRecordUpdate";
      message = "Employee not found for email";
      Object.assign(steps, makeFailedSteps("systemOfRecordUpdate"));
    } else {
      const shouldFail = Math.random() < 0.12; // 5–15% target
      const failPick = FAIL_MESSAGES[Math.floor(Math.random() * FAIL_MESSAGES.length)];
      for (const s of STEPS) {
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
    }

    const res: JobEmployeeResult = {
      employeeId: rowId,
      ok,
      failedStep,
      message,
      steps,
    };

    next.results = [...next.results, res];
    next.processedCount = next.results.length;
    onUpdate(next);
    audit(ok ? `Imported ${rowId}` : `Row ${rowId} failed: ${message}`);
    maybeAuditMilestone();
  }

  const failures = next.results.filter((r) => !r.ok).length;
  next.status = failures === 0 ? "Completed" : "CompletedWithErrors";
  audit("Import completed");

  return next;
}

