import type { Employee } from "../people.data";
import type { AppliedFilterChip, FilterReferenceData, FilterState } from "./filter.types";

function parseDate(value?: string) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  // Supports MM/DD/YYYY or ISO
  const iso = Date.parse(trimmed);
  if (!Number.isNaN(iso)) return new Date(iso);
  const parts = trimmed.split("/");
  if (parts.length === 3) {
    const [mm, dd, yyyy] = parts.map((p) => Number(p));
    if (mm && dd && yyyy) return new Date(yyyy, mm - 1, dd);
  }
  return null;
}

function inDateRange(value: string | undefined, after?: string, before?: string, includeEmpty?: boolean) {
  const d = parseDate(value);
  if (!d) return includeEmpty ? true : false;
  const afterDate = parseDate(after);
  if (afterDate && d < afterDate) return false;
  const beforeDate = parseDate(before);
  if (beforeDate && d > beforeDate) return false;
  return true;
}

function computeTotalComp(emp: Employee, includeBonus?: boolean) {
  const cash = emp.cashComp ?? emp.baseSalary ?? 0;
  if (!includeBonus) return cash;
  const bonus = emp.targetBonusPct ? (cash * emp.targetBonusPct) / 100 : 0;
  return cash + bonus;
}

export function applyEmployeeFilters(employees: Employee[], state: FilterState): Employee[] {
  return employees.filter((emp) => {
    // Compensation
    if (state.compensation.payPeriod.length > 0) {
      const period = emp.payPeriod ?? (emp.employmentType === "Contractor" ? "Hourly" : "Annual");
      if (!state.compensation.payPeriod.includes(period)) return false;
    }
    if (state.compensation.currency.length > 0) {
      const currency = emp.compCurrency ?? emp.currency ?? "USD";
      if (!state.compensation.currency.includes(currency)) return false;
    }
    if (state.compensation.minCashComp !== undefined || state.compensation.maxCashComp !== undefined) {
      const total = computeTotalComp(emp, state.compensation.includeBonus);
      if (state.compensation.minCashComp !== undefined && total < state.compensation.minCashComp) return false;
      if (state.compensation.maxCashComp !== undefined && total > state.compensation.maxCashComp) return false;
    } else if (state.compensation.includeEmpty && (emp.cashComp === undefined || emp.cashComp === null)) {
      return true;
    }

    // Department
    if (state.department.selected.length > 0 && !state.department.selected.includes(emp.department)) {
      return false;
    }

    // Location
    const location = emp.workLocation ?? emp.location;
    if (state.location.selected.length > 0 && !state.location.selected.includes(location)) {
      return false;
    }

    // Jurisdiction
    if (state.jurisdiction.selected.length > 0 && !state.jurisdiction.selected.includes(emp.jurisdiction ?? "")) {
      return false;
    }

    // Employment status
    if (state.employmentStatus.selected.length > 0 && !state.employmentStatus.selected.includes(emp.status)) {
      return false;
    }

    // Employment type
    if (state.employmentType.selected.length > 0 && !state.employmentType.selected.includes(emp.employmentType)) {
      return false;
    }

    // Legal entity
    if (state.legalEntity.selected.length > 0 && !state.legalEntity.selected.includes(emp.legalEntity ?? "")) {
      return false;
    }

    // Start date
    if (state.startDate.after || state.startDate.before) {
      if (!inDateRange(emp.startDate, state.startDate.after, state.startDate.before)) return false;
    }

    // End date
    if (state.endDate.after || state.endDate.before || state.endDate.includeEmpty) {
      const endValue = emp.endDate ?? emp.terminationDate ?? "";
      if (!inDateRange(endValue, state.endDate.after, state.endDate.before, state.endDate.includeEmpty)) return false;
    }

    // Manager
    if (state.manager.selected.length > 0) {
      if (!emp.managerId || !state.manager.selected.includes(emp.managerId)) return false;
    }

    return true;
  });
}

export function buildFilterChips(state: FilterState, ref: FilterReferenceData): AppliedFilterChip[] {
  const chips: AppliedFilterChip[] = [];

  const addMulti = (category: AppliedFilterChip["category"], field: string, values: string[]) => {
    values.forEach((value) => {
      chips.push({
        key: `${category}:${field}:${value}`,
        label: value,
        category,
        field,
        value,
      });
    });
  };

  addMulti("department", "selected", state.department.selected);
  addMulti("location", "selected", state.location.selected);
  addMulti("jurisdiction", "selected", state.jurisdiction.selected);
  addMulti("employmentStatus", "selected", state.employmentStatus.selected);
  addMulti("employmentType", "selected", state.employmentType.selected);
  addMulti("legalEntity", "selected", state.legalEntity.selected);

  if (state.manager.selected.length > 0) {
    const map = new Map(ref.managers.map((m) => [m.id, m.name]));
    state.manager.selected.forEach((id) => {
      chips.push({
        key: `manager:selected:${id}`,
        label: map.get(id) ?? id,
        category: "manager",
        field: "selected",
        value: id,
      });
    });
  }

  if (state.compensation.payPeriod.length > 0) {
    addMulti("compensation", "payPeriod", state.compensation.payPeriod);
  }
  if (state.compensation.currency.length > 0) {
    addMulti("compensation", "currency", state.compensation.currency);
  }
  if (state.compensation.minCashComp !== undefined) {
    chips.push({
      key: "compensation:min",
      label: `Comp ≥ ${state.compensation.minCashComp}`,
      category: "compensation",
      field: "minCashComp",
      value: String(state.compensation.minCashComp),
    });
  }
  if (state.compensation.maxCashComp !== undefined) {
    chips.push({
      key: "compensation:max",
      label: `Comp ≤ ${state.compensation.maxCashComp}`,
      category: "compensation",
      field: "maxCashComp",
      value: String(state.compensation.maxCashComp),
    });
  }
  if (state.compensation.includeBonus) {
    chips.push({
      key: "compensation:includeBonus",
      label: "Include bonus",
      category: "compensation",
      field: "includeBonus",
    });
  }
  if (state.compensation.includeEmpty) {
    chips.push({
      key: "compensation:empty",
      label: "Empty comp",
      category: "compensation",
      field: "includeEmpty",
    });
  }

  if (state.startDate.after) {
    chips.push({
      key: "startDate:after",
      label: `Start after ${state.startDate.after}`,
      category: "startDate",
      field: "after",
      value: state.startDate.after,
    });
  }
  if (state.startDate.before) {
    chips.push({
      key: "startDate:before",
      label: `Start before ${state.startDate.before}`,
      category: "startDate",
      field: "before",
      value: state.startDate.before,
    });
  }

  if (state.endDate.after) {
    chips.push({
      key: "endDate:after",
      label: `End after ${state.endDate.after}`,
      category: "endDate",
      field: "after",
      value: state.endDate.after,
    });
  }
  if (state.endDate.before) {
    chips.push({
      key: "endDate:before",
      label: `End before ${state.endDate.before}`,
      category: "endDate",
      field: "before",
      value: state.endDate.before,
    });
  }
  if (state.endDate.includeEmpty) {
    chips.push({
      key: "endDate:empty",
      label: "End date empty",
      category: "endDate",
      field: "includeEmpty",
    });
  }

  return chips;
}

export function removeFilterChip(state: FilterState, chip: AppliedFilterChip): FilterState {
  if (chip.category === "compensation") {
    const comp = { ...state.compensation };
    if (chip.field === "payPeriod" && chip.value) comp.payPeriod = comp.payPeriod.filter((v) => v !== chip.value);
    if (chip.field === "currency" && chip.value) comp.currency = comp.currency.filter((v) => v !== chip.value);
    if (chip.field === "minCashComp") comp.minCashComp = undefined;
    if (chip.field === "maxCashComp") comp.maxCashComp = undefined;
    if (chip.field === "includeBonus") comp.includeBonus = false;
    if (chip.field === "includeEmpty") comp.includeEmpty = false;
    return { ...state, compensation: comp };
  }

  const removeFrom = (key: keyof FilterState, value?: string) => {
    if (!value) return state;
    const next = { ...state };
    (next as any)[key] = { selected: (state as any)[key].selected.filter((v: string) => v !== value) };
    return next;
  };

  if (chip.category === "department") return removeFrom("department", chip.value);
  if (chip.category === "location") return removeFrom("location", chip.value);
  if (chip.category === "jurisdiction") return removeFrom("jurisdiction", chip.value);
  if (chip.category === "employmentStatus") return removeFrom("employmentStatus", chip.value);
  if (chip.category === "employmentType") return removeFrom("employmentType", chip.value);
  if (chip.category === "legalEntity") return removeFrom("legalEntity", chip.value);
  if (chip.category === "manager") return removeFrom("manager", chip.value);

  if (chip.category === "startDate") {
    return { ...state, startDate: { ...state.startDate, [chip.field]: undefined } };
  }
  if (chip.category === "endDate") {
    if (chip.field === "includeEmpty") {
      return { ...state, endDate: { ...state.endDate, includeEmpty: false } };
    }
    return { ...state, endDate: { ...state.endDate, [chip.field]: undefined } };
  }

  return state;
}
