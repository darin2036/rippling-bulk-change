import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import { Card, CardContent } from "../../components/Card";
import ProfilePanel from "../../components/ProfilePanel";
import type { Employee } from "./people.data";
import { getEmployees, updateEmployees } from "./people.data";
import { saveSelectedIds } from "../bulkChange/bulkChange.state";
import PeopleAdminGrid from "./components/PeopleAdminGrid";

export default function PeoplePage() {
  const nav = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>(() => getEmployees());
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [profileId, setProfileId] = useState<string | null>(null);

  const handleBulkChange = () => {
    saveSelectedIds(selectedIds);
    nav("/bulk-change/new");
  };

  const selectedProfile = profileId ? employees.find((e) => e.id === profileId) ?? null : null;
  const closeProfile = () => setProfileId(null);
  const handleSaveProfile = (next: Employee) => {
    const updated = employees.map((emp) => (emp.id === next.id ? { ...emp, ...next } : emp));
    setEmployees(updated);
    updateEmployees(updated);
  };

  return (
    <div className="space-y-6">
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
            disabled={selectedIds.length === 0}
            onClick={handleBulkChange}
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
        <div />
      </div>
      <div className="h-px bg-[var(--border)]" />

      <PeopleAdminGrid
        employees={employees}
        selectedIds={selectedIds}
        onChangeSelectedIds={setSelectedIds}
        onBulkChange={handleBulkChange}
        onOpenProfile={setProfileId}
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
      {selectedProfile ? (
        <ProfilePanel
          employee={selectedProfile}
          employees={employees}
          onClose={closeProfile}
          onSave={handleSaveProfile}
        />
      ) : null}
    </div>
  );
}
