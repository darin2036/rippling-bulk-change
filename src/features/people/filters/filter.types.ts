import type { EmploymentStatus, EmploymentType, Employee } from "../people.data";

export type FilterCategoryKey =
  | "compensation"
  | "department"
  | "location"
  | "jurisdiction"
  | "employmentStatus"
  | "employmentType"
  | "legalEntity"
  | "startDate"
  | "endDate"
  | "manager";

export type CompensationFilter = {
  payPeriod: Array<"Annual" | "Hourly">;
  currency: string[];
  minCashComp?: number;
  maxCashComp?: number;
  includeBonus?: boolean;
  includeEmpty?: boolean;
};

export type MultiSelectFilter = {
  selected: string[];
};

export type DateRangeFilter = {
  after?: string;
  before?: string;
  includeEmpty?: boolean;
};

export type FilterState = {
  compensation: CompensationFilter;
  department: MultiSelectFilter;
  location: MultiSelectFilter;
  jurisdiction: MultiSelectFilter;
  employmentStatus: { selected: EmploymentStatus[] };
  employmentType: { selected: EmploymentType[] };
  legalEntity: MultiSelectFilter;
  startDate: DateRangeFilter;
  endDate: DateRangeFilter;
  manager: MultiSelectFilter; // managerIds
};

export type AppliedFilterChip = {
  key: string;
  label: string;
  category: FilterCategoryKey;
  field: string;
  value?: string;
};

export type FilterReferenceData = {
  employees: Employee[];
  departments: string[];
  locations: string[];
  jurisdictions: string[];
  legalEntities: string[];
  managers: { id: string; name: string }[];
};

export const DEFAULT_FILTER_STATE: FilterState = {
  compensation: {
    payPeriod: [],
    currency: [],
    minCashComp: undefined,
    maxCashComp: undefined,
    includeBonus: false,
    includeEmpty: false,
  },
  department: { selected: [] },
  location: { selected: [] },
  jurisdiction: { selected: [] },
  employmentStatus: { selected: [] },
  employmentType: { selected: [] },
  legalEntity: { selected: [] },
  startDate: { after: undefined, before: undefined },
  endDate: { after: undefined, before: undefined, includeEmpty: false },
  manager: { selected: [] },
};

