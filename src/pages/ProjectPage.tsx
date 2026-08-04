// The project page is the landing spot for session actions and workflow start.
import { Card } from "@/components/ui/card";
import { LandingHero } from "@/features/project/components/LandingHero";

export function ProjectPage() {
  return (
    <div className="grid gap-6">
      <Card className="bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_55%,#f0fdfa_100%)]">
        <h1 className="text-3xl font-semibold text-slate-900">Project Workspace</h1>
        <div className="mt-4 grid gap-3 text-sm leading-7 text-[var(--color-slate)]">
          <p>The full characterization workflow lives here, including setup, measurement entry, file import, results, and report generation.</p>
          <p>Use the session controls below to continue a saved run, start a fresh workflow, or import/export project state for testing.</p>
        </div>
      </Card>
      <LandingHero />
    </div>
  );
}
