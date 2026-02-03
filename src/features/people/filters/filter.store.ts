import { create } from "zustand";
import { loadJSON, saveJSON } from "../../../lib/storage";
import type { FilterState } from "./filter.types";
import { DEFAULT_FILTER_STATE } from "./filter.types";

const FILTER_KEY = "rbp_people_filters_v1";

type State = {
  isOpen: boolean;
  filterState: FilterState;
  openFilters: () => void;
  closeFilters: () => void;
  setFilterState: (partial: Partial<FilterState>) => void;
  clearAll: () => void;
};

function loadFilters(): FilterState {
  return loadJSON<FilterState>(FILTER_KEY, DEFAULT_FILTER_STATE);
}

function persistFilters(state: FilterState) {
  saveJSON(FILTER_KEY, state);
}

export const useFilterStore = create<State>((set, get) => ({
  isOpen: false,
  filterState: loadFilters(),
  openFilters: () => set({ isOpen: true }),
  closeFilters: () => set({ isOpen: false }),
  setFilterState: (partial) => {
    const next = { ...get().filterState, ...partial };
    persistFilters(next);
    set({ filterState: next });
  },
  clearAll: () => {
    persistFilters(DEFAULT_FILTER_STATE);
    set({ filterState: DEFAULT_FILTER_STATE });
  },
}));

