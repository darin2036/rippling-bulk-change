import { useState } from "react";
import { Link } from "react-router-dom";

export default function TopBar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="h-14 bg-[var(--plum-800)] text-white flex items-center px-4 gap-4 shadow-[0_4px_12px_rgba(45,7,29,0.2)] relative">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 font-black tracking-tight">
          <Link to="/people" className="text-lg text-white no-underline">
            RIPPLING
          </Link>
          <button
            type="button"
            className="text-sm opacity-90 flex items-center gap-1"
            onClick={toggleMenu}
          >
            Menu
            <span className="text-xs opacity-70">{menuOpen ? "▴" : "▾"}</span>
          </button>
        </div>
        <div className="h-6 w-px bg-white/20" />
      </div>

      <div className="flex-1">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white/15 rounded-full px-4 py-2 text-sm opacity-95 flex items-center gap-2">
            <svg className="w-4 h-4 opacity-80" viewBox="0 0 20 20" fill="none">
              <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
              <path d="M13.5 13.5L18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="opacity-80">Search or jump to…</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-full bg-white/10">
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 14V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M10 6.5C8.8 6.5 8 7.2 8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <div className="p-1.5 rounded-full bg-white/10">
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M4 17C4.8 14 7.2 12 10 12C12.8 12 15.2 14 16 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <div className="p-1.5 rounded-full bg-white/10">
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
            <rect x="3" y="3" width="6" height="6" stroke="currentColor" strokeWidth="1.5" />
            <rect x="11" y="3" width="6" height="6" stroke="currentColor" strokeWidth="1.5" />
            <rect x="3" y="11" width="6" height="6" stroke="currentColor" strokeWidth="1.5" />
            <rect x="11" y="11" width="6" height="6" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
        <div className="relative p-1.5 rounded-full bg-white/10">
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
            <path d="M6 15H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M5 8C5 5.8 6.8 4 9 4H11C13.2 4 15 5.8 15 8V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M15 12L16.5 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="absolute -top-1 -right-1 text-[10px] bg-orange-500 text-white rounded-full px-1">
            2
          </span>
        </div>
        <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1">
          <div className="w-6 h-6 rounded-full bg-white/30" />
          <div className="text-sm">Opus Guard Inc.</div>
        </div>
      </div>

      {menuOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            onClick={closeMenu}
            aria-label="Close menu"
          />
          <div className="absolute top-14 left-3 z-50 w-72 bg-white text-[var(--ink-900)] rounded-2xl shadow-[0_20px_40px_rgba(32,12,26,0.2)] border border-[var(--border)] overflow-hidden">
            <div className="p-4 space-y-2">
              <Link to="/people" className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[var(--cream-100)]" onClick={closeMenu}>
                <span className="text-lg">🏠</span>
                <span className="text-sm font-medium">Home</span>
              </Link>
              <Link to="/people/add" className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[var(--cream-100)]" onClick={closeMenu}>
                <span className="text-lg">➕</span>
                <span className="text-sm font-medium">Add people</span>
              </Link>
              <Link to="/people/remove" className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[var(--cream-100)]" onClick={closeMenu}>
                <span className="text-lg">➖</span>
                <span className="text-sm font-medium">Remove people</span>
              </Link>
              <Link to="/people/details" className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[var(--cream-100)]" onClick={closeMenu}>
                <span className="text-lg">🗂️</span>
                <span className="text-sm font-medium">Org Chart</span>
              </Link>
            </div>

            <div className="px-4 pb-3">
              <div className="text-xs uppercase tracking-[0.2em] text-[var(--ink-500)] py-2 border-t border-[var(--border)]">
                Products
              </div>
              {[
                { label: "Favorites", badge: "" },
                { label: "Finance", badge: "Preview" },
                { label: "IT", badge: "" },
                { label: "Users", badge: "" },
                { label: "Global", badge: "Preview" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-[var(--cream-100)] text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">☆</span>
                    <span>{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.badge ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#ffe6c2] text-[#6a3c12]">
                        {item.badge}
                      </span>
                    ) : null}
                    <span className="text-[var(--ink-500)]">›</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-4 pb-4">
              <div className="text-xs uppercase tracking-[0.2em] text-[var(--ink-500)] py-2 border-t border-[var(--border)]">
                Platform
              </div>
              {["Tools", "Company settings", "Global workforce", "App Shop", "Help"].map((item) => (
                <div key={item} className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-[var(--cream-100)] text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">⚙️</span>
                    <span>{item}</span>
                  </div>
                  <span className="text-[var(--ink-500)]">›</span>
                </div>
              ))}
              <div className="border-t border-[var(--border)] mt-2 pt-2">
                <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[var(--cream-100)] text-sm">
                  <span className="text-lg">🤝</span>
                  <span>Refer a friend</span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </header>
  );
}
