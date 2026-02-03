import { useMemo } from "react";
import type { Employee } from "../../people/people.data";
import { useFilterStore } from "../../people/filters/filter.store";
import { applyEmployeeFilters, buildFilterChips, removeFilterChip } from "../../people/filters/filter.engine";
import Button from "../../../components/Button";

type Props = {
  employees: Employee[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

export default function Step1SelectPeople({ employees, selectedIds, onChange }: Props) {
  const { filterState, openFilters, setFilterState } = useFilterStore();
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

  const selectedSet = new Set(selectedIds);
  const allSelected = filteredEmployees.length > 0 && filteredEmployees.every((e) => selectedSet.has(e.id));

  const toggle = (id: string) => {
    const next = new Set(selectedSet);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onChange(Array.from(next));
  };

  const toggleAll = () => {
    if (allSelected) {
      onChange([]);
    } else {
      const next = new Set(selectedIds);
      filteredEmployees.forEach((e) => next.add(e.id));
      onChange(Array.from(next));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-[var(--ink-500)]">
        <div>
          Selected people: <span className="font-semibold text-[var(--ink-900)]">{selectedIds.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={openFilters}>Filters</Button>
          <button
            type="button"
            className="text-sm text-[var(--plum-700)] underline"
            onClick={toggleAll}
          >
            {allSelected ? "Clear selection" : "Select all"}
          </button>
        </div>
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
      ) : null}

      <div className="overflow-auto border border-[var(--border)] rounded-xl max-h-80">
        <table className="w-full text-sm">
          <thead className="bg-[var(--cream-100)] text-[var(--ink-500)] border-b border-[var(--border)] sticky top-0">
            <tr>
              <th className="p-3 w-10">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              </th>
              <th className="text-left font-medium p-3">Name</th>
              <th className="text-left font-medium p-3">Department</th>
              <th className="text-left font-medium p-3">Title</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((emp) => (
              <tr key={emp.id} className="border-b border-[var(--border)] hover:bg-[var(--cream-100)]">
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selectedSet.has(emp.id)}
                    onChange={() => toggle(emp.id)}
                  />
                </td>
                <td className="p-3">
                  <div className="font-medium">{emp.fullName}</div>
                  <div className="text-xs text-[var(--ink-500)]">{emp.email}</div>
                </td>
                <td className="p-3">{emp.department}</td>
                <td className="p-3">{emp.title}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
