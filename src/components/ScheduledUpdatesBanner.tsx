import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useBulkStore } from "../features/bulkChange/bulkChange.store";

export default function ScheduledUpdatesBanner() {
  const { jobs } = useBulkStore();
  const { count, nextRun } = useMemo(() => {
    const now = Date.now();
    const scheduled = jobs.filter(
      (j) =>
        j.status === "Ready" &&
        !!j.draftSnapshot.effectiveAt &&
        j.draftSnapshot.effectiveAt > now
    );
    const next = scheduled
      .map((j) => j.draftSnapshot.effectiveAt as number)
      .sort((a, b) => a - b)[0];
    return { count: scheduled.length, nextRun: next };
  }, [jobs]);

  if (count === 0) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex items-start justify-between gap-3 flex-wrap">
      <div className="space-y-1">
        <div className="font-semibold">Scheduled updates pending</div>
        <div className="text-[13px]">
          {count} scheduled change{count === 1 ? "" : "s"}{" "}
          {nextRun ? `· Next run ${new Date(nextRun).toLocaleString()}` : ""}
        </div>
        <div className="text-[12px] text-amber-800">
          Review scheduled jobs before making edits that could conflict with queued changes.
        </div>
      </div>
      <Link to="/jobs/scheduled" className="text-amber-900 underline text-sm">
        View scheduled jobs
      </Link>
    </div>
  );
}
