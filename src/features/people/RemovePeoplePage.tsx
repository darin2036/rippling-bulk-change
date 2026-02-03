import Button from "../../components/Button";

export default function RemovePeoplePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
        <div className="text-sm text-[var(--ink-500)]">
          <span className="font-semibold text-[var(--plum-700)] border-b-2 border-[var(--plum-600)] pb-2 inline-flex">
            Start the remove Process
          </span>
        </div>
        <Button>Save and exit</Button>
      </div>

      <div className="flex justify-center">
        <div className="max-w-lg w-full text-center space-y-4">
          <h1 className="text-xl font-semibold">Remove people</h1>
          <div className="text-left text-sm text-[var(--ink-500)]">
            Select an option to get started<span className="text-red-500">*</span>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-3 border border-[var(--border)] rounded-lg px-3 py-2 bg-white">
              <input type="radio" name="remove-mode" />
              <span className="text-sm">Remove an individual</span>
            </label>
            <label className="flex items-center gap-3 border border-[var(--border)] rounded-lg px-3 py-2 bg-white">
              <input type="radio" name="remove-mode" />
              <span className="text-sm">Remove multiple people</span>
            </label>
          </div>
          <div className="flex justify-end">
            <Button variant="primary" disabled>
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
