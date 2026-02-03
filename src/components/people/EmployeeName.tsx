import EmployeeLink from "./EmployeeLink";

export default function EmployeeName({
  employeeId,
  className,
}: {
  employeeId: string;
  className?: string;
}) {
  return <EmployeeLink employeeId={employeeId} variant="text" className={className} />;
}

