import { useFilterStore } from "../../../features/people/filters/filter.store";
import MultiSelectPanel from "./MultiSelectPanel";

export default function JurisdictionPanel({ jurisdictions }: { jurisdictions: string[] }) {
  const { filterState, setFilterState } = useFilterStore();
  return (
    <MultiSelectPanel
      options={jurisdictions.map((d) => ({ value: d }))}
      selected={filterState.jurisdiction.selected}
      onChange={(next) => setFilterState({ jurisdiction: { selected: next } })}
      emptyLabel="No jurisdictions available"
    />
  );
}

