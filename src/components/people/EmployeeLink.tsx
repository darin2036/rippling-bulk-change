import { useMemo, type MouseEvent } from "react";
import clsx from "clsx";
import { getEmployees } from "../../features/people/people.data";
import { useProfileDrawer } from "../profileDrawer/ProfileDrawerContext";
import EmployeeAvatar from "./EmployeeAvatar";

type Variant = "text" | "pill" | "row";

export default function EmployeeLink({
  employeeId,
  label,
  showEmail = false,
  variant = "text",
  className,
  stopPropagation = true,
}: {
  employeeId: string;
  label?: string;
  showEmail?: boolean;
  variant?: Variant;
  className?: string;
  stopPropagation?: boolean;
}) {
  const { openEmployeeId } = useProfileDrawer();
  const employees = useMemo(() => getEmployees(), []);
  const employee = employees.find((e) => e.id === employeeId);
  const name = label ?? (employee ? (employee.name ?? employee.fullName) : "Unknown");
  const email = employee?.email ?? "";

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (stopPropagation) e.stopPropagation();
    openEmployeeId(employeeId);
  };

  if (variant === "row") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={clsx("flex items-center gap-3 text-left", className)}
      >
        <EmployeeAvatar employeeId={employeeId} size="sm" asButton={false} />
        <div className="min-w-0">
          <div className="font-semibold truncate">{name}</div>
          {(showEmail || email) ? (
            <div className="text-xs text-[var(--ink-500)] truncate">{email}</div>
          ) : null}
        </div>
      </button>
    );
  }

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={clsx(
          "inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--cream-100)] px-3 py-1 text-sm text-[var(--ink-800)] hover:bg-white",
          className
        )}
      >
        {name}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={clsx("text-[var(--plum-700)] hover:underline", className)}
    >
      {name}
    </button>
  );
}
