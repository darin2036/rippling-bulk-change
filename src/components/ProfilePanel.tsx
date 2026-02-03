import { useEffect, useMemo, useState } from "react";
import Button from "./Button";
import type { Employee } from "../features/people/people.data";

type Props = {
  employee: Employee;
  employees: Employee[];
  onClose: () => void;
  onSave: (next: Employee) => void;
};

const NAV_ITEMS = [
  "Role information",
  "Personal information",
  "Additional information",
  "Business partners",
  "Direct reports",
  "Apps",
  "Devices",
  "Two-Factor devices",
  "Authentication",
  "Custom fields",
  "App - required information",
];

export default function ProfilePanel({ employee, employees, onClose, onSave }: Props) {
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<Employee>({ ...employee });

  useEffect(() => {
    setDraft({ ...employee });
    setEditMode(false);
  }, [employee]);

  const managerOptions = useMemo(
    () => employees.map((e) => ({ id: e.id, name: e.fullName })),
    [employees]
  );

  const updateDraft = (patch: Partial<Employee>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const handleSave = () => {
    onSave({ ...employee, ...draft });
    setEditMode(false);
  };

  const displayName = draft.preferredName ? `${draft.fullName} (${draft.preferredName})` : draft.fullName;

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-auto">
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-[var(--ink-500)]">People ▸ {employee.fullName}&apos;s Profile</div>
          <button type="button" className="text-2xl text-[var(--ink-500)]" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="mt-4 border border-[var(--border)] rounded-2xl bg-white">
          <div className="p-4 flex items-center justify-between border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--plum-100)] flex items-center justify-center font-semibold text-[var(--plum-700)] overflow-hidden">
                {draft.profilePhoto ? (
                  <img src={draft.profilePhoto} alt={employee.fullName} className="w-full h-full object-cover" />
                ) : (
                  employee.fullName.split(" ").map((p) => p[0]).slice(0, 2).join("")
                )}
              </div>
              <div>
                <div className="font-semibold">{displayName}</div>
                <div className="text-xs text-[var(--ink-500)]">{employee.title}</div>
              </div>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">{employee.status}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm">Org chart</Button>
              <Button size="sm">View history</Button>
            </div>
          </div>

          <div className="p-4 border-b border-[var(--border)] grid grid-cols-6 gap-4 text-xs text-[var(--ink-500)]">
            <div>
              Employment type
              <div className="text-sm text-[var(--ink-900)] font-semibold">
                {employee.employmentType === "Full-time" ? "Salaried, full-time" : "Contractor"}
              </div>
            </div>
            <div>
              Department
              <div className="text-sm text-[var(--ink-900)] font-semibold">{employee.department}</div>
            </div>
            <div>
              Work location
              <div className="text-sm text-[var(--ink-900)] font-semibold">{employee.location}</div>
            </div>
            <div>
              Work email
              <div className="text-sm text-[var(--ink-900)] font-semibold">{employee.email}</div>
            </div>
            <div>
              Start date
              <div className="text-sm text-[var(--ink-900)] font-semibold">{employee.startDate}</div>
            </div>
            <div>
              Manager
              <div className="text-sm text-[var(--ink-900)] font-semibold">
                {employee.managerId ? managerOptions.find((m) => m.id === employee.managerId)?.name : "—"}
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-12 gap-6">
            <div className="col-span-3 text-sm">
              {NAV_ITEMS.map((item, idx) => (
                <div
                  key={item}
                  className={`py-2 ${idx === 0 ? "font-semibold text-[var(--ink-900)] border-l-2 border-[var(--plum-600)] pl-3" : "text-[var(--ink-500)] pl-3"}`}
                >
                  {item}
                </div>
              ))}
            </div>
            <div className="col-span-9 border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div className="font-semibold">Role information</div>
                <div className="flex items-center gap-2">
                  {editMode ? (
                    <>
                      <Button size="sm" onClick={() => setEditMode(false)}>
                        Cancel
                      </Button>
                      <Button size="sm" variant="primary" onClick={handleSave}>
                        Save
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" onClick={() => setEditMode(true)}>
                      Edit
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-6">
                <div>
                  <div className="text-xs text-[var(--ink-500)] uppercase tracking-wide">Employment details</div>
                  <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-xs text-[var(--ink-500)]">Job title</div>
                      {editMode ? (
                        <input className="mt-1 w-full border border-[var(--border)] rounded-lg px-2 py-1" value={draft.title} onChange={(e) => updateDraft({ title: e.target.value })} />
                      ) : (
                        <div className="mt-1">{draft.title}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-[var(--ink-500)]">Department</div>
                      {editMode ? (
                        <input className="mt-1 w-full border border-[var(--border)] rounded-lg px-2 py-1" value={draft.department} onChange={(e) => updateDraft({ department: e.target.value })} />
                      ) : (
                        <div className="mt-1">{draft.department}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-[var(--ink-500)]">Manager</div>
                      {editMode ? (
                        <select className="mt-1 w-full border border-[var(--border)] rounded-lg px-2 py-1" value={draft.managerId ?? ""} onChange={(e) => updateDraft({ managerId: e.target.value || null })}>
                          <option value="">—</option>
                          {managerOptions.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="mt-1">{draft.managerId ? managerOptions.find((m) => m.id === draft.managerId)?.name : "—"}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-[var(--ink-500)]">Employment type</div>
                      {editMode ? (
                        <select className="mt-1 w-full border border-[var(--border)] rounded-lg px-2 py-1" value={draft.employmentType} onChange={(e) => updateDraft({ employmentType: e.target.value as Employee["employmentType"] })}>
                          <option value="Full-time">Salaried, full-time</option>
                          <option value="Contractor">Contractor</option>
                        </select>
                      ) : (
                        <div className="mt-1">{draft.employmentType === "Full-time" ? "Salaried, full-time" : "Contractor"}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-[var(--ink-500)]">Work schedule</div>
                      {editMode ? (
                        <input className="mt-1 w-full border border-[var(--border)] rounded-lg px-2 py-1" value={draft.workSchedule ?? ""} onChange={(e) => updateDraft({ workSchedule: e.target.value })} />
                      ) : (
                        <div className="mt-1">{draft.workSchedule}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-[var(--ink-500)]">Start date</div>
                      {editMode ? (
                        <input className="mt-1 w-full border border-[var(--border)] rounded-lg px-2 py-1" value={draft.startDate} onChange={(e) => updateDraft({ startDate: e.target.value })} />
                      ) : (
                        <div className="mt-1">{draft.startDate}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-[var(--ink-500)]">Termination date</div>
                      {editMode ? (
                        <input className="mt-1 w-full border border-[var(--border)] rounded-lg px-2 py-1" value={draft.terminationDate ?? ""} onChange={(e) => updateDraft({ terminationDate: e.target.value })} />
                      ) : (
                        <div className="mt-1">{draft.terminationDate || "—"}</div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-[var(--ink-500)] uppercase tracking-wide">Work attributes</div>
                  <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-xs text-[var(--ink-500)]">Work location</div>
                      {editMode ? (
                        <input className="mt-1 w-full border border-[var(--border)] rounded-lg px-2 py-1" value={draft.location} onChange={(e) => updateDraft({ location: e.target.value })} />
                      ) : (
                        <div className="mt-1">{draft.location}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-[var(--ink-500)]">Timezone</div>
                      {editMode ? (
                        <input className="mt-1 w-full border border-[var(--border)] rounded-lg px-2 py-1" value={draft.timezone ?? ""} onChange={(e) => updateDraft({ timezone: e.target.value })} />
                      ) : (
                        <div className="mt-1">{draft.timezone}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-[var(--ink-500)]">Cost center</div>
                      {editMode ? (
                        <input className="mt-1 w-full border border-[var(--border)] rounded-lg px-2 py-1" value={draft.costCenter ?? ""} onChange={(e) => updateDraft({ costCenter: e.target.value })} />
                      ) : (
                        <div className="mt-1">{draft.costCenter}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-[var(--ink-500)]">Division</div>
                      {editMode ? (
                        <input className="mt-1 w-full border border-[var(--border)] rounded-lg px-2 py-1" value={draft.division ?? ""} onChange={(e) => updateDraft({ division: e.target.value })} />
                      ) : (
                        <div className="mt-1">{draft.division}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-[var(--ink-500)]">Business unit</div>
                      {editMode ? (
                        <input className="mt-1 w-full border border-[var(--border)] rounded-lg px-2 py-1" value={draft.businessUnit ?? ""} onChange={(e) => updateDraft({ businessUnit: e.target.value })} />
                      ) : (
                        <div className="mt-1">{draft.businessUnit}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-[var(--ink-500)]">Team memberships</div>
                      {editMode ? (
                        <input className="mt-1 w-full border border-[var(--border)] rounded-lg px-2 py-1" value={draft.teamMemberships ?? ""} onChange={(e) => updateDraft({ teamMemberships: e.target.value })} />
                      ) : (
                        <div className="mt-1">{draft.teamMemberships}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-[var(--ink-500)]">Matrix manager</div>
                      {editMode ? (
                        <select className="mt-1 w-full border border-[var(--border)] rounded-lg px-2 py-1" value={draft.matrixManagerId ?? ""} onChange={(e) => updateDraft({ matrixManagerId: e.target.value || null })}>
                          <option value="">—</option>
                          {managerOptions.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="mt-1">{draft.matrixManagerId ? managerOptions.find((m) => m.id === draft.matrixManagerId)?.name : "—"}</div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-[var(--ink-500)] uppercase tracking-wide">Personal information</div>
                  <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-xs text-[var(--ink-500)]">Profile photo</div>
                      {editMode ? (
                        <input className="mt-1 w-full border border-[var(--border)] rounded-lg px-2 py-1" value={draft.profilePhoto ?? ""} onChange={(e) => updateDraft({ profilePhoto: e.target.value })} placeholder="https://..." />
                      ) : (
                        <div className="mt-1">{draft.profilePhoto ? "Uploaded" : "—"}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-[var(--ink-500)]">Full legal name</div>
                      {editMode ? (
                        <input className="mt-1 w-full border border-[var(--border)] rounded-lg px-2 py-1" value={draft.fullName} onChange={(e) => updateDraft({ fullName: e.target.value })} />
                      ) : (
                        <div className="mt-1">{draft.fullName}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-[var(--ink-500)]">Preferred name</div>
                      {editMode ? (
                        <input className="mt-1 w-full border border-[var(--border)] rounded-lg px-2 py-1" value={draft.preferredName ?? ""} onChange={(e) => updateDraft({ preferredName: e.target.value })} />
                      ) : (
                        <div className="mt-1">{draft.preferredName || "—"}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-[var(--ink-500)]">Date of birth</div>
                      {editMode ? (
                        <input className="mt-1 w-full border border-[var(--border)] rounded-lg px-2 py-1" value={draft.dateOfBirth ?? ""} onChange={(e) => updateDraft({ dateOfBirth: e.target.value })} />
                      ) : (
                        <div className="mt-1">{draft.dateOfBirth || "—"}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-[var(--ink-500)]">Gender</div>
                      {editMode ? (
                        <input className="mt-1 w-full border border-[var(--border)] rounded-lg px-2 py-1" value={draft.gender ?? ""} onChange={(e) => updateDraft({ gender: e.target.value })} />
                      ) : (
                        <div className="mt-1">{draft.gender || "—"}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-[var(--ink-500)]">Home address</div>
                      {editMode ? (
                        <input className="mt-1 w-full border border-[var(--border)] rounded-lg px-2 py-1" value={draft.homeAddress ?? ""} onChange={(e) => updateDraft({ homeAddress: e.target.value })} />
                      ) : (
                        <div className="mt-1">{draft.homeAddress || "—"}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-[var(--ink-500)]">Phone number</div>
                      {editMode ? (
                        <input className="mt-1 w-full border border-[var(--border)] rounded-lg px-2 py-1" value={draft.phone ?? ""} onChange={(e) => updateDraft({ phone: e.target.value })} />
                      ) : (
                        <div className="mt-1">{draft.phone || "—"}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-[var(--ink-500)]">Personal email</div>
                      {editMode ? (
                        <input className="mt-1 w-full border border-[var(--border)] rounded-lg px-2 py-1" value={draft.personalEmail ?? ""} onChange={(e) => updateDraft({ personalEmail: e.target.value })} />
                      ) : (
                        <div className="mt-1">{draft.personalEmail || "—"}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-[var(--ink-500)]">Emergency contact</div>
                      {editMode ? (
                        <input className="mt-1 w-full border border-[var(--border)] rounded-lg px-2 py-1" value={draft.emergencyContactName ?? ""} onChange={(e) => updateDraft({ emergencyContactName: e.target.value })} />
                      ) : (
                        <div className="mt-1">{draft.emergencyContactName || "—"}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-[var(--ink-500)]">Emergency phone</div>
                      {editMode ? (
                        <input className="mt-1 w-full border border-[var(--border)] rounded-lg px-2 py-1" value={draft.emergencyContactPhone ?? ""} onChange={(e) => updateDraft({ emergencyContactPhone: e.target.value })} />
                      ) : (
                        <div className="mt-1">{draft.emergencyContactPhone || "—"}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
