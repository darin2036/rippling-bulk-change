import Button from "../../components/Button";
import { Card, CardContent, CardHeader } from "../../components/Card";

export default function AddPeoplePage() {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Add People</h1>
          <Button variant="primary" size="sm">HELP DOCS ↗</Button>
        </div>
        <Button>Save and exit</Button>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-6">
          <CardHeader>
            <div className="text-sm font-semibold">How do you want to create people's profiles?</div>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="flex gap-3 p-3 border border-zinc-200 rounded-lg">
              <input type="radio" name="mode" />
              <div>
                <div className="font-medium">Fill out and upload a CSV file</div>
                <div className="text-sm text-zinc-600">Download the template profile worksheet, fill in the details, then upload the file into Rippling</div>
              </div>
            </label>

            <label className="flex gap-3 p-3 border border-[#6B1B56] rounded-lg">
              <input type="radio" name="mode" defaultChecked />
              <div>
                <div className="font-medium">Enter manually</div>
                <div className="text-sm text-zinc-600">Copy and paste information from an external spreadsheet or manually</div>
              </div>
            </label>
          </CardContent>
        </Card>

        <Card className="col-span-6">
          <CardHeader>
            <div className="text-sm font-semibold">Template preview</div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-zinc-600">
              The data fields listed below will be available in Rippling CSV template and can help you import people into Rippling.
              For specific fields, the values entered should match the values available in Rippling.
            </p>

            <div>
              <div className="text-sm font-semibold">Required information</div>
              <ul className="text-sm text-zinc-700 list-disc ml-5 mt-2 space-y-1">
                <li>First name</li>
                <li>Last name</li>
                <li>Invite email</li>
                <li>Work email</li>
                <li>Start date (mm/dd/yyyy)</li>
              </ul>
            </div>

            <div>
              <div className="text-sm font-semibold">Optional information</div>
              <ul className="text-sm text-zinc-700 list-disc ml-5 mt-2 space-y-1">
                <li>Department</li>
                <li>Teams</li>
                <li>Employment type</li>
                <li>Title</li>
                <li>Manager</li>
                <li>Work location</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
