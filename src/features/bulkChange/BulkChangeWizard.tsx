import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import { Card, CardContent, CardHeader } from "../../components/Card";
import Stepper from "../../components/Stepper";
import { DEPARTMENTS, getEmployees } from "../people/people.data";
import { clearSelectedIds, loadSelectedIds } from "./bulkChange.state";
import { useBulkStore } from "./bulkChange.store";
import type { BulkField } from "./types";
import Step1SelectPeople from "./steps/Step1_SelectPeople";
import Step2ChooseFields from "./steps/Step2_ChooseFields";
import Step3ApplyValues from "./steps/Step3_ApplyValues";
import Step4Review from "./steps/Step4_Review";
import Step5Confirm from "./steps/Step5_Confirm";

const STEPS = ["Select people", "Choose fields", "Apply values", "Review", "Confirm"];

const LOCATION_OPTIONS = ["Headquarters", "Remote", "NYC", "Austin", "Chicago", "London", "Toronto"];

export default function BulkChangeWizard() {
  const nav = useNavigate();
  const employees = useMemo(() => getEmployees(), []);
  const [step, setStep] = useState(0);

  const {
    draft,
    setSelected,
    setSelectedFields,
    setApplyToAllField,
    setOverrideField,
    clearOverrideField,
    resetDraft,
    startJobFromDraft,
  } = useBulkStore();

  useEffect(() => {
    const ids = loadSelectedIds();
    if (ids.length === 0) return;
    setSelected(ids);
    clearSelectedIds();
  }, [setSelected]);

  const selectedEmployees = useMemo(
    () => employees.filter((e) => draft.selectedEmployeeIds.includes(e.id)),
    [employees, draft.selectedEmployeeIds]
  );

  const allApplyValuesPresent = useMemo(() => {
    if (draft.selectedFields.length === 0) return false;
    return draft.selectedFields.every((field) => {
      const v = draft.applyToAll[field];
      if (typeof v === "string") return v.trim().length > 0;
      return v !== undefined && v !== null;
    });
  }, [draft.applyToAll, draft.selectedFields]);

  const canNext =
    (step === 0 && draft.selectedEmployeeIds.length > 0) ||
    (step === 1 && draft.selectedFields.length > 0) ||
    (step === 2 && allApplyValuesPresent) ||
    step === 3;

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
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
    const jobId = startJobFromDraft();
    if (!jobId) return;
    clearSelectedIds();
    nav(`/jobs/${jobId}`);
  };

  const systemsImpacted = ["Payroll", "Benefits", "IT", "Apps"];
  const fieldLabels: Record<BulkField, string> = {
    department: "Department",
    location: "Location",
    workLocation: "Work location",
    managerId: "Manager",
    team: "Team",
    title: "Title",
    level: "Level",
    cashComp: "Cash comp",
    targetBonusPct: "Target bonus %",
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
        <div className="flex flex-col gap-3">
          <Stepper steps={STEPS} activeIndex={step} />

          <div className="rounded-xl border border-[var(--border)] bg-white p-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="text-sm font-semibold">Scope</div>
                <div className="text-sm text-[var(--ink-500)] mt-1">
                  People affected: <span className="font-semibold text-[var(--ink-900)]">{draft.selectedEmployeeIds.length}</span>
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

        {step === 0 ? (
          <Step1SelectPeople
            employees={employees}
            selectedIds={draft.selectedEmployeeIds}
            onChange={setSelected}
          />
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
          />
        ) : null}

        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" onClick={handleBack} disabled={step === 0}>
            Back
          </Button>
          <div className="flex items-center gap-2">
            {step < 4 ? (
              <Button variant="primary" onClick={handleNext} disabled={!canNext}>
                Next
              </Button>
            ) : null}
            {step === 4 ? (
              <Button variant="primary" onClick={handleRun}>
                Run bulk change
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
