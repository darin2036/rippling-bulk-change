import type { Employee } from "../../people/people.data";

type Props = {
  employees: Employee[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

export default function Step1SelectPeople({ employees, selectedIds, onChange }: Props) {
  const selectedSet = new Set(selectedIds);
  const allSelected = employees.length > 0 && selectedIds.length === employees.length;

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
      onChange(employees.map((e) => e.id));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-[var(--ink-500)]">
        <div>
          Selected people: <span className="font-semibold text-[var(--ink-900)]">{selectedIds.length}</span>
        </div>
        <button
          type="button"
          className="text-sm text-[var(--plum-700)] underline"
          onClick={toggleAll}
        >
          {allSelected ? "Clear selection" : "Select all"}
        </button>
      </div>

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
            {employees.map((emp) => (
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
