import { createBrowserRouter, Navigate } from "react-router-dom";
import Shell from "./layout/Shell";
import PeoplePage from "../features/people/PeoplePage";
import AddPeoplePage from "../features/people/AddPeoplePage";
import PeopleDetailsGridPage from "../features/people/PeopleDetailsGridPage";
import BulkChangeWizard from "../features/bulkChange/BulkChangeWizard";
import CsvImportPage from "../features/bulkChange/csv/CsvImportPage";
import JobsPage from "../features/bulkChange/jobs/JobsPage";
import JobDetailPage from "../features/bulkChange/jobs/JobDetailPage";
import ScheduledJobsPage from "../features/bulkChange/jobs/ScheduledJobsPage";

function RouteError() {
  return (
    <div style={{ padding: 16, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>Route error</h1>
      <p style={{ marginTop: 8 }}>Open DevTools → Console for the stack trace.</p>
    </div>
  );
}

function NotFound() {
  return (
    <div style={{ padding: 16, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>404</h1>
      <p style={{ marginTop: 8 }}>This route does not exist.</p>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Shell />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to="/people" replace /> },
      { path: "people", element: <PeoplePage /> },
      { path: "people/add", element: <AddPeoplePage /> },
      { path: "people/details", element: <PeopleDetailsGridPage /> },
      { path: "bulk-change/new", element: <BulkChangeWizard /> },
      { path: "bulk-change/import-csv", element: <CsvImportPage /> },
      { path: "jobs", element: <JobsPage /> },
      { path: "jobs/scheduled", element: <ScheduledJobsPage /> },
      { path: "jobs/:jobId", element: <JobDetailPage /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);
