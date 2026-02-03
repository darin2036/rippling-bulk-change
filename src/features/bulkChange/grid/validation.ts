import type { Employee } from "../../people/people.data";
import type { BulkChangeDraft, BulkField, ValidationIssue } from "../types";

export function computeEffectiveValue(
  employee: Employee,
  draft: BulkChangeDraft,
  field: BulkField
): any {
  const override = draft.overrides[employee.id]?.[field];
  if (override !== undefined) return override;
  const applied = draft.applyToAll[field];
  if (applied !== undefined) return applied;
  return (employee as any)[field];
}

export function validateDraft(employees: Employee[], draft: BulkChangeDraft): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const e of employees) {
    const cashComp = computeEffectiveValue(e, draft, "cashComp");
    const level = computeEffectiveValue(e, draft, "level");
    const managerId = computeEffectiveValue(e, draft, "managerId");
    const bonus = computeEffectiveValue(e, draft, "targetBonusPct");
    const payPeriod = e.payPeriod;

    if (cashComp !== undefined && typeof cashComp === "number" && cashComp < 0) {
      issues.push({ employeeId: e.id, field: "cashComp", message: "Cash comp must be >= 0", severity: "error" });
    }

    const allowed = ["L1","L2","L3","L4","L5","L6","L7"];
    if (level !== undefined && !allowed.includes(String(level))) {
      issues.push({ employeeId: e.id, field: "level", message: "Level must be L1–L7", severity: "error" });
    }

    if (managerId && managerId === e.id) {
      issues.push({ employeeId: e.id, field: "managerId", message: "Manager cannot be the employee", severity: "error" });
    }

    if (payPeriod === "Hourly" && bonus && Number(bonus) > 0) {
      issues.push({ employeeId: e.id, field: "targetBonusPct", message: "Hourly employees cannot have target bonus %", severity: "error" });
    }

    if (bonus !== undefined && (Number(bonus) < 0 || Number(bonus) > 100)) {
      issues.push({ employeeId: e.id, field: "targetBonusPct", message: "Bonus % must be 0–100", severity: "error" });
    }
  }

  return issues;
}

export function groupIssuesByEmployee(issues: ValidationIssue[]) {
  const by: Record<string, ValidationIssue[]> = {};
  for (const it of issues) {
    by[it.employeeId] = by[it.employeeId] || [];
    by[it.employeeId].push(it);
  }
  return by;
}
