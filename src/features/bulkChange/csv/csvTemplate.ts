import type { Employee } from "../../people/people.data";
import { toCSV } from "../../../lib/csv";
import { CSV_FIELDS, REQUIRED_KEYS } from "./csvFields";

export { REQUIRED_KEYS };

const FIELD_ORDER = CSV_FIELDS.map((f) => f.key);

export function buildTemplateHeaders(selectedKeys: string[]): string[] {
  const unique = new Set<string>();
  REQUIRED_KEYS.forEach((k) => unique.add(k));
  selectedKeys.forEach((k) => unique.add(k));

  const headers: string[] = [];
  // Ensure required keys first
  REQUIRED_KEYS.forEach((k) => {
    if (unique.has(k)) headers.push(k);
  });
  FIELD_ORDER.forEach((k) => {
    if (unique.has(k) && !headers.includes(k)) headers.push(k);
  });
  return headers;
}

export function employeeToRow(emp: Employee, headers: string[]): string[] {
  const getValue = (key: string) => {
    switch (key) {
      case "employeeId":
        return emp.id;
      case "workEmail":
        return emp.email;
      case "name":
        return emp.name ?? emp.fullName;
      case "department":
        return emp.department;
      case "team":
        return emp.team;
      case "managerId":
        return emp.managerId ?? "";
      case "workLocation":
        return emp.workLocation ?? emp.location;
      case "title":
        return emp.title;
      case "level":
        return emp.level ?? "";
      case "payPeriod":
        return emp.payPeriod ?? "";
      case "cashComp":
        return emp.cashComp ?? emp.baseSalary ?? "";
      case "targetBonusPct":
        return emp.targetBonusPct ?? "";
      case "status":
        return emp.status;
      case "startDate":
        return emp.startDate;
      case "endDate":
        return emp.endDate ?? emp.terminationDate ?? "";
      case "employmentType":
        return emp.employmentType;
      case "jurisdiction":
        return emp.jurisdiction ?? "";
      case "legalEntity":
        return emp.legalEntity ?? "";
      default:
        return "";
    }
  };

  return headers.map((h) => String(getValue(h) ?? ""));
}

export function makeTemplateCsv({
  scope,
  employees,
  selectedKeys,
  selectedIds,
}: {
  scope: "all" | "selected" | "filtered" | "blank";
  employees: Employee[];
  selectedKeys: string[];
  selectedIds?: string[];
}): { filename: string; csvText: string } {
  const headers = buildTemplateHeaders(selectedKeys);
  let rows: (string | number | null | undefined)[][] = [];

  if (scope === "all") {
    rows = employees.map((emp) => employeeToRow(emp, headers));
  } else if (scope === "filtered") {
    rows = employees.map((emp) => employeeToRow(emp, headers));
  } else if (scope === "selected") {
    const selectedSet = new Set(selectedIds ?? []);
    rows = employees.filter((e) => selectedSet.has(e.id)).map((emp) => employeeToRow(emp, headers));
  } else {
    rows = [];
  }

  const csvText = toCSV(headers, rows);
  const suffix =
    scope === "selected"
      ? "selected"
      : scope === "filtered"
        ? "filtered"
        : scope === "all"
          ? "all"
          : "blank";
  return {
    filename: `bulk_change_template_${suffix}.csv`,
    csvText,
  };
}
