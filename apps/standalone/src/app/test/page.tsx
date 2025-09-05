"use client";

export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="mb-4 text-2xl font-bold text-foreground">
        Test Tailwind Classes
      </h1>

      <div className="space-y-4">
        <div className="rounded bg-primary p-4 text-primary-foreground">
          Primary background test
        </div>

        <div className="rounded border border-border bg-background p-4">
          Background with border test
        </div>

        <div className="flex gap-2">
          <button className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
            Standard Tailwind Blue
          </button>

          <button className="rounded bg-[#2F6868] px-4 py-2 text-white hover:bg-[#2F6868]/90">
            Hardcoded Color
          </button>
        </div>
      </div>
    </div>
  );
}
