import { useFilterStore } from "../../../features/people/filters/filter.store";
import type { EmploymentStatus } from "../../../features/people/people.data";
import MultiSelectPanel from "./MultiSelectPanel";

const STATUS_OPTIONS: EmploymentStatus[] = ["Active", "Invited", "Inactive"];

export default function EmploymentStatusPanel() {
  const { filterState, setFilterState } = useFilterStore();
  return (
    <MultiSelectPanel
      options={STATUS_OPTIONS.map((value) => ({ value }))}
      selected={filterState.employmentStatus.selected}
      onChange={(next) => setFilterState({ employmentStatus: { selected: next as EmploymentStatus[] } })}
    />
  );
}
