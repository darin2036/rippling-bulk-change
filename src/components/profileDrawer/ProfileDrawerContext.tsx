import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import type { Employee } from "../../features/people/people.data";
import ProfileDrawer from "./ProfileDrawer";

type Ctx = {
  openEmployeeId: (id: string) => void;
  openEmployee: (employee: Employee | string) => void;
  close: () => void;
  isOpen: boolean;
  activeEmployeeId: string | null;
};

const ProfileDrawerContext = createContext<Ctx | null>(null);

export function ProfileDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeEmployeeId, setActiveEmployeeId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const openEmployeeId = useCallback((id: string) => {
    setActiveEmployeeId(id);
    setIsOpen(true);

    const next = new URLSearchParams(searchParams);
    next.set("profile", id);
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const openEmployee = useCallback((employee: Employee | string) => {
    if (typeof employee === "string") openEmployeeId(employee);
    else openEmployeeId(employee.id);
  }, [openEmployeeId]);

  const close = useCallback(() => {
    setIsOpen(false);
    setActiveEmployeeId(null);

    const next = new URLSearchParams(searchParams);
    next.delete("profile");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  // Bonus: deep-link support via ?profile=<id>
  useEffect(() => {
    const id = searchParams.get("profile");
    if (!id) return;
    if (id === activeEmployeeId && isOpen) return;
    setActiveEmployeeId(id);
    setIsOpen(true);
  }, [activeEmployeeId, isOpen, searchParams]);

  const value = useMemo<Ctx>(
    () => ({ openEmployeeId, openEmployee, close, isOpen, activeEmployeeId }),
    [activeEmployeeId, close, isOpen, openEmployee, openEmployeeId]
  );

  return (
    <ProfileDrawerContext.Provider value={value}>
      {children}
      <ProfileDrawer open={isOpen} employeeId={activeEmployeeId} onClose={close} />
    </ProfileDrawerContext.Provider>
  );
}

export function useProfileDrawer() {
  const ctx = useContext(ProfileDrawerContext);
  if (!ctx) throw new Error("useProfileDrawer must be used within ProfileDrawerProvider");
  return ctx;
}
