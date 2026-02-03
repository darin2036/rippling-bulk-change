import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";

type Props = { currentPath: string };

const IconPeople = () => (
  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
    <circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="14" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M2.5 17C3.3 14.3 5.7 12.5 8.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M11.5 17C11.8 14.8 13.3 13.5 15.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
const IconMinus = () => (
  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
    <path d="M6.5 10H13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
const IconOrg = () => (
  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
    <rect x="3" y="3" width="5" height="5" stroke="currentColor" strokeWidth="1.5" />
    <rect x="12" y="3" width="5" height="5" stroke="currentColor" strokeWidth="1.5" />
    <rect x="7.5" y="12" width="5" height="5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M5.5 8V10H14.5V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
const IconStar = () => (
  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
    <path d="M10 3L12 7.5L17 8L13 11.5L14 16.5L10 13.8L6 16.5L7 11.5L3 8L8 7.5L10 3Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
  </svg>
);
const IconGear = () => (
  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
    <path d="M3 10H5M15 10H17M10 3V5M10 15V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const Item = ({
  to,
  label,
  active,
  icon,
  badge,
}: {
  to: string;
  label: string;
  active: boolean;
  icon?: ReactNode;
  badge?: string;
}) => (
  <Link
    to={to}
    className={clsx(
      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--ink-700)]",
      active ? "bg-[var(--plum-100)] text-[var(--plum-700)] font-semibold" : "hover:bg-[var(--cream-100)]"
    )}
  >
    <span className="w-5 text-center">{icon}</span>
    <span className="flex-1">{label}</span>
    {badge ? (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--plum-100)] text-[var(--plum-700)]">
        {badge}
      </span>
    ) : null}
  </Link>
);

export default function Sidebar({ currentPath }: Props) {
  const isDetails = currentPath.startsWith("/people/details");

  return (
    <aside className="w-64 border-r border-[var(--border)] bg-white min-h-[calc(100vh-56px)] p-4">
      <div className="space-y-1">
        <Item to="/people/add" label="Add people" active={currentPath.startsWith("/people/add")} icon={<IconPeople />} />
        <Item to="/people/remove" label="Remove people" active={currentPath.startsWith("/people/remove")} icon={<IconMinus />} />
        <Item to="/people/details" label="Org Chart" active={isDetails} icon={<IconOrg />} />
      </div>

      <div className="mt-6 border-t border-[var(--border)] pt-4">
        <div className="text-xs text-[var(--ink-500)] mb-2">Favorites</div>
        <div className="space-y-1">
          <Item to="/people" label="Finance" active={false} icon={<IconStar />} badge="Preview" />
          <Item to="/people" label="IT" active={false} icon={<IconStar />} />
          <Item to="/people" label="Users" active={false} icon={<IconStar />} />
          <Item to="/people" label="Global" active={false} icon={<IconStar />} badge="Preview" />
        </div>
      </div>

      <div className="mt-8 border-t border-[var(--border)] pt-4">
        <div className="text-xs text-[var(--ink-500)] mb-2">Platform</div>
        <div className="space-y-1">
          <div className="px-3 py-2 text-sm text-[var(--ink-700)] hover:bg-[var(--cream-100)] rounded-lg flex items-center gap-2">
            <span className="w-5 text-center"><IconGear /></span>
            Tools
          </div>
          <div className="px-3 py-2 text-sm text-[var(--ink-700)] hover:bg-[var(--cream-100)] rounded-lg flex items-center gap-2">
            <span className="w-5 text-center"><IconGear /></span>
            Company settings
          </div>
          <div className="px-3 py-2 text-sm text-[var(--ink-700)] hover:bg-[var(--cream-100)] rounded-lg flex items-center gap-2">
            <span className="w-5 text-center"><IconGear /></span>
            Global workforce
          </div>
          <div className="px-3 py-2 text-sm text-[var(--ink-700)] hover:bg-[var(--cream-100)] rounded-lg flex items-center gap-2">
            <span className="w-5 text-center"><IconGear /></span>
            App Shop
          </div>
          <div className="px-3 py-2 text-sm text-[var(--ink-700)] hover:bg-[var(--cream-100)] rounded-lg flex items-center gap-2">
            <span className="w-5 text-center"><IconGear /></span>
            Help
          </div>
        </div>
      </div>
    </aside>
  );
}
