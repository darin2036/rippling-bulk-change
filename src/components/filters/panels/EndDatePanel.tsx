import { useFilterStore } from "../../../features/people/filters/filter.store";

export default function EndDatePanel() {
  const { filterState, setFilterState } = useFilterStore();
  const state = filterState.endDate;
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="text-xs text-[var(--ink-500)]">After</div>
        <input
          type="date"
          className="w-full border border-[var(--border)] rounded-md px-3 py-2 text-sm"
          value={state.after ?? ""}
          onChange={(e) => setFilterState({ endDate: { ...state, after: e.target.value || undefined } })}
        />
      </div>
      <div className="space-y-1">
        <div className="text-xs text-[var(--ink-500)]">Before</div>
        <input
          type="date"
          className="w-full border border-[var(--border)] rounded-md px-3 py-2 text-sm"
          value={state.before ?? ""}
          onChange={(e) => setFilterState({ endDate: { ...state, before: e.target.value || undefined } })}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={!!state.includeEmpty}
          onChange={(e) => setFilterState({ endDate: { ...state, includeEmpty: e.target.checked } })}
        />
        Include empty end dates
      </label>
    </div>
  );
}

