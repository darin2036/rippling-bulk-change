import { useFilterStore } from "../../../features/people/filters/filter.store";
import MultiSelectPanel from "./MultiSelectPanel";

export default function LocationPanel({ locations }: { locations: string[] }) {
  const { filterState, setFilterState } = useFilterStore();
  return (
    <MultiSelectPanel
      options={locations.map((d) => ({ value: d }))}
      selected={filterState.location.selected}
      onChange={(next) => setFilterState({ location: { selected: next } })}
      emptyLabel="No locations available"
    />
  );
}

