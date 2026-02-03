import type { Employee } from "../../people/people.data";
import type { BulkChangeDraft, BulkField } from "../types";
import { computeEffectiveValue } from "./validation";

export type DiffRow = {
  employeeId: string;
  employeeName: string;
  field: BulkField;
  before: any;
  after: any;
};

const FIELDS: BulkField[] = [
  "department",
  "workLocation",
  "managerId",
  "team",
  "title",
  "level",
  "cashComp",
  "targetBonusPct",
];

export function computeDiff(employees: Employee[], draft: BulkChangeDraft): DiffRow[] {
  const out: DiffRow[] = [];
  for (const e of employees) {
    for (const f of FIELDS) {
      const after = computeEffectiveValue(e, draft, f);
      const before = (e as any)[f];
      const changed = JSON.stringify(before) !== JSON.stringify(after);
      if (changed) out.push({ employeeId: e.id, employeeName: e.name ?? e.fullName, field: f, before, after });
    }
  }
  return out;
}

export function summarizeByField(diff: DiffRow[]) {
  const m: Record<string, number> = {};
  for (const d of diff) m[d.field] = (m[d.field] || 0) + 1;
  return m;
}
