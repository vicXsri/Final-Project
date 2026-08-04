// The about page gives the project a clean high-level summary.
import { Card } from "@/components/ui/card";

export function AboutPage() {
  return (
    <div className="grid gap-6">
      <Card className="bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_45%,#f0fdfa_100%)]">
        <h1 className="text-3xl font-semibold text-slate-900">About This Project</h1>
        <div className="mt-4 grid gap-4 text-sm leading-8 text-[var(--color-slate)]">
          <p>
            This project presents a modular web application for THz Quantum Cascade Laser characterisation. It is
            designed to support structured setup entry, measurement data handling, visualization, and report
            generation within a clear and organized scientific workflow.
          </p>
          <p>
            The platform focuses on device metadata, pulsed and continuous-wave measurement setup, file upload with
            trace assignment, interactive plots, and generated report outputs that help present measurement results in
            a consistent form.
          </p>
          <p>
            The application is built with React, TypeScript, and modular processing components so that scientific
            logic, visualization, and export features remain easier to maintain and extend as the project grows.
          </p>
        </div>
      </Card>
    </div>
  );
}
