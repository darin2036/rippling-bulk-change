import { useMemo, useState } from "react";
import Modal from "./Modal";
import Button from "./Button";
import type { Employee } from "../features/people/people.data";
import { getEmployees } from "../features/people/people.data";
import { useFilterStore } from "../features/people/filters/filter.store";
import { buildFilterChips, removeFilterChip } from "../features/people/filters/filter.engine";
import type { AppliedFilterChip, FilterReferenceData } from "../features/people/filters/filter.types";
import CompensationPanel from "./filters/panels/CompensationPanel";
import DepartmentPanel from "./filters/panels/DepartmentPanel";
import LocationPanel from "./filters/panels/LocationPanel";
import JurisdictionPanel from "./filters/panels/JurisdictionPanel";
import EmploymentStatusPanel from "./filters/panels/EmploymentStatusPanel";
import EmploymentTypePanel from "./filters/panels/EmploymentTypePanel";
import LegalEntityPanel from "./filters/panels/LegalEntityPanel";
import StartDatePanel from "./filters/panels/StartDatePanel";
import EndDatePanel from "./filters/panels/EndDatePanel";
import ManagerPanel from "./filters/panels/ManagerPanel";

type Category = {
  key:
    | "compensation"
    | "department"
    | "location"
    | "jurisdiction"
    | "employmentStatus"
    | "employmentType"
    | "legalEntity"
    | "startDate"
    | "endDate"
    | "manager";
  label: string;
};

const CATEGORIES: Category[] = [
  { key: "compensation", label: "Compensation" },
  { key: "department", label: "Department" },
  { key: "location", label: "Location" },
  { key: "jurisdiction", label: "Jurisdiction" },
  { key: "employmentStatus", label: "Employment status" },
  { key: "employmentType", label: "Employment type" },
  { key: "legalEntity", label: "Legal entity" },
  { key: "startDate", label: "Start date" },
  { key: "endDate", label: "End date" },
  { key: "manager", label: "Manager" },
];

function unique(values: string[]) {
  return Array.from(new Set(values)).filter(Boolean);
}

export default function FiltersModal({
  employees: employeesProp,
  departments: departmentsProp,
  locations: locationsProp,
  jurisdictions: jurisdictionsProp,
  legalEntities: legalEntitiesProp,
}: {
  employees?: Employee[];
  departments?: string[];
  locations?: string[];
  jurisdictions?: string[];
  legalEntities?: string[];
}) {
  const { isOpen, closeFilters, filterState, setFilterState, clearAll } = useFilterStore();
  const [active, setActive] = useState<Category["key"]>("department");

  const employees = useMemo(() => employeesProp ?? getEmployees(), [employeesProp, isOpen]);

  const departments = useMemo(
    () => departmentsProp ?? unique(employees.map((e) => e.department)),
    [departmentsProp, employees]
  );
  const locations = useMemo(
    () => locationsProp ?? unique(employees.map((e) => e.workLocation ?? e.location)),
    [locationsProp, employees]
  );
  const jurisdictions = useMemo(
    () => jurisdictionsProp ?? unique(employees.map((e) => e.jurisdiction ?? "")),
    [jurisdictionsProp, employees]
  );
  const legalEntities = useMemo(
    () => legalEntitiesProp ?? unique(employees.map((e) => e.legalEntity ?? "")),
    [legalEntitiesProp, employees]
  );
  const managers = useMemo(
    () => employees.map((e) => ({ id: e.id, name: e.name ?? e.fullName })),
    [employees]
  );

  const refData: FilterReferenceData = {
    employees,
    departments,
    locations,
    jurisdictions,
    legalEntities,
    managers,
  };

  const chips = buildFilterChips(filterState, refData);

  const removeChip = (chip: AppliedFilterChip) => {
    const next = removeFilterChip(filterState, chip);
    setFilterState(next);
  };

  const renderPanel = () => {
    switch (active) {
      case "compensation":
        return <CompensationPanel currencies={["USD"]} />;
      case "department":
        return <DepartmentPanel departments={departments} />;
      case "location":
        return <LocationPanel locations={locations} />;
      case "jurisdiction":
        return <JurisdictionPanel jurisdictions={jurisdictions} />;
      case "employmentStatus":
        return <EmploymentStatusPanel />;
      case "employmentType":
        return <EmploymentTypePanel />;
      case "legalEntity":
        return <LegalEntityPanel legalEntities={legalEntities} />;
      case "startDate":
        return <StartDatePanel />;
      case "endDate":
        return <EndDatePanel />;
      case "manager":
        return <ManagerPanel managers={managers} />;
      default:
        return null;
    }
  };

  return (
    <Modal open={isOpen} title="Filters" onClose={closeFilters} maxWidthClass="max-w-5xl">
      <div className="p-6 max-h-[85vh] flex flex-col">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold">Filters</div>
            <div className="text-sm text-[var(--ink-500)] mt-1">Refine lists across people views.</div>
          </div>
          <button
            type="button"
            aria-label="Close"
            className="w-9 h-9 rounded-full border border-[var(--border)] bg-white hover:bg-[var(--cream-100)] flex items-center justify-center"
            onClick={closeFilters}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="mt-6 grid grid-cols-[180px_1fr_260px] gap-4 flex-1 min-h-0">
          <div className="border-r border-[var(--border)] pr-3 space-y-1 overflow-auto">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActive(cat.key)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                  active === cat.key
                    ? "bg-[var(--plum-100)] text-[var(--plum-700)] font-semibold"
                    : "hover:bg-[var(--cream-100)] text-[var(--ink-700)]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="min-h-[320px] pr-2 overflow-auto">{renderPanel()}</div>

          <div className="border-l border-[var(--border)] pl-4 overflow-auto">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Selected filters</div>
              <button
                type="button"
                className="text-xs text-[var(--plum-700)] underline"
                onClick={clearAll}
              >
                Clear all
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {chips.length === 0 ? (
                <div className="text-sm text-[var(--ink-500)]">No filters selected.</div>
              ) : (
                chips.map((chip) => (
                  <div
                    key={chip.key}
                    className="flex items-center justify-between gap-2 border border-[var(--border)] rounded-full px-3 py-1 text-xs bg-[var(--cream-100)]"
                  >
                    <span>{chip.label}</span>
                    <button
                      type="button"
                      aria-label="Remove filter"
                      onClick={() => removeChip(chip)}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end">
          <Button variant="primary" onClick={closeFilters}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}
