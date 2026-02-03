export type CsvField = {
  key: string;
  label: string;
  required?: boolean;
  description?: string;
  category?: "Identity" | "Org" | "Employment" | "Compensation";
};

export const CSV_FIELDS: CsvField[] = [
  { key: "employeeId", label: "Employee ID", required: true, category: "Identity" },
  { key: "workEmail", label: "Work email", required: true, category: "Identity" },
  { key: "name", label: "Name", category: "Identity" },
  { key: "department", label: "Department", category: "Org" },
  { key: "team", label: "Team", category: "Org" },
  { key: "managerId", label: "Manager ID", category: "Org" },
  { key: "workLocation", label: "Work location", category: "Employment" },
  { key: "title", label: "Title", category: "Employment" },
  { key: "level", label: "Level", category: "Employment" },
  { key: "payPeriod", label: "Pay period", category: "Compensation" },
  { key: "cashComp", label: "Cash comp", category: "Compensation" },
  { key: "targetBonusPct", label: "Target bonus %", category: "Compensation" },
  { key: "status", label: "Status", category: "Employment" },
  { key: "startDate", label: "Start date", category: "Employment" },
  { key: "endDate", label: "End date", category: "Employment" },
  { key: "employmentType", label: "Employment type", category: "Employment" },
  { key: "jurisdiction", label: "Jurisdiction", category: "Employment" },
  { key: "legalEntity", label: "Legal entity", category: "Employment" },
];

export const REQUIRED_KEYS = CSV_FIELDS.filter((f) => f.required).map((f) => f.key);

