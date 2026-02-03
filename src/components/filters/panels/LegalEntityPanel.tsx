import { useFilterStore } from "../../../features/people/filters/filter.store";
import MultiSelectPanel from "./MultiSelectPanel";

export default function LegalEntityPanel({ legalEntities }: { legalEntities: string[] }) {
  const { filterState, setFilterState } = useFilterStore();
  return (
    <MultiSelectPanel
      options={legalEntities.map((d) => ({ value: d }))}
      selected={filterState.legalEntity.selected}
      onChange={(next) => setFilterState({ legalEntity: { selected: next } })}
      emptyLabel="No legal entities available"
    />
  );
}

