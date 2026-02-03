import { Outlet, useLocation } from "react-router-dom";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import { ProfileDrawerProvider } from "../../components/profileDrawer/ProfileDrawerContext";
import FiltersModal from "../../components/FiltersModal";

export default function Shell() {
  const loc = useLocation();
  // Keep sidebar visible for all pages (Rippling vibe)
  return (
    <ProfileDrawerProvider>
      <div className="min-h-screen bg-transparent">
        <TopBar />
        <div className="flex">
          <Sidebar currentPath={loc.pathname} />
          <main className="flex-1 p-6">
            <div className="max-w-6xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <FiltersModal />
    </ProfileDrawerProvider>
  );
}
