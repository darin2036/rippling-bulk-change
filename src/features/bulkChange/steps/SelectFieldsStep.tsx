export type BulkFieldSelection = {
  department: boolean;
  manager: boolean;
  location: boolean;
  title: boolean;
  employmentType: boolean;
  workSchedule: boolean;
  startDate: boolean;
  terminationDate: boolean;
  costCenter: boolean;
  division: boolean;
  businessUnit: boolean;
  teamMemberships: boolean;
  matrixManager: boolean;
};

type Props = {
  fields: BulkFieldSelection;
  onChange: (next: BulkFieldSelection) => void;
};

export default function SelectFieldsStep({ fields, onChange }: Props) {
  const toggle = (key: keyof BulkFieldSelection) => {
    onChange({ ...fields, [key]: !fields[key] });
  };

  return (
    <div className="space-y-3">
      <div className="text-sm text-[var(--ink-500)]">
        Select the fields you want to update for all selected people.
      </div>
      <div className="space-y-4">
        <div>
          <div className="text-xs text-[var(--ink-500)] uppercase tracking-wide">Employment details</div>
          <div className="grid sm:grid-cols-2 gap-3 mt-2">
            {[
              { key: "title", label: "Job title" },
              { key: "department", label: "Department" },
              { key: "manager", label: "Manager" },
              { key: "employmentType", label: "Employment type" },
              { key: "workSchedule", label: "Work schedule" },
              { key: "startDate", label: "Start date" },
              { key: "terminationDate", label: "Termination date" },
            ].map((field) => (
              <label
                key={field.key}
                className="flex items-center gap-3 border border-[var(--border)] rounded-xl px-4 py-3 bg-white"
              >
                <input
                  type="checkbox"
                  checked={fields[field.key as keyof BulkFieldSelection]}
                  onChange={() => toggle(field.key as keyof BulkFieldSelection)}
                />
                <span className="text-sm font-medium">{field.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs text-[var(--ink-500)] uppercase tracking-wide">Work attributes</div>
          <div className="grid sm:grid-cols-2 gap-3 mt-2">
            {[
              { key: "location", label: "Work location" },
              { key: "costCenter", label: "Cost center" },
              { key: "division", label: "Division" },
              { key: "businessUnit", label: "Business unit" },
              { key: "teamMemberships", label: "Team memberships" },
              { key: "matrixManager", label: "Matrix manager" },
            ].map((field) => (
              <label
                key={field.key}
                className="flex items-center gap-3 border border-[var(--border)] rounded-xl px-4 py-3 bg-white"
              >
                <input
                  type="checkbox"
                  checked={fields[field.key as keyof BulkFieldSelection]}
                  onChange={() => toggle(field.key as keyof BulkFieldSelection)}
                />
                <span className="text-sm font-medium">{field.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
