import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import { Card, CardContent } from "../../components/Card";
import type { Employee } from "./people.data";
import { getEmployees } from "./people.data";
import { clearSelectedIds, saveSelectedIds } from "../bulkChange/bulkChange.state";
import PeopleAdminGrid from "./components/PeopleAdminGrid";
import StartBulkChangeModal from "../bulkChange/StartBulkChangeModal";
import { useBulkStore } from "../bulkChange/bulkChange.store";
import { useFilterStore } from "./filters/filter.store";
import { applyEmployeeFilters, buildFilterChips, removeFilterChip } from "./filters/filter.engine";
import ScheduledUpdatesBanner from "../../components/ScheduledUpdatesBanner";

export default function PeoplePage() {
  const nav = useNavigate();
  const employees = useMemo<Employee[]>(() => getEmployees(), []);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [startBulkOpen, setStartBulkOpen] = useState(false);
  const resetBulkDraft = useBulkStore((s) => s.resetDraft);
  const { filterState, openFilters, setFilterState } = useFilterStore();

  const openBulkStart = () => setStartBulkOpen(true);
  const closeBulkStart = () => setStartBulkOpen(false);

  const filteredEmployees = useMemo(() => applyEmployeeFilters(employees, filterState), [employees, filterState]);
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

  return (
    <div className="space-y-6">
      <ScheduledUpdatesBanner />
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Hello, Darin</h1>
          <div className="text-sm text-[var(--ink-500)] mt-1">Welcome back to People Hub</div>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" onClick={() => nav("/people/add")}>Add people</Button>
          <Button onClick={() => nav("/people/remove")}>Remove people</Button>
          <Button
            variant="primary"
            onClick={openBulkStart}
          >
            Bulk change
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0 grid md:grid-cols-[1.4fr_1fr]">
          <div className="p-6 space-y-4">
            <div className="text-sm text-[var(--ink-500)]">Introducing Bulk Updates</div>
            <div className="text-lg font-semibold">Bulk Updates lets you update employee records across your workforce in a single action. Change titles, compensation, managers, departments, locations, and more without editing employees one by one.</div>
            <div className="text-sm text-[var(--ink-500)]">Every update respects permissions and is logged automatically.</div>
            <div className="flex gap-2">
              <Button className="bg-white">Try it now</Button>
              <Button variant="primary">See how it works</Button>
            </div>
          </div>
          <div className="bg-[linear-gradient(120deg,#4a1539,#6e2a50)] p-6 flex items-center justify-center">
            <div className="grid grid-cols-2 gap-4">
              <div className="w-24 h-20 bg-[#f5b12f] rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.2)] rotate-[-6deg]" />
              <div className="w-24 h-20 bg-[#f0c15e] rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.2)] rotate-[4deg]" />
              <div className="w-24 h-20 bg-[#f8d28f] rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.2)] -rotate-2" />
              <div className="w-24 h-20 bg-[#f7a93a] rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.2)] rotate-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between">
          <div className="text-sm font-semibold">Your Tasks</div>
          <div className="text-sm text-emerald-700 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">✓</span>
            All tasks completed, nice work!
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">People</h2>
        <Button onClick={openFilters}>Filters</Button>
      </div>
      <div className="h-px bg-[var(--border)]" />

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

      <PeopleAdminGrid
        employees={filteredEmployees}
        selectedIds={selectedIds}
        onChangeSelectedIds={setSelectedIds}
        onBulkChange={openBulkStart}
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Add New App", glyph: "+" },
          { label: "Devices", glyph: "⌂" },
          { label: "Workflow Studio", glyph: "⚡" },
          { label: "Approvals", glyph: "◎" },
          { label: "Data Manager", glyph: "▣" },
          { label: "Activity Log", glyph: "◴" },
          { label: "Security", glyph: "🔒" },
          { label: "More", glyph: "⋯" },
        ].map((app) => (
          <div key={app.label} className="bg-white border border-[var(--border)] rounded-2xl p-4 text-center shadow-[var(--shadow)]">
            <div className="w-16 h-16 rounded-2xl bg-[var(--plum-600)] text-white flex items-center justify-center text-2xl mx-auto">
              {app.glyph}
            </div>
            <div className="mt-3 text-sm font-semibold">{app.label}</div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-2xl font-semibold">Integrations</h2>
        <div className="mt-2 h-px bg-[var(--border)]" />
        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white border border-[var(--border)] rounded-2xl p-5 shadow-[var(--shadow)]">
            <div className="w-14 h-14 rounded-2xl bg-[var(--plum-600)] text-white flex items-center justify-center text-2xl">
              +
            </div>
            <div className="mt-3 font-semibold text-sm">Add New App</div>
          </div>
          <div className="bg-white border border-[var(--border)] rounded-2xl p-5 shadow-[var(--shadow)]">
            <div className="w-14 h-14 rounded-2xl bg-white border border-[var(--border)] flex items-center justify-center text-lg font-semibold text-[#4285F4]">
              G
            </div>
            <div className="mt-3 font-semibold text-sm">Google Workspace</div>
          </div>
        </div>
      </div>
      {/* Profile drawer is global and mounted in the app shell. */}

      <StartBulkChangeModal
        open={startBulkOpen}
        onClose={closeBulkStart}
        onUseWizard={() => {
          resetBulkDraft();
          if (selectedIds.length > 0) saveSelectedIds(selectedIds);
          else clearSelectedIds();
          closeBulkStart();
          nav("/bulk-change/new");
        }}
        onImportCsv={() => {
          closeBulkStart();
          nav("/bulk-change/import-csv");
        }}
      />
    </div>
  );
}
