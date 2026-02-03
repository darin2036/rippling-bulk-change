import { useMemo } from "react";
import clsx from "clsx";
import { getEmployees } from "../../features/people/people.data";
import { useProfileDrawer } from "../profileDrawer/ProfileDrawerContext";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((p) => p[0]!.toUpperCase()).join("") || "?";
}

export default function EmployeeAvatar({
  employeeId,
  size = "md",
  className,
  stopPropagation = true,
  asButton = true,
}: {
  employeeId: string;
  size?: "sm" | "md";
  className?: string;
  stopPropagation?: boolean;
  asButton?: boolean;
}) {
  const { openEmployeeId } = useProfileDrawer();
  const employees = useMemo(() => getEmployees(), []);
  const employee = employees.find((e) => e.id === employeeId);
  const name = employee ? (employee.name ?? employee.fullName) : "Unknown";

  const sizeClass = size === "sm" ? "w-7 h-7 text-[10px]" : "w-9 h-9 text-xs";

  const classes = clsx(
    "rounded-full bg-[var(--plum-100)] text-[var(--plum-700)] font-semibold border border-[var(--plum-200)] flex items-center justify-center",
    sizeClass,
    className
  );

  if (!asButton) {
    return (
      <div className={classes} aria-hidden="true">
        {initials(name)}
      </div>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      title={name}
      onClick={(e) => {
        if (stopPropagation) e.stopPropagation();
        openEmployeeId(employeeId);
      }}
    >
      {initials(name)}
    </button>
  );
}
