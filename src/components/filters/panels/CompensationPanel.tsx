import { useFilterStore } from "../../../features/people/filters/filter.store";

export default function CompensationPanel({ currencies }: { currencies: string[] }) {
  const { filterState, setFilterState } = useFilterStore();
  const comp = filterState.compensation;

  const togglePayPeriod = (value: "Annual" | "Hourly") => {
    const next = comp.payPeriod.includes(value)
      ? comp.payPeriod.filter((v) => v !== value)
      : [...comp.payPeriod, value];
    setFilterState({ compensation: { ...comp, payPeriod: next } });
  };

  const toggleCurrency = (value: string) => {
    const next = comp.currency.includes(value)
      ? comp.currency.filter((v) => v !== value)
      : [...comp.currency, value];
    setFilterState({ compensation: { ...comp, currency: next } });
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs uppercase tracking-wide text-[var(--ink-500)]">Pay period</div>
        <div className="mt-2 space-y-2">
          {["Annual", "Hourly"].map((p) => (
            <label key={p} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={comp.payPeriod.includes(p as "Annual" | "Hourly")} onChange={() => togglePayPeriod(p as "Annual" | "Hourly")} />
              {p}
            </label>
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-wide text-[var(--ink-500)]">Currency</div>
        <div className="mt-2 space-y-2">
          {currencies.map((c) => (
            <label key={c} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={comp.currency.includes(c)} onChange={() => toggleCurrency(c)} />
              {c}
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="text-xs text-[var(--ink-500)]">Min cash comp</div>
          <input
            type="number"
            className="w-full border border-[var(--border)] rounded-md px-3 py-2 text-sm"
            value={comp.minCashComp ?? ""}
            onChange={(e) => setFilterState({ compensation: { ...comp, minCashComp: e.target.value ? Number(e.target.value) : undefined } })}
          />
        </div>
        <div className="space-y-1">
          <div className="text-xs text-[var(--ink-500)]">Max cash comp</div>
          <input
            type="number"
            className="w-full border border-[var(--border)] rounded-md px-3 py-2 text-sm"
            value={comp.maxCashComp ?? ""}
            onChange={(e) => setFilterState({ compensation: { ...comp, maxCashComp: e.target.value ? Number(e.target.value) : undefined } })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!comp.includeBonus}
            onChange={(e) => setFilterState({ compensation: { ...comp, includeBonus: e.target.checked } })}
          />
          Include target bonus in comp
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!comp.includeEmpty}
            onChange={(e) => setFilterState({ compensation: { ...comp, includeEmpty: e.target.checked } })}
          />
          Include employees with empty comp
        </label>
      </div>
    </div>
  );
}

