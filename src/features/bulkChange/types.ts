import type { Employee } from "../people/people.data";

export type BulkField =
  | "department"
  | "location"
  | "workLocation"
  | "managerId"
  | "team"
  | "title"
  | "level"
  | "cashComp"
  | "targetBonusPct";

export type ApplyToAll = Partial<Record<BulkField, unknown>>;
export type OverridesByEmployee = Record<string, Partial<Record<BulkField, unknown>>>;

export type ValidationIssue = {
  employeeId: string;
  field: BulkField;
  message: string;
  severity: "error" | "warning";
};

export type BulkChangeDraft = {
  id: string;
  createdAt: number;
  createdBy: string;
  selectedEmployeeIds: string[];
  selectedFields: BulkField[];
  applyToAll: ApplyToAll;
  overrides: OverridesByEmployee;
};

export type PropStep =
  | "systemOfRecordUpdate"
  | "payrollSync"
  | "benefitsSync"
  | "deviceMgmtSync"
  | "thirdPartySync";

export type JobStatus =
  | "Draft"
  | "Validating"
  | "Ready"
  | "Running"
  | "Completed"
  | "CompletedWithErrors"
  | "Failed";

export type JobEmployeeResult = {
  employeeId: string;
  ok: boolean;
  failedStep?: PropStep;
  message?: string;
  steps: Record<PropStep, "pending" | "ok" | "failed" | "skipped">;
};

export type BulkChangeJob = {
  id: string;
  createdAt: number;
  createdBy: string;
  employeeIds: string[];
  status: JobStatus;
  auditLog: { at: number; message: string }[];
  results: JobEmployeeResult[];
  processedCount: number;
  totalCount: number;
  draftSnapshot: BulkChangeDraft;
  changesApplied?: boolean;
};

export type PeopleIndex = {
  employees: Employee[];
  byId: Record<string, Employee>;
};
