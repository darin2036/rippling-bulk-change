import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/Button";
import { Card, CardContent, CardHeader } from "../../../components/Card";
import { parseCSV, downloadTextFile } from "../../../lib/csv";
import { getEmployees, DEPARTMENTS } from "../../people/people.data";
import { CSV_FIELDS, REQUIRED_KEYS } from "./csvFields";
import { makeTemplateCsv } from "./csvTemplate";
import { useBulkStore } from "../bulkChange.store";
import { loadSelectedIds } from "../bulkChange.state";
import type { Employee } from "../../people/people.data";
import type { CsvImportSnapshot } from "../types";
import { useFilterStore } from "../../people/filters/filter.store";
import { applyEmployeeFilters, buildFilterChips, removeFilterChip } from "../../people/filters/filter.engine";

const LOCATION_OPTIONS = ["Headquarters", "Remote", "NYC", "Austin", "Chicago", "London", "Toronto"];
const LEVELS = ["L1", "L2", "L3", "L4", "L5", "L6", "L7"];

type ParsedUpload = {
  headers: string[];
  presentKeys: string[];
  headerKeyMap: (string | null)[];
  rows: string[][];
  records: CsvImportSnapshot["records"];
  errorsByRow: Record<string, Record<string, string>>;
  validCount: number;
  invalidCount: number;
};

function normalizeKey(raw: string) {
  return raw.toLowerCase().replace(/[\s_-]/g, "");
}

const FIELD_BY_NORMALIZED = new Map(
  CSV_FIELDS.map((f) => [normalizeKey(f.key), f.key])
);
FIELD_BY_NORMALIZED.set("email", "workEmail");
FIELD_BY_NORMALIZED.set("workemail", "workEmail");
FIELD_BY_NORMALIZED.set("employeeid", "employeeId");
FIELD_BY_NORMALIZED.set("managerid", "managerId");

export default function CsvImportPage() {
  const nav = useNavigate();
  const employees = useMemo(() => getEmployees(), []);
  const { startCsvJob, draft } = useBulkStore();
  const { filterState, openFilters, setFilterState } = useFilterStore();

  const selectedIds = useMemo(() => {
    if (draft.selectedEmployeeIds.length > 0) return draft.selectedEmployeeIds;
    return loadSelectedIds();
  }, [draft.selectedEmployeeIds]);

  const [scope, setScope] = useState<"all" | "filtered" | "blank">("all");
  const requiredKeys = useMemo(() => REQUIRED_KEYS, []);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() =>
    CSV_FIELDS.filter((f) => f.required).map((f) => f.key)
  );

  const [parseError, setParseError] = useState<string | null>(null);
  const [upload, setUpload] = useState<ParsedUpload | null>(null);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof CSV_FIELDS> = {};
    CSV_FIELDS.forEach((f) => {
      const category = f.category ?? "Other";
      groups[category] = groups[category] ?? [];
      groups[category].push(f);
    });
    return groups;
  }, []);

  const filteredEmployees = useMemo(
    () => applyEmployeeFilters(employees, filterState),
    [employees, filterState]
  );

  const filterChips = useMemo(
    () =>
      buildFilterChips(filterState, {
        employees,
        departments: Array.from(new Set(employees.map((e) => e.department))),
        locations: Array.from(new Set(employees.map((e) => e.workLocation ?? e.location))),
        jurisdictions: Array.from(new Set(employees.map((e) => e.jurisdiction ?? ""))).filter(Boolean),
        legalEntities: Array.from(new Set(employees.map((e) => e.legalEntity ?? ""))).filter(Boolean),
        managers: employees.map((e) => ({ id: e.id, name: e.name ?? e.fullName })),
      }),
    [employees, filterState]
  );

  const employeesById = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);
  const employeesByEmail = useMemo(
    () => new Map(employees.map((e) => [e.email.toLowerCase(), e])),
    [employees]
  );

  const handleToggleKey = (key: string) => {
    if (requiredKeys.includes(key)) return;
    if (selectedKeys.includes(key)) {
      setSelectedKeys(selectedKeys.filter((k) => k !== key));
    } else {
      setSelectedKeys([...selectedKeys, key]);
    }
  };

  const handleSelectAll = () => {
    const allKeys = CSV_FIELDS.map((f) => f.key);
    setSelectedKeys(Array.from(new Set([...requiredKeys, ...allKeys])));
  };

  const handleClear = () => {
    setSelectedKeys([...requiredKeys]);
  };

  const downloadTemplate = () => {
    const scopedEmployees = scope === "filtered" ? filteredEmployees : employees;
    const { filename, csvText } = makeTemplateCsv({
      scope,
      employees: scopedEmployees,
      selectedKeys,
      selectedIds,
    });
    downloadTextFile(filename, csvText, "text/csv");
  };

  const parseUpload = (text: string) => {
    setParseError(null);
    try {
      const parsed = parseCSV(text);
      if (parsed.headers.length === 0) throw new Error("Missing CSV headers.");

      const headerKeyMap = parsed.headers.map((h) => FIELD_BY_NORMALIZED.get(normalizeKey(h)) ?? null);
      const presentKeys = Array.from(new Set(headerKeyMap.filter((k): k is string => Boolean(k))));

      const hasRequired = presentKeys.includes("employeeId") || presentKeys.includes("workEmail");
      if (!hasRequired) {
        throw new Error("CSV must include employeeId or workEmail headers.");
      }

      const errorsByRow: Record<string, Record<string, string>> = {};
      const records: CsvImportSnapshot["records"] = [];
      let validCount = 0;
      let invalidCount = 0;

      parsed.rows.forEach((row, idx) => {
        const rowId = `row_${idx + 1}`;
        const rowErrors: Record<string, string> = {};
        const values: Record<string, unknown> = {};

        const getValue = (key: string) => {
          const colIndex = headerKeyMap.findIndex((k) => k === key);
          if (colIndex === -1) return "";
          return (row[colIndex] ?? "").trim();
        };

        const employeeId = getValue("employeeId");
        const workEmail = getValue("workEmail").toLowerCase();
        let employee: Employee | undefined;

        if (employeeId) {
          employee = employeesById.get(employeeId);
          if (!employee) rowErrors.employeeId = "Employee ID not found.";
        } else if (workEmail) {
          employee = employeesByEmail.get(workEmail);
          if (!employee) rowErrors.workEmail = "Work email not found.";
        } else {
          rowErrors.employeeId = "Employee identifier required.";
        }

        if (presentKeys.includes("department")) {
          const v = getValue("department");
          if (v && !DEPARTMENTS.includes(v)) rowErrors.department = "Unknown department.";
          if (v) values.department = v;
        }

        if (presentKeys.includes("workLocation")) {
          const v = getValue("workLocation");
          if (v && !LOCATION_OPTIONS.includes(v)) rowErrors.workLocation = "Unknown work location.";
          if (v) values.workLocation = v;
        }

        if (presentKeys.includes("managerId")) {
          const v = getValue("managerId");
          if (v && !employeesById.has(v)) rowErrors.managerId = "Manager ID not found.";
          if (v) values.managerId = v;
        }

        if (presentKeys.includes("team")) {
          const v = getValue("team");
          if (v) values.team = v;
        }

        if (presentKeys.includes("title")) {
          const v = getValue("title");
          if (v) values.title = v;
        }

        if (presentKeys.includes("level")) {
          const v = getValue("level");
          if (v && !LEVELS.includes(v)) rowErrors.level = "Invalid level.";
          if (v) values.level = v;
        }

        if (presentKeys.includes("cashComp")) {
          const v = getValue("cashComp");
          if (v && Number.isNaN(Number(v))) rowErrors.cashComp = "Cash comp must be numeric.";
          if (v) values.cashComp = Number(v);
        }

        if (presentKeys.includes("targetBonusPct")) {
          const v = getValue("targetBonusPct");
          const n = Number(v);
          if (v && (Number.isNaN(n) || n < 0 || n > 100)) rowErrors.targetBonusPct = "Bonus must be 0–100.";
          if (v) values.targetBonusPct = n;
        }

        if (presentKeys.includes("payPeriod")) {
          const v = getValue("payPeriod");
          if (v) values.payPeriod = v;
        }
        if (presentKeys.includes("status")) {
          const v = getValue("status");
          if (v) values.status = v;
        }
        if (presentKeys.includes("startDate")) {
          const v = getValue("startDate");
          if (v) values.startDate = v;
        }
        if (presentKeys.includes("endDate")) {
          const v = getValue("endDate");
          if (v) values.endDate = v;
        }
        if (presentKeys.includes("employmentType")) {
          const v = getValue("employmentType");
          if (v) values.employmentType = v;
        }
        if (presentKeys.includes("jurisdiction")) {
          const v = getValue("jurisdiction");
          if (v) values.jurisdiction = v;
        }
        if (presentKeys.includes("legalEntity")) {
          const v = getValue("legalEntity");
          if (v) values.legalEntity = v;
        }

        const issues = Object.entries(rowErrors).map(([field, message]) => ({ field, message }));
        if (issues.length > 0) invalidCount += 1;
        else validCount += 1;

        errorsByRow[rowId] = rowErrors;
        records.push({
          rowId,
          email: workEmail || employee?.email || "",
          resolvedEmployeeId: employee?.id ?? null,
          values,
          issues,
        });
      });

      setUpload({
        headers: parsed.headers,
        presentKeys,
        headerKeyMap,
        rows: parsed.rows,
        records,
        errorsByRow,
        validCount,
        invalidCount,
      });
    } catch (err) {
      setUpload(null);
      setParseError(err instanceof Error ? err.message : "Failed to parse CSV.");
    }
  };

  const canDownload = scope !== "filtered" || filteredEmployees.length > 0;
  const selectedCount = selectedKeys.length;

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <div className="text-sm text-[var(--ink-500)]">Bulk change</div>
          <div className="text-lg font-semibold mt-1">Import from CSV</div>
        </div>
        <button
          type="button"
          className="text-sm text-[var(--plum-700)] underline"
          onClick={() => nav("/people")}
        >
          Cancel
        </button>
      </CardHeader>

      <CardContent className="space-y-6">
        <Card>
          <CardHeader>
            <div className="text-sm font-semibold">Download template</div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-wide text-[var(--ink-500)]">Scope</div>
                {["all", "filtered", "blank"].map((s) => (
                  <label key={s} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="template-scope"
                      checked={scope === s}
                      onChange={() => setScope(s as "all" | "filtered" | "blank")}
                    />
                    {s === "all" ? "All employees" : s === "filtered" ? "Filtered employees" : "Blank template"}
                  </label>
                ))}
                {scope === "filtered" && filteredEmployees.length === 0 ? (
                  <div className="text-xs text-amber-700">
                    No employees match the current filters. Adjust filters to continue.
                  </div>
                ) : null}
              </div>

              <div className="md:col-span-2 space-y-3">
                {scope === "filtered" ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs uppercase tracking-wide text-[var(--ink-500)]">Filters</div>
                      <Button size="sm" onClick={openFilters}>
                        Edit filters
                      </Button>
                    </div>
                    <div className="text-xs text-[var(--ink-500)]">
                      {filteredEmployees.length} employees match the current filters.
                    </div>
                    {filterChips.length > 0 ? (
                      <div className="flex items-center flex-wrap gap-2">
                        {filterChips.map((chip) => (
                          <button
                            key={chip.key}
                            type="button"
                            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--cream-100)] px-3 py-1 text-xs"
                            onClick={() => setFilterState(removeFilterChip(filterState, chip))}
                          >
                            {chip.label}
                            <span className="text-[var(--ink-500)]">×</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-[var(--ink-500)]">No filters applied.</div>
                    )}
                  </div>
                ) : null}
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase tracking-wide text-[var(--ink-500)]">Columns</div>
                  <div className="text-xs text-[var(--ink-500)]">{selectedCount} selected</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSelectAll}>Select all</Button>
                  <Button size="sm" variant="ghost" onClick={handleClear}>Clear</Button>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries(grouped).map(([category, fields]) => (
                    <div key={category} className="space-y-2">
                      <div className="text-xs uppercase tracking-wide text-[var(--ink-500)]">{category}</div>
                      <div className="space-y-1">
                        {fields.map((field) => (
                          <label key={field.key} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={selectedKeys.includes(field.key)}
                              disabled={field.required}
                              onChange={() => handleToggleKey(field.key)}
                            />
                            {field.label}
                            {field.required ? <span className="text-xs text-[var(--ink-500)]">(required)</span> : null}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Button variant="primary" disabled={!canDownload} onClick={downloadTemplate}>
              Download template
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="text-sm font-semibold">Upload CSV</div>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                file.text().then(parseUpload);
              }}
            />

            {parseError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {parseError}
              </div>
            ) : null}

            {upload ? (
              <div className="grid lg:grid-cols-[1fr_320px] gap-4">
                <div className="overflow-auto border border-[var(--border)] rounded-xl">
                  <table className="min-w-[900px] w-full text-sm">
                    <thead className="bg-[var(--cream-100)] text-[var(--ink-500)] border-b border-[var(--border)]">
                      <tr>
                        <th className="p-3 text-left">Row</th>
                        {upload.presentKeys.map((key) => {
                          const field = CSV_FIELDS.find((f) => f.key === key);
                          return (
                            <th key={key} className="p-3 text-left">
                              {field?.label ?? key}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {upload.records.map((_, idx) => {
                        const rowId = `row_${idx + 1}`;
                        const rowErrors = upload.errorsByRow[rowId] ?? {};
                        return (
                          <tr key={rowId} className={Object.keys(rowErrors).length ? "bg-red-50" : ""}>
                            <td className="p-3 font-medium">{rowId}</td>
                            {upload.presentKeys.map((key) => {
                              const colIndex = upload.headerKeyMap.findIndex((k) => k === key);
                              const rawValue = colIndex !== -1 ? upload.rows[idx]?.[colIndex] ?? "" : "";
                              const error = rowErrors[key];
                              return (
                                <td key={`${rowId}-${key}`} className="p-3 align-top">
                                  <div className={error ? "border border-red-200 bg-white rounded-md px-2 py-1" : ""}>
                                    <div>{rawValue}</div>
                                    {error ? <div className="text-xs text-red-700 mt-1">{error}</div> : null}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="space-y-3">
                  <div className="rounded-xl border border-[var(--border)] bg-white p-3">
                    <div className="text-sm font-semibold">Summary</div>
                    <div className="text-sm text-[var(--ink-700)] mt-2 space-y-1">
                      <div>Total rows: <span className="font-semibold">{upload.records.length}</span></div>
                      <div>Valid rows: <span className="font-semibold text-emerald-700">{upload.validCount}</span></div>
                      <div>Invalid rows: <span className="font-semibold text-red-700">{upload.invalidCount}</span></div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-white p-3 space-y-2">
                    <div className="text-sm font-semibold">Row issues</div>
                    {upload.invalidCount === 0 ? (
                      <div className="text-sm text-[var(--ink-500)]">No issues found.</div>
                    ) : (
                      upload.records
                        .filter((r) => r.issues.length > 0)
                        .slice(0, 6)
                        .map((r) => (
                          <div key={r.rowId} className="text-xs text-[var(--ink-700)]">
                            {r.rowId}: {r.issues.map((i) => i.message).join(" · ")}
                          </div>
                        ))
                    )}
                  </div>
                  <Button
                    variant="primary"
                    disabled={upload.validCount === 0}
                    onClick={() => {
                      if (!upload) return;
                      const snapshot: CsvImportSnapshot = {
                        headers: upload.presentKeys,
                        records: upload.records,
                      };
                      const jobId = startCsvJob(snapshot);
                      if (jobId) nav(`/jobs/${jobId}`);
                    }}
                  >
                    Create job
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
