import { useMemo } from "react";
import Drawer from "../Drawer";
import Badge from "../Badge";
import { getEmployees } from "../../features/people/people.data";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((p) => p[0]!.toUpperCase()).join("") || "?";
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-2 gap-4 py-2 border-b border-[var(--border)] last:border-b-0">
      <div className="text-xs uppercase tracking-wide text-[var(--ink-500)]">{label}</div>
      <div className="text-sm text-[var(--ink-900)]">{value || "—"}</div>
    </div>
  );
}

export default function ProfileDrawer({
  open,
  employeeId,
  onClose,
}: {
  open: boolean;
  employeeId: string | null;
  onClose: () => void;
}) {
  const employees = useMemo(() => getEmployees(), [open, employeeId]);
  const byId = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);

  const employee = employeeId ? byId.get(employeeId) ?? null : null;
  const name = employee ? (employee.name ?? employee.fullName) : "";
  const managerName =
    employee?.managerId ? (byId.get(employee.managerId)?.name ?? byId.get(employee.managerId)?.fullName ?? "—") : "—";

  const workLocation = employee ? (employee.workLocation ?? employee.location) : "";

  return (
    <Drawer open={open} title={employee ? "Profile" : "Profile"} onClose={onClose}>
      <div className="p-5 space-y-4">
        {employee ? (
          <>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[var(--plum-100)] border border-[var(--plum-200)] text-[var(--plum-700)] flex items-center justify-center font-semibold">
                {initials(name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="text-lg font-semibold truncate">{name}</div>
                  <Badge tone={employee.status === "Active" ? "green" : employee.status === "Invited" ? "purple" : "amber"}>
                    {employee.status}
                  </Badge>
                </div>
                <div className="text-sm text-[var(--ink-500)] truncate mt-1">{employee.email}</div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-white overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--cream-100)]">
                <div className="text-sm font-semibold">Details</div>
              </div>
              <div className="px-4">
                <Field label="Title" value={employee.title || "—"} />
                <Field label="Department" value={employee.department || "—"} />
                <Field label="Team" value={employee.team || "—"} />
                <Field label="Manager" value={managerName} />
                <Field label="Work location" value={workLocation || "—"} />
                <Field label="Start date" value={employee.startDate || "—"} />
              </div>
            </div>
          </>
        ) : (
          <div className="text-sm text-[var(--ink-500)]">Select an employee to view their profile.</div>
        )}
      </div>
    </Drawer>
  );
}

