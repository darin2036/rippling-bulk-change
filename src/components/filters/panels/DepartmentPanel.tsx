import { useFilterStore } from "../../../features/people/filters/filter.store";
import MultiSelectPanel from "./MultiSelectPanel";

export default function DepartmentPanel({ departments }: { departments: string[] }) {
  const { filterState, setFilterState } = useFilterStore();
  return (
    <MultiSelectPanel
      options={departments.map((d) => ({ value: d }))}
      selected={filterState.department.selected}
      onChange={(next) => setFilterState({ department: { selected: next } })}
      emptyLabel="No departments available"
    />
  );
}

