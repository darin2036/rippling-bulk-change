import Button from "../../../components/Button";

type Props = {
  count: number;
  onViewPeople: () => void;
  onRestart: () => void;
};

export default function Step5Success({ count, onViewPeople, onRestart }: Props) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--cream-100)] p-6">
        <div className="text-lg font-semibold">Bulk change applied</div>
        <div className="text-sm text-[var(--ink-500)] mt-1">
          Bulk change applied to <span className="font-semibold text-[var(--ink-900)]">{count}</span> people.
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="primary" onClick={onViewPeople}>
          View People
        </Button>
        <Button onClick={onRestart}>Start another bulk change</Button>
      </div>
    </div>
  );
}
