import { useFilterStore } from "../../../features/people/filters/filter.store";
import type { EmploymentType } from "../../../features/people/people.data";
import MultiSelectPanel from "./MultiSelectPanel";

const TYPE_OPTIONS: EmploymentType[] = ["Full-time", "Part-time", "Contractor", "Intern"];

export default function EmploymentTypePanel() {
  const { filterState, setFilterState } = useFilterStore();
  return (
    <MultiSelectPanel
      options={TYPE_OPTIONS.map((value) => ({ value }))}
      selected={filterState.employmentType.selected}
      onChange={(next) => setFilterState({ employmentType: { selected: next as EmploymentType[] } })}
    />
  );
}

