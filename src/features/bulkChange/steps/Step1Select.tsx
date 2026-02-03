import { useMemo, useState } from "react";
import Button from "../../../components/Button";
import { Card, CardContent } from "../../../components/Card";
import type { Employee } from "../../people/people.data";
import { useBulkStore } from "../bulkChange.store";

export default function Step1Select({ employees, onNext }: { employees: Employee[]; onNext: () => void }) {
  const { draft, setSelected } = useBulkStore();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return employees;
    return employees.filter(e => (e.name ?? e.fullName).toLowerCase().includes(s) || e.email.toLowerCase().includes(s));
  }, [employees, q]);

  const selected = new Set(draft.selectedEmployeeIds);

  function toggle(id: string) {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(Array.from(next));
  }

  function selectAllOnPage() {
    const next = new Set(selected);
    filtered.slice(0, 25).forEach(e => next.add(e.id));
    setSelected(Array.from(next));
  }

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold">Select employees</div>
          <div className="flex items-center gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search employees"
              className="h-9 w-72 border border-zinc-200 rounded-md px-3 text-sm"
            />
            <Button onClick={selectAllOnPage}>Select all on page</Button>
            <Button variant="primary" disabled={draft.selectedEmployeeIds.length === 0} onClick={onNext}>
              Create bulk change ({draft.selectedEmployeeIds.length})
            </Button>
          </div>
        </div>

        <div className="overflow-auto border border-zinc-200 rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-zinc-600 border-b border-zinc-200">
              <tr>
                <th className="p-2 text-left w-10"></th>
                <th className="p-2 text-left">Employee</th>
                <th className="p-2 text-left">Department</th>
                <th className="p-2 text-left">Location</th>
                <th className="p-2 text-left">Manager</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 25).map(e => (
                <tr key={e.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                  <td className="p-2">
                    <input type="checkbox" checked={selected.has(e.id)} onChange={() => toggle(e.id)} />
                  </td>
                  <td className="p-2">
                    <div className="font-medium">{e.name ?? e.fullName}</div>
                    <div className="text-xs text-zinc-500">{e.email}</div>
                  </td>
                  <td className="p-2">{e.department}</td>
                  <td className="p-2">{e.workLocation ?? e.location}</td>
                  <td className="p-2">{e.managerId ? "Manager" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-sm text-zinc-600">
          Selected: <span className="font-semibold text-zinc-900">{draft.selectedEmployeeIds.length}</span>
        </div>
      </CardContent>
    </Card>
  );
}
