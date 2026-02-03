import { useMemo, useRef, useState } from "react";
import Button from "../../components/Button";
import { Card, CardContent } from "../../components/Card";
import ProfilePanel from "../../components/ProfilePanel";
import { getEmployees, updateEmployees } from "./people.data";
import type { Employee } from "./people.data";

type OrgNode = {
  id: string;
  name: string;
  title: string;
  department: string;
  location: string;
  managerId: string | null;
  reportCount: number;
  directReports: OrgNode[];
};

function buildTree(employees: Employee[]) {
  const byId = new Map<string, OrgNode>();
  employees.forEach((e) => {
    byId.set(e.id, {
      id: e.id,
      name: e.fullName,
      title: e.title,
      department: e.department,
      location: e.location,
      managerId: e.managerId ?? null,
      reportCount: 0,
      directReports: [],
    });
  });

  byId.forEach((node) => {
    if (node.managerId && byId.has(node.managerId)) {
      byId.get(node.managerId)!.directReports.push(node);
    }
  });

  byId.forEach((node) => {
    node.reportCount = node.directReports.length;
  });

  const roots = Array.from(byId.values()).filter((n) => !n.managerId);
  const topLeader = roots[0] ?? null;
  return { employees, topLeader };
}

function OrgCard({ node, onClick }: { node: OrgNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-white border border-[var(--border)] rounded-xl shadow-[var(--shadow)] p-4 w-72 text-left hover:shadow-[0_14px_30px_rgba(52,16,38,0.12)] transition"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-[var(--plum-100)] flex items-center justify-center text-sm font-semibold text-[var(--plum-700)]">
          {node.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
        </div>
        <div>
          <div className="font-semibold">{node.name}</div>
          <div className="text-sm text-[var(--ink-500)]">{node.title}</div>
          <div className="text-xs text-[var(--ink-500)] mt-1">{node.location}</div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-[var(--ink-500)]">
        <span className="px-2 py-0.5 rounded-full bg-[var(--plum-100)] text-[var(--plum-700)]">
          {node.department}
        </span>
        <span className="flex items-center gap-1">
          👥 {node.reportCount}
        </span>
      </div>
    </button>
  );
}

function OrgBranch({ node, onSelect }: { node: OrgNode; onSelect: (id: string) => void }) {
  return (
    <div className="flex flex-col items-center">
      <OrgCard node={node} onClick={() => onSelect(node.id)} />
      {node.directReports.length > 0 ? (
        <div className="flex flex-col items-center">
          <div className="w-px h-8 bg-[var(--border)]" />
          <div className="flex gap-8">
            {node.directReports.map((child) => (
              <div key={child.id} className="flex flex-col items-center">
                <div className="w-px h-6 bg-[var(--border)]" />
                <OrgBranch node={child} onSelect={onSelect} />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function PeopleDetailsGridPage() {
  const [employees, setEmployees] = useState<Employee[]>(() => getEmployees());
  const { topLeader } = useMemo(() => buildTree(employees), [employees]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const dragRef = useRef<{ active: boolean; x: number; y: number }>({ active: false, x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedEmployee = selectedId ? employees.find((e) => e.id === selectedId) ?? null : null;

  const openProfile = (id: string) => {
    setSelectedId(id);
  };

  const closeProfile = () => {
    setSelectedId(null);
  };

  const handleSaveProfile = (nextEmployee: Employee) => {
    const next = employees.map((emp) => (emp.id === nextEmployee.id ? { ...emp, ...nextEmployee } : emp));
    setEmployees(next);
    updateEmployees(next);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = { active: true, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    const deltaX = event.clientX - dragRef.current.x;
    const deltaY = event.clientY - dragRef.current.y;
    dragRef.current = { active: true, x: event.clientX, y: event.clientY };
    setTransform((prev) => ({ ...prev, x: prev.x + deltaX, y: prev.y + deltaY }));
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current.active = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const zoom = (delta: number) => {
    setTransform((prev) => ({
      ...prev,
      scale: Math.min(1.6, Math.max(0.6, Number((prev.scale + delta).toFixed(2)))),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-[var(--ink-500)]">Org Chart</div>
          <h1 className="text-2xl font-semibold mt-1">Org Chart</h1>
        </div>
        <div className="text-sm text-[var(--ink-500)]">Last update: 02/02/2026 03:31 PM</div>
      </div>

      <div className="border-b border-[var(--border)] pb-2">
        <div className="flex items-center gap-6 text-sm text-[var(--ink-500)]">
          <div className="font-semibold text-[var(--plum-700)] border-b-2 border-[var(--plum-600)] pb-2">Org Diagram</div>
          <div className="pb-2">Org Chart</div>
          <div className="pb-2">Settings</div>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="border border-[var(--border)] bg-white rounded-full px-4 py-2 text-sm text-[var(--ink-500)] w-72 flex items-center gap-2">
                <span className="text-[var(--ink-500)]">🔎</span>
                Search people
              </div>
              <Button size="sm">Filters</Button>
            </div>
            <div className="flex items-center gap-2 text-sm text-[var(--ink-500)]">
              Visualize by
              <select className="border border-[var(--border)] bg-white rounded-md px-3 py-2 text-sm">
                <option>Departments</option>
                <option>Location</option>
                <option>Team</option>
              </select>
            </div>
          </div>

          <div className="bg-[#fbf9fb] border border-[var(--border)] rounded-2xl p-6 min-h-[520px] relative">
            <div
              ref={containerRef}
              className="h-[520px] overflow-hidden cursor-grab active:cursor-grabbing"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              <div
                className="flex flex-col items-center gap-8 origin-top"
                style={{
                  transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                }}
              >
                <div className="bg-white border border-[var(--border)] rounded-xl px-6 py-4 w-72 text-sm shadow-[var(--shadow)]">
                  <div className="font-semibold flex items-center gap-2">
                    <span className="text-lg">🏢</span>
                    Opus Guard Inc.
                  </div>
                  <div className="text-xs text-[var(--ink-500)] mt-2 flex items-center gap-2">
                    👥 {topLeader ? topLeader.reportCount + 1 : 0}
                    <span>•</span>
                    👤 {topLeader ? topLeader.reportCount : 0}
                  </div>
                </div>

                {topLeader ? (
                  <div className="flex flex-col items-center">
                    <div className="w-px h-8 bg-[var(--border)]" />
                    <OrgBranch node={topLeader} onSelect={openProfile} />
                  </div>
                ) : (
                  <div className="text-sm text-[var(--ink-500)]">No org data available.</div>
                )}
              </div>
            </div>

            <div className="absolute right-4 top-4 flex flex-col gap-2">
              <button
                type="button"
                className="w-9 h-9 rounded-md border border-[var(--border)] bg-white text-sm"
                onClick={() => zoom(0.1)}
              >
                +
              </button>
              <button
                type="button"
                className="w-9 h-9 rounded-md border border-[var(--border)] bg-white text-sm"
                onClick={() => zoom(-0.1)}
              >
                −
              </button>
              <button
                type="button"
                className="w-9 h-9 rounded-md border border-[var(--border)] bg-white text-xs"
                onClick={() => setTransform({ x: 0, y: 0, scale: 1 })}
              >
                Reset
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedEmployee ? (
        <ProfilePanel
          employee={selectedEmployee}
          employees={employees}
          onClose={closeProfile}
          onSave={handleSaveProfile}
        />
      ) : null}
    </div>
  );
}
