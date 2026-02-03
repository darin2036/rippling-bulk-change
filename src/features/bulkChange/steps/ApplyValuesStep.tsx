import type { BulkFieldSelection } from "./SelectFieldsStep";

export type BulkFieldValues = {
  department: string;
  managerId: string;
  location: string;
  title: string;
  employmentType: string;
  workSchedule: string;
  startDate: string;
  terminationDate: string;
  costCenter: string;
  division: string;
  businessUnit: string;
  teamMemberships: string;
  matrixManagerId: string;
};

export type ScheduleConfig = {
  mode: "now" | "scheduled";
  date: string;
  time: string;
};

type Props = {
  fields: BulkFieldSelection;
  values: BulkFieldValues;
  onChange: (next: BulkFieldValues) => void;
  schedule: ScheduleConfig;
  onScheduleChange: (next: ScheduleConfig) => void;
  departments: string[];
  managers: { id: string; name: string }[];
  locations: string[];
  titles: string[];
};

export default function ApplyValuesStep({
  fields,
  values,
  onChange,
  schedule,
  onScheduleChange,
  departments,
  managers,
  locations,
  titles,
}: Props) {
  const update = (key: keyof BulkFieldValues, value: string) => {
    onChange({ ...values, [key]: value });
  };

  const updateSchedule = (patch: Partial<ScheduleConfig>) => {
    onScheduleChange({ ...schedule, ...patch });
  };

  const timeOptions = Array.from({ length: 12 }).flatMap((_, i) => {
    const hour = i + 8;
    return [`${hour.toString().padStart(2, "0")}:00`, `${hour.toString().padStart(2, "0")}:30`];
  });

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-4 space-y-3">
        <div className="text-sm font-semibold">Schedule changes</div>
        <div className="text-sm text-[var(--ink-500)]">
          Apply updates immediately or schedule a future time.
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="schedule-mode"
              checked={schedule.mode === "now"}
              onChange={() => updateSchedule({ mode: "now" })}
            />
            Apply immediately
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="schedule-mode"
              checked={schedule.mode === "scheduled"}
              onChange={() => updateSchedule({ mode: "scheduled" })}
            />
            Schedule for later
          </label>
        </div>
        {schedule.mode === "scheduled" ? (
          <div className="space-y-2">
            <div className="text-xs text-[var(--ink-500)]">Date</div>
            <input
              type="date"
              className="w-full border border-[var(--border)] rounded-xl px-3 py-2 bg-white text-sm"
              value={schedule.date}
              onChange={(e) => updateSchedule({ date: e.target.value })}
            />
            <div className="text-xs text-[var(--ink-500)]">Time</div>
            <select
              className="w-full border border-[var(--border)] rounded-xl px-3 py-2 bg-white text-sm"
              value={schedule.time}
              onChange={(e) => updateSchedule({ time: e.target.value })}
            >
              <option value="">Select time</option>
              {timeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <div className="text-xs text-[var(--ink-500)]">Local time</div>
          </div>
        ) : null}
      </div>

      <div className="col-span-8 space-y-4">
        <div className="text-sm text-[var(--ink-500)]">
          Apply a single value to all selected people.
        </div>

        {fields.employmentType ? (
          <div className="space-y-2">
            <div className="text-sm font-semibold">Employment type</div>
            <select
              className="w-full border border-[var(--border)] rounded-xl px-3 py-2 bg-white text-sm"
              value={values.employmentType}
              onChange={(e) => update("employmentType", e.target.value)}
            >
              <option value="">Select employment type</option>
              <option value="Full-time">Full-time</option>
              <option value="Contractor">Contractor</option>
            </select>
          </div>
        ) : null}

        {fields.workSchedule ? (
          <div className="space-y-2">
            <div className="text-sm font-semibold">Work schedule</div>
            <input
              className="w-full border border-[var(--border)] rounded-xl px-3 py-2 bg-white text-sm"
              value={values.workSchedule}
              onChange={(e) => update("workSchedule", e.target.value)}
              placeholder="Mon–Fri, 9am–5pm"
            />
          </div>
        ) : null}

        {fields.startDate ? (
          <div className="space-y-2">
            <div className="text-sm font-semibold">Start date</div>
            <input
              className="w-full border border-[var(--border)] rounded-xl px-3 py-2 bg-white text-sm"
              value={values.startDate}
              onChange={(e) => update("startDate", e.target.value)}
              placeholder="MM/DD/YYYY"
            />
          </div>
        ) : null}

        {fields.terminationDate ? (
          <div className="space-y-2">
            <div className="text-sm font-semibold">Termination date</div>
            <input
              className="w-full border border-[var(--border)] rounded-xl px-3 py-2 bg-white text-sm"
              value={values.terminationDate}
              onChange={(e) => update("terminationDate", e.target.value)}
              placeholder="MM/DD/YYYY"
            />
          </div>
        ) : null}

        {fields.department ? (
          <div className="space-y-2">
            <div className="text-sm font-semibold">Department</div>
            <select
              className="w-full border border-[var(--border)] rounded-xl px-3 py-2 bg-white text-sm"
              value={values.department}
              onChange={(e) => update("department", e.target.value)}
            >
              <option value="">Select department</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {fields.manager ? (
          <div className="space-y-2">
            <div className="text-sm font-semibold">Manager</div>
            <select
              className="w-full border border-[var(--border)] rounded-xl px-3 py-2 bg-white text-sm"
              value={values.managerId}
              onChange={(e) => update("managerId", e.target.value)}
            >
              <option value="">Select manager</option>
              {managers.map((mgr) => (
                <option key={mgr.id} value={mgr.id}>
                  {mgr.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {fields.location ? (
          <div className="space-y-2">
            <div className="text-sm font-semibold">Location</div>
            <select
              className="w-full border border-[var(--border)] rounded-xl px-3 py-2 bg-white text-sm"
              value={values.location}
              onChange={(e) => update("location", e.target.value)}
            >
              <option value="">Select location</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {fields.title ? (
          <div className="space-y-2">
            <div className="text-sm font-semibold">Title</div>
            <select
              className="w-full border border-[var(--border)] rounded-xl px-3 py-2 bg-white text-sm"
              value={values.title}
              onChange={(e) => update("title", e.target.value)}
            >
              <option value="">Select title</option>
              {titles.map((title) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {fields.costCenter ? (
          <div className="space-y-2">
            <div className="text-sm font-semibold">Cost center</div>
            <input
              className="w-full border border-[var(--border)] rounded-xl px-3 py-2 bg-white text-sm"
              value={values.costCenter}
              onChange={(e) => update("costCenter", e.target.value)}
              placeholder="CC-1001"
            />
          </div>
        ) : null}

        {fields.division ? (
          <div className="space-y-2">
            <div className="text-sm font-semibold">Division</div>
            <input
              className="w-full border border-[var(--border)] rounded-xl px-3 py-2 bg-white text-sm"
              value={values.division}
              onChange={(e) => update("division", e.target.value)}
              placeholder="Corporate"
            />
          </div>
        ) : null}

        {fields.businessUnit ? (
          <div className="space-y-2">
            <div className="text-sm font-semibold">Business unit</div>
            <input
              className="w-full border border-[var(--border)] rounded-xl px-3 py-2 bg-white text-sm"
              value={values.businessUnit}
              onChange={(e) => update("businessUnit", e.target.value)}
              placeholder="People Ops"
            />
          </div>
        ) : null}

        {fields.teamMemberships ? (
          <div className="space-y-2">
            <div className="text-sm font-semibold">Team memberships</div>
            <input
              className="w-full border border-[var(--border)] rounded-xl px-3 py-2 bg-white text-sm"
              value={values.teamMemberships}
              onChange={(e) => update("teamMemberships", e.target.value)}
              placeholder="Platform, Security"
            />
          </div>
        ) : null}

        {fields.matrixManager ? (
          <div className="space-y-2">
            <div className="text-sm font-semibold">Matrix manager</div>
            <select
              className="w-full border border-[var(--border)] rounded-xl px-3 py-2 bg-white text-sm"
              value={values.matrixManagerId}
              onChange={(e) => update("matrixManagerId", e.target.value)}
            >
              <option value="">Select manager</option>
              {managers.map((mgr) => (
                <option key={mgr.id} value={mgr.id}>
                  {mgr.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>
    </div>
  );
}
