import { useEffect, useMemo, useRef, useState } from "react";
import Button from "../../../components/Button";
import Badge from "../../../components/Badge";
import { Card, CardContent } from "../../../components/Card";
import type { Employee } from "../people.data";

type ColumnKey = "status" | "startDate" | "location" | "department" | "manager";

type Props = {
  employees: Employee[];
  selectedIds: string[];
  onChangeSelectedIds: (ids: string[]) => void;
  onBulkChange: () => void;
  onOpenProfile: (id: string) => void;
};

function IconColumns() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M3 4h14M3 10h14M3 16h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M7 4v12M13 4v12" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
    </svg>
  );
}

function IconExpand() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M7 3H3v4M13 3h4v4M7 17H3v-4M13 17h4v-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconFilter() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M4 5h12M6 10h8M8 15h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconExport() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M10 3v8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M7 9l3 3 3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 14v3h12v-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IndeterminateCheckbox({
  checked,
  indeterminate,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return <input ref={ref} type="checkbox" checked={checked} onChange={onChange} aria-label={ariaLabel} />;
}

const COLUMN_DEFS: { key: ColumnKey; label: string; widthClass: string }[] = [
  { key: "status", label: "Status", widthClass: "w-28" },
  { key: "startDate", label: "Start date", widthClass: "w-32" },
  { key: "location", label: "Work location", widthClass: "w-36" },
  { key: "department", label: "Department", widthClass: "w-36" },
  { key: "manager", label: "Manager", widthClass: "w-44" },
];

export default function PeopleAdminGrid({
  employees,
  selectedIds,
  onChangeSelectedIds,
  onBulkChange,
  onOpenProfile,
}: Props) {
  const [query, setQuery] = useState("");
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<ColumnKey, boolean>>({
    status: true,
    startDate: true,
    location: true,
    department: true,
    manager: true,
  });

  const managerMap = useMemo(() => new Map(employees.map((e) => [e.id, e.fullName])), [employees]);

  const filteredEmployees = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) => {
      const haystack = `${e.fullName} ${e.email} ${e.title} ${e.department} ${e.location}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [employees, query]);

  const activeCount = useMemo(
    () => filteredEmployees.filter((e) => e.status === "Active").length,
    [filteredEmployees]
  );

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const visibleSelectedCount = useMemo(
    () => filteredEmployees.reduce((acc, e) => acc + (selectedSet.has(e.id) ? 1 : 0), 0),
    [filteredEmployees, selectedSet]
  );
  const allVisibleSelected = filteredEmployees.length > 0 && visibleSelectedCount === filteredEmployees.length;
  const someVisibleSelected = visibleSelectedCount > 0 && !allVisibleSelected;

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      const remaining = selectedIds.filter((id) => !filteredEmployees.some((e) => e.id === id));
      onChangeSelectedIds(remaining);
    } else {
      const next = new Set(selectedIds);
      filteredEmployees.forEach((e) => next.add(e.id));
      onChangeSelectedIds(Array.from(next));
    }
  };

  const toggleRow = (id: string) => {
    if (selectedSet.has(id)) {
      onChangeSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      onChangeSelectedIds([...selectedIds, id]);
    }
  };

  const clearSelection = () => onChangeSelectedIds([]);

  const toggleColumn = (key: ColumnKey) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const visibleDefs = COLUMN_DEFS.filter((c) => visibleColumns[c.key]);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="px-4 py-2.5 border-b border-[var(--border)]">
          {selectedIds.length > 0 ? (
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="font-semibold">{selectedIds.length}</span> selected
              </div>
              <div className="flex items-center gap-2">
                <Button variant="primary" onClick={onBulkChange}>
                  Bulk change
                </Button>
                <Button onClick={clearSelection}>Clear</Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-[var(--ink-500)]">
                <span className="font-semibold text-[var(--ink-900)]">All active</span> · {activeCount}
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search"
                  className="h-9 w-72 border border-[var(--border)] bg-white rounded-full px-4 text-sm"
                />
                <div className="relative">
                  <Button variant="ghost" title="Columns" onClick={() => setColumnsOpen((v) => !v)}>
                    <span className="inline-flex items-center gap-2">
                      <IconColumns />
                    </span>
                  </Button>
                  {columnsOpen ? (
                    <>
                      <button
                        type="button"
                        className="fixed inset-0 z-40 cursor-default"
                        onClick={() => setColumnsOpen(false)}
                        aria-label="Close columns"
                      />
                      <div className="absolute right-0 top-10 z-50 w-56 rounded-xl border border-[var(--border)] bg-white shadow-[0_16px_40px_rgba(32,12,26,0.16)] p-2">
                        <div className="px-2 py-1 text-xs text-[var(--ink-500)]">Show columns</div>
                        {COLUMN_DEFS.map((c) => (
                          <label key={c.key} className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-[var(--cream-100)] text-sm">
                            <input type="checkbox" checked={visibleColumns[c.key]} onChange={() => toggleColumn(c.key)} />
                            {c.label}
                          </label>
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>
                <Button variant="ghost" title="Expand">
                  <IconExpand />
                </Button>
                <Button variant="ghost" title="Filters">
                  <IconFilter />
                </Button>
                <Button variant="ghost" title="Export">
                  <IconExport />
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full text-[13px]">
            <thead className="sticky top-0 z-10 bg-[var(--cream-100)] text-[var(--ink-500)] border-b border-[var(--border)]">
              <tr>
                <th className="px-3 py-2 w-10">
                  <IndeterminateCheckbox
                    checked={allVisibleSelected}
                    indeterminate={someVisibleSelected}
                    onChange={toggleSelectAllVisible}
                    ariaLabel="Select all visible"
                  />
                </th>
                <th className="text-left font-medium px-3 py-2">People</th>
                {visibleDefs.map((c) => (
                  <th key={c.key} className={`text-left font-medium px-3 py-2 ${c.widthClass}`}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => {
                const selected = selectedSet.has(emp.id);
                const managerName = emp.managerId ? managerMap.get(emp.managerId) : null;
                return (
                  <tr
                    key={emp.id}
                    className={
                      selected
                        ? "bg-[var(--plum-100)] border-b border-[var(--border)]"
                        : "border-b border-[var(--border)] hover:bg-[var(--cream-100)]"
                    }
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleRow(emp.id)}
                        aria-label={`Select ${emp.fullName}`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="w-8 h-8 rounded-full bg-[var(--plum-100)] text-[var(--plum-700)] text-xs font-semibold border border-[var(--plum-200)]"
                          onClick={() => onOpenProfile(emp.id)}
                          title="Open profile"
                        >
                          {emp.fullName.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                        </button>
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{emp.fullName}</div>
                          <div className="text-xs text-[var(--ink-500)] truncate">
                            {emp.title}, {emp.department}
                          </div>
                        </div>
                      </div>
                    </td>

                    {visibleColumns.status ? (
                      <td className="px-3 py-2">
                        <Badge tone={emp.status === "Active" ? "green" : emp.status === "Invited" ? "purple" : "amber"}>
                          {emp.status}
                        </Badge>
                      </td>
                    ) : null}
                    {visibleColumns.startDate ? <td className="px-3 py-2 text-[var(--ink-700)]">{emp.startDate}</td> : null}
                    {visibleColumns.location ? <td className="px-3 py-2 text-[var(--ink-700)]">{emp.location}</td> : null}
                    {visibleColumns.department ? <td className="px-3 py-2 text-[var(--ink-700)]">{emp.department}</td> : null}
                    {visibleColumns.manager ? <td className="px-3 py-2 text-[var(--ink-700)]">{managerName ?? "—"}</td> : null}
                  </tr>
                );
              })}
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td className="px-3 py-10 text-sm text-[var(--ink-500)]" colSpan={2 + visibleDefs.length}>
                    No people found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

