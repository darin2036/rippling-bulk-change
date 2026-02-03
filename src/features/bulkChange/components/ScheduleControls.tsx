import { useEffect, useMemo, useState } from "react";

type Props = {
  mode: "immediate" | "scheduled";
  effectiveAt: number | null | undefined;
  onChange: (mode: "immediate" | "scheduled", at?: number | null) => void;
  label?: string;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toLocalDateInput(ms: number) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toLocalTimeInput(ms: number) {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInputs(date: string, time: string) {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  if (!y || !m || !d || Number.isNaN(hh) || Number.isNaN(mm)) return null;
  const result = new Date(y, m - 1, d, hh, mm, 0, 0);
  return Number.isNaN(result.getTime()) ? null : result.getTime();
}

function roundToNextHalfHour(ms: number) {
  const d = new Date(ms);
  const minutes = d.getMinutes();
  const rounded = Math.ceil(minutes / 30) * 30;
  d.setMinutes(rounded, 0, 0);
  if (rounded === 60) d.setHours(d.getHours() + 1, 0, 0, 0);
  return d.getTime();
}

export default function ScheduleControls({ mode, effectiveAt, onChange, label = "Effective timing" }: Props) {
  const defaultMs = useMemo(() => roundToNextHalfHour(Date.now() + 30 * 60 * 1000), []);
  const initialMs = effectiveAt ?? defaultMs;
  const [date, setDate] = useState(() => toLocalDateInput(initialMs));
  const [time, setTime] = useState(() => toLocalTimeInput(initialMs));

  useEffect(() => {
    if (mode !== "scheduled") return;
    const ms = effectiveAt ?? defaultMs;
    const nextDate = toLocalDateInput(ms);
    const nextTime = toLocalTimeInput(ms);
    setDate(nextDate);
    setTime(nextTime);
    if (!effectiveAt) onChange("scheduled", ms);
  }, [mode, effectiveAt, defaultMs, onChange]);

  useEffect(() => {
    if (mode !== "scheduled") return;
    const ms = fromLocalInputs(date, time);
    if (ms) onChange("scheduled", ms);
  }, [date, time, mode, onChange]);

  const timeOptions = useMemo(() => {
    const options: string[] = [];
    for (let h = 0; h < 24; h++) {
      options.push(`${pad(h)}:00`);
      options.push(`${pad(h)}:30`);
    }
    return options;
  }, []);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-white p-4 space-y-3">
      <div className="text-sm font-semibold">{label}</div>
      <div className="flex items-center gap-4 flex-wrap">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="effective-mode"
            checked={mode === "immediate"}
            onChange={() => onChange("immediate", null)}
          />
          Apply immediately
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="effective-mode"
            checked={mode === "scheduled"}
            onChange={() => onChange("scheduled", effectiveAt ?? defaultMs)}
          />
          Schedule for later
        </label>
      </div>

      {mode === "scheduled" ? (
        <div className="grid sm:grid-cols-[200px_160px] gap-3">
          <label className="text-xs text-[var(--ink-500)]">
            Date
            <input
              type="date"
              className="mt-1 w-full border border-[var(--border)] rounded-lg bg-white px-2 py-2 text-sm"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label className="text-xs text-[var(--ink-500)]">
            Time
            <select
              className="mt-1 w-full border border-[var(--border)] rounded-lg bg-white px-2 py-2 text-sm"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            >
              {timeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}
    </div>
  );
}
