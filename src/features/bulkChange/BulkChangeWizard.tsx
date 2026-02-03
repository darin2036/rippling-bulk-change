import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import { Card, CardContent, CardHeader } from "../../components/Card";
import Stepper from "../../components/Stepper";
import { DEPARTMENTS, getEmployees } from "../people/people.data";
import { clearSelectedIds, loadSelectedIds } from "./bulkChange.state";
import { useBulkStore } from "./bulkChange.store";
import type { BulkField } from "./types";
import { validateDraft } from "./grid/validation";
import Step1SelectPeople from "./steps/Step1_SelectPeople";
import Step2ChooseFields from "./steps/Step2_ChooseFields";
import Step3ApplyValues from "./steps/Step3_ApplyValues";
import Step4Review from "./steps/Step4_Review";
import Step5Confirm from "./steps/Step5_Confirm";
import ScheduleControls from "./components/ScheduleControls";
import ScheduledUpdatesBanner from "../../components/ScheduledUpdatesBanner";

const GUIDED_STEPS = ["Select people", "Choose fields", "Apply values", "Review", "Confirm"];
const CSV_STEPS = ["Upload CSV", "Review", "Confirm"];

const LOCATION_OPTIONS = ["Headquarters", "Remote", "NYC", "Austin", "Chicago", "London", "Toronto"];

// Fields we allow from CSV headers (case-insensitive).
const CSV_FIELD_ALIASES: Array<{ header: string; field: BulkField }> = [
  { header: "department", field: "department" },
  { header: "worklocation", field: "workLocation" },
  { header: "work_location", field: "workLocation" },
  { header: "managerid", field: "managerId" },
  { header: "manager_id", field: "managerId" },
  { header: "team", field: "team" },
  { header: "title", field: "title" },
  { header: "level", field: "level" },
  { header: "cashcomp", field: "cashComp" },
  { header: "cash_comp", field: "cashComp" },
  { header: "targetbonuspct", field: "targetBonusPct" },
  { header: "target_bonus_pct", field: "targetBonusPct" },
];

function normalizeHeader(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9_]/g, "");
}

// Simple CSV parser: handles commas + basic quoted cells.
function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((l) => l.trim().length > 0);

  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string) => {
    const out: string[] = [];
    let cur = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        // escaped quote
        const next = line[i + 1];
        if (inQuotes && next === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (ch === "," && !inQuotes) {
        out.push(cur);
        cur = "";
        continue;
      }

      cur += ch;
    }

    out.push(cur);
    return out.map((c) => c.trim());
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map((l) => {
    const cols = parseLine(l);
    const rec: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rec[h] = cols[idx] ?? "";
    });
    return rec;
  });

  return { headers, rows };
}

export default function BulkChangeWizard() {
  const nav = useNavigate();
  const location = useLocation();
  const employees = useMemo(() => getEmployees(), []);

  const {
    draft,
    setSelected,
    setSelectedFields,
    setApplyToAllField,
    setOverrideField,
    clearOverrideField,
    setEffectiveSchedule,
    setExceptionOverride,
    resetDraft,
    startJobFromDraft,
  } = useBulkStore();

  const [mode, setMode] = useState<"guided" | "csv">("guided");

  // Guided flow step index (0..4) or CSV flow step index (0..2)
  const [step, setStep] = useState(0);

  // CSV state
  const [csvText, setCsvText] = useState("");
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvSummary, setCsvSummary] = useState<{ affected: number; fields: BulkField[] } | null>(null);

  // Legacy support: if you selected people from the People table and clicked Bulk change,
  // we persist selected IDs and hydrate the draft here.
  useEffect(() => {
    const ids = loadSelectedIds();
    if (ids.length === 0) return;
    setSelected(ids);
    clearSelectedIds();
  }, [setSelected]);

  // Route-driven entry: /bulk-change/import-csv should default to CSV mode.
  useEffect(() => {
    if (location.pathname.includes("/bulk-change/import-csv")) {
      setMode("csv");
      return;
    }
    if (location.pathname.includes("/bulk-change/new")) {
      setMode("guided");
    }
  }, [location.pathname]);

  // If you switch mode, reset step state for that mode.
  useEffect(() => {
    setStep(0);
    setCsvError(null);
    setCsvSummary(null);
  }, [mode]);

  const steps = mode === "csv" ? CSV_STEPS : GUIDED_STEPS;

  const selectedEmployees = useMemo(
    () => employees.filter((e) => draft.selectedEmployeeIds.includes(e.id)),
    [employees, draft.selectedEmployeeIds]
  );

  const validationIssues = useMemo(() => {
    if (mode === "csv") return [];
    return validateDraft(selectedEmployees, draft);
  }, [mode, selectedEmployees, draft]);

  const allApplyValuesPresent = useMemo(() => {
    // In CSV mode we don't use apply-to-all gating; we gate on csvSummary.
    if (mode === "csv") return true;
    if (!draft.selectedFields || draft.selectedFields.length === 0) return false;

    return draft.selectedFields.every((field) => {
      const v = draft.applyToAll[field];
      if (typeof v === "string") return v.trim().length > 0;
      if (v !== undefined && v !== null) return true;

      return draft.selectedEmployeeIds.every((id) => {
        const ov = draft.overrides[id]?.[field];
        if (typeof ov === "string") return ov.trim().length > 0;
        return ov !== undefined && ov !== null;
      });
    });
  }, [draft.applyToAll, draft.overrides, draft.selectedFields, draft.selectedEmployeeIds, mode]);

  const canNext = useMemo(() => {
    if (mode === "csv") {
      if (step === 0) return !!csvSummary && csvSummary.affected > 0 && csvSummary.fields.length > 0;
      if (step === 1) return true; // review
      return true;
    }

    return (
      (step === 0 && draft.selectedEmployeeIds.length > 0) ||
      (step === 1 && draft.selectedFields.length > 0) ||
      (step === 2 && allApplyValuesPresent) ||
      step === 3
    );
  }, [mode, step, csvSummary, draft.selectedEmployeeIds.length, draft.selectedFields.length, allApplyValuesPresent]);

  const handleNext = () => {
    if (step < steps.length - 1) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleCancel = () => {
    clearSelectedIds();
    resetDraft();
    nav("/people");
  };

  const handleRun = () => {
    if (validationIssues.length > 0 && !canRun) return;
    const jobId = startJobFromDraft();
    if (!jobId) return;
    clearSelectedIds();
    nav(`/jobs/${jobId}`);
  };

  const requiredOverrideEmployeeIds = useMemo(() => {
    const set = new Set<string>();
    validationIssues.forEach((i) => set.add(i.employeeId));
    return Array.from(set);
  }, [validationIssues]);

  const canRun = useMemo(() => {
    if (validationIssues.length === 0) return true;
    const overrides = draft.exceptionOverrides || {};
    return requiredOverrideEmployeeIds.every((id) => {
      const o = overrides[id];
      if (!o) return false;
      if (!o.reason || o.reason.trim().length === 0) return false;
      if (o.reason === "Other" && (!o.note || o.note.trim().length === 0)) return false;
      return true;
    });
  }, [validationIssues.length, draft.exceptionOverrides, requiredOverrideEmployeeIds]);

  const systemsImpacted = ["Payroll", "Benefits", "IT", "Apps"];

  const fieldLabels: Partial<Record<BulkField, string>> = {
    department: "Department",
    location: "Location",
    workLocation: "Work location",
    managerId: "Manager",
    team: "Team",
    title: "Title",
    level: "Level",
    cashComp: "Cash comp",
    targetBonusPct: "Target bonus %",
    payPeriod: "Pay period",
    status: "Status",
    startDate: "Start date",
    endDate: "End date",
    employmentType: "Employment type",
    jurisdiction: "Jurisdiction",
    legalEntity: "Legal entity",
  };

  const applyCsvToDraft = (text: string) => {
    setCsvError(null);
    setCsvSummary(null);

    const { headers, rows } = parseCsv(text);
    if (headers.length === 0) {
      setCsvError("CSV appears empty.");
      return;
    }

    const normalizedHeaders = headers.map(normalizeHeader);

    // Identify identity column
    const emailIdx = normalizedHeaders.findIndex((h) => h === "email" || h === "workemail" || h === "work_email");
    const idIdx = normalizedHeaders.findIndex((h) => h === "id" || h === "employeeid" || h === "employee_id");

    if (emailIdx === -1 && idIdx === -1) {
      setCsvError('CSV must include an identity column: "email" (preferred) or "id".');
      return;
    }

    const headerToField = new Map<string, BulkField>();
    for (const h of normalizedHeaders) {
      const match = CSV_FIELD_ALIASES.find((a) => a.header === h);
      if (match) headerToField.set(h, match.field);
    }

    const fieldsFromCsv = Array.from(new Set(Array.from(headerToField.values())));
    if (fieldsFromCsv.length === 0) {
      setCsvError(
        'No editable fields found. Include one or more headers: department, workLocation, managerId, team, title, level, cashComp, targetBonusPct.'
      );
      return;
    }

    // Build lookup maps
    const byEmail = new Map<string, string>();
    const byId = new Map<string, string>();
    employees.forEach((e) => {
      byEmail.set(String((e as any).email || "").toLowerCase(), e.id);
      byId.set(e.id, e.id);
    });

    // Compute selected employee ids and per-employee overrides
    const selectedIds: string[] = [];

    // Reset draft first so repeated uploads don't accumulate stale fields/overrides.
    resetDraft();

    // Select fields
    setSelectedFields(fieldsFromCsv);

    // For CSV we treat every cell as an override per employee.
    rows.forEach((r) => {
      const identityRaw = emailIdx !== -1 ? r[headers[emailIdx]] : r[headers[idIdx]];
      const identity = String(identityRaw || "").trim();
      if (!identity) return;

      const empId =
        emailIdx !== -1
          ? byEmail.get(identity.toLowerCase())
          : byId.get(identity);

      if (!empId) return;
      selectedIds.push(empId);

      // Apply each recognized field
      normalizedHeaders.forEach((nh, i) => {
        const field = headerToField.get(nh);
        if (!field) return;

        const raw = String(r[headers[i]] ?? "").trim();
        if (!raw) return;

        // Coerce types for numeric fields
        if (field === "cashComp" || field === "targetBonusPct") {
          const n = Number(raw);
          if (Number.isFinite(n)) {
            setOverrideField(empId, field, n);
          }
          return;
        }

        setOverrideField(empId, field, raw);
      });
    });

    const uniqueSelected = Array.from(new Set(selectedIds));
    if (uniqueSelected.length === 0) {
      setCsvError("No employees matched by id/email. Check that the CSV identities match your People list.");
      return;
    }

    setSelected(uniqueSelected);

    setCsvSummary({ affected: uniqueSelected.length, fields: fieldsFromCsv });
  };

  const handleCsvFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      setCsvText(text);
      applyCsvToDraft(text);
    };
    reader.onerror = () => {
      setCsvError("Failed to read file.");
    };
    reader.readAsText(file);
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <div className="text-sm text-[var(--ink-500)]">Bulk change</div>
          <div className="text-lg font-semibold mt-1">Update people</div>
        </div>
        <button
          type="button"
          className="text-sm text-[var(--plum-700)] underline"
          onClick={handleCancel}
        >
          Cancel
        </button>
      </CardHeader>

      <CardContent className="space-y-4">
        <ScheduledUpdatesBanner />
        {/* Mode toggle (guided vs CSV) */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold">Mode</div>
            <div className="inline-flex rounded-full border border-[var(--border)] bg-white overflow-hidden">
              <button
                type="button"
                onClick={() => setMode("guided")}
                className={
                  mode === "guided"
                    ? "px-3 py-1.5 text-sm bg-[var(--cream-100)] text-[var(--ink-900)] font-semibold"
                    : "px-3 py-1.5 text-sm text-[var(--ink-600)] hover:bg-[var(--cream-100)]"
                }
              >
                Guided
              </button>
              <button
                type="button"
                onClick={() => setMode("csv")}
                className={
                  mode === "csv"
                    ? "px-3 py-1.5 text-sm bg-[var(--cream-100)] text-[var(--ink-900)] font-semibold"
                    : "px-3 py-1.5 text-sm text-[var(--ink-600)] hover:bg-[var(--cream-100)]"
                }
              >
                CSV upload
              </button>
            </div>
          </div>

          <div className="text-sm text-[var(--ink-500)]">
            {mode === "guided"
              ? "Pick people, choose fields, apply values, then review." 
              : "Upload a CSV to set per-employee values, then review and run."}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Stepper steps={steps} activeIndex={step} />

          <div className="rounded-xl border border-[var(--border)] bg-white p-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="text-sm font-semibold">Scope</div>
                <div className="text-sm text-[var(--ink-500)] mt-1">
                  People affected:{" "}
                  <span className="font-semibold text-[var(--ink-900)]">{draft.selectedEmployeeIds.length}</span>
                </div>
                <div className="text-xs text-[var(--ink-500)] mt-2">
                  Changes will propagate across connected systems.
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[var(--ink-500)]">Systems impacted</div>
                <div className="mt-2 flex items-center justify-end gap-2 flex-wrap">
                  {systemsImpacted.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border border-[var(--border)] bg-[var(--cream-100)] text-[var(--ink-700)]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* GUIDED FLOW */}
        {mode === "guided" ? (
          <>
            {step === 0 ? (
              <Step1SelectPeople employees={employees} selectedIds={draft.selectedEmployeeIds} onChange={setSelected} />
            ) : null}

            {step === 1 ? (
              <Step2ChooseFields selectedFields={draft.selectedFields} onChange={setSelectedFields} />
            ) : null}

            {step === 2 ? (
              <Step3ApplyValues
                employees={employees}
                selectedIds={draft.selectedEmployeeIds}
                fields={draft.selectedFields}
                applyToAll={draft.applyToAll}
                overrides={draft.overrides}
                onSetApplyToAllField={(field, value) => setApplyToAllField(field, value)}
                onSetOverrideField={(employeeId, field, value) => setOverrideField(employeeId, field, value)}
                onClearOverrideField={(employeeId, field) => clearOverrideField(employeeId, field)}
                effectiveMode={draft.effectiveMode ?? "immediate"}
                effectiveAt={draft.effectiveAt}
                onChangeEffectiveSchedule={setEffectiveSchedule}
                departments={DEPARTMENTS}
                locations={LOCATION_OPTIONS}
              />
            ) : null}

            {step === 3 ? (
              <Step4Review
                employees={employees}
                selectedIds={draft.selectedEmployeeIds}
                fields={draft.selectedFields}
                applyToAll={draft.applyToAll}
                overrides={draft.overrides}
              />
            ) : null}

            {step === 4 ? (
              <Step5Confirm
                selectedCount={draft.selectedEmployeeIds.length}
                fieldLabels={fieldLabels}
                selectedFields={draft.selectedFields}
                selectedEmployees={selectedEmployees}
                issues={validationIssues}
                effectiveMode={draft.effectiveMode ?? "immediate"}
                effectiveAt={draft.effectiveAt}
                exceptionOverrides={draft.exceptionOverrides}
                onChangeExceptionOverride={setExceptionOverride}
              />
            ) : null}
          </>
        ) : null}

        {/* CSV FLOW */}
        {mode === "csv" ? (
          <>
            {step === 0 ? (
              <div className="space-y-3">
                <div className="text-sm font-semibold">Upload CSV</div>
                <div className="text-sm text-[var(--ink-500)]">
                  Include an identity column (preferred: <span className="font-semibold text-[var(--ink-900)]">email</span>, or <span className="font-semibold text-[var(--ink-900)]">id</span>)
                  plus any editable columns: department, workLocation, managerId, team, title, level, cashComp, targetBonusPct.
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <label className="text-sm">
                    <span className="sr-only">Choose CSV file</span>
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleCsvFile(f);
                      }}
                    />
                  </label>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      // Provide a small example template
                      const example =
                        "email,department,workLocation,title\n" +
                        "darin@opusguard.com,Executives,Headquarters,CEO\n" +
                        "shu@opusguard.com,Executives,Remote,CTO\n";
                      setCsvText(example);
                      applyCsvToDraft(example);
                    }}
                  >
                    Paste example
                  </Button>
                </div>

                <textarea
                  value={csvText}
                  onChange={(e) => {
                    const t = e.target.value;
                    setCsvText(t);
                    // don't spam parse on every keystroke if empty
                    if (t.trim().length === 0) {
                      setCsvError(null);
                      setCsvSummary(null);
                      return;
                    }
                    applyCsvToDraft(t);
                  }}
                  placeholder="Paste CSV here…"
                  className="w-full min-h-[180px] rounded-xl border border-[var(--border)] bg-white p-3 text-sm font-mono"
                />

                {csvError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 p-3 text-sm">{csvError}</div>
                ) : null}

                {csvSummary ? (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--cream-100)] p-3 text-sm">
                    Matched <span className="font-semibold">{csvSummary.affected}</span> people · Fields: {csvSummary.fields.map((f) => fieldLabels[f] ?? f).join(", ")}
                  </div>
                ) : null}
              </div>
            ) : null}

            {step === 1 ? (
              <div className="space-y-4">
                <ScheduleControls
                  mode={draft.effectiveMode ?? "immediate"}
                  effectiveAt={draft.effectiveAt}
                  onChange={setEffectiveSchedule}
                  label="When should these changes take effect?"
                />
                <Step4Review
                  employees={employees}
                  selectedIds={draft.selectedEmployeeIds}
                  fields={draft.selectedFields}
                  applyToAll={draft.applyToAll}
                  overrides={draft.overrides}
                />
              </div>
            ) : null}

            {step === 2 ? (
              <Step5Confirm
                selectedCount={draft.selectedEmployeeIds.length}
                fieldLabels={fieldLabels}
                selectedFields={draft.selectedFields}
                selectedEmployees={selectedEmployees}
                issues={validationIssues}
                effectiveMode={draft.effectiveMode ?? "immediate"}
                effectiveAt={draft.effectiveAt}
                exceptionOverrides={draft.exceptionOverrides}
                onChangeExceptionOverride={setExceptionOverride}
              />
            ) : null}
          </>
        ) : null}

        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" onClick={handleBack} disabled={step === 0}>
            Back
          </Button>
          <div className="flex items-center gap-2">
            {step < steps.length - 1 ? (
              <Button variant="primary" onClick={handleNext} disabled={!canNext}>
                Next
              </Button>
            ) : null}
            {step === steps.length - 1 ? (
              <Button variant="primary" onClick={handleRun} disabled={!canRun}>
                Run bulk change
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
