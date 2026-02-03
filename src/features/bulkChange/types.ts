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
  | "targetBonusPct"
  | "payPeriod"
  | "status"
  | "startDate"
  | "endDate"
  | "employmentType"
  | "jurisdiction"
  | "legalEntity";

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
  exceptionOverrides?: Record<
    string,
    {
      reason: string;
      note?: string;
      appliedBy: string;
      appliedAt: number;
    }
  >;
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
  kind?: "wizard" | "csv";
  csv?: CsvImportSnapshot;
};

export type PeopleIndex = {
  employees: Employee[];
  byId: Record<string, Employee>;
};

export type CsvImportRecord = {
  rowId: string;
  email: string;
  resolvedEmployeeId: string | null;
  managerEmail?: string;
  // Parsed values to apply (only non-empty entries should be present).
  values: Record<string, unknown>;
  // Validation issues collected at upload time; used to fail rows immediately.
  issues: { field: string; message: string }[];
};

export type CsvImportSnapshot = {
  headers: string[];
  records: CsvImportRecord[];
};
