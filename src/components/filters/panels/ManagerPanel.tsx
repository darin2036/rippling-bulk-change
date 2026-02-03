import { useFilterStore } from "../../../features/people/filters/filter.store";
import MultiSelectPanel from "./MultiSelectPanel";

export default function ManagerPanel({ managers }: { managers: { id: string; name: string }[] }) {
  const { filterState, setFilterState } = useFilterStore();
  return (
    <MultiSelectPanel
      options={managers.map((m) => ({ value: m.id, label: m.name }))}
      selected={filterState.manager.selected}
      onChange={(next) => setFilterState({ manager: { selected: next } })}
      emptyLabel="No managers available"
    />
  );
}

