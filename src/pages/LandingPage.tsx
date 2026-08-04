// This is the public home page with the intro and first call to action.
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function LandingPage() {
  return (
    <div className="-mt-8 overflow-hidden rounded-[36px] border border-white/40 bg-[linear-gradient(135deg,rgba(8,47,73,0.78)_0%,rgba(15,118,110,0.68)_38%,rgba(239,246,255,0.9)_100%)] shadow-[0_30px_120px_rgba(15,23,42,0.14)]">
      <section className="relative px-8 py-16 sm:px-12 lg:px-16 lg:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.16),transparent_26%)]" />
        <div className="relative grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="max-w-3xl">
            <div className="inline-flex rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-white/90 backdrop-blur">
              Leeds Final Project
            </div>
            <h1 className="mt-6 max-w-4xl font-serif text-4xl leading-tight text-white sm:text-5xl lg:text-6xl">
              Design and Development of a Modular Web Application for THz Quantum Cascade Laser Characterisation.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-100/92 sm:text-lg">
              This website carries the original desktop logic into a cleaner browser workflow for setup, measurement
              data upload, visualization, and report generation.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/project"
                className={cn(
                  "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition",
                  "bg-white text-slate-950 hover:bg-slate-100",
                )}
              >
                Project
              </Link>
              <Link
                to="/about"
                className={cn(
                  "inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-semibold transition",
                  "border-white/55 bg-white/10 text-white hover:bg-white/18",
                )}
              >
                Read About
              </Link>
            </div>
          </div>

          <div className="grid gap-4 text-slate-950">
            <div className="rounded-[28px] border border-white/45 bg-white/88 p-6 backdrop-blur">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Core flow</div>
              <div className="mt-4 grid gap-3 text-sm leading-7 text-slate-700">
                <div>Setup parameters and device metadata</div>
                <div>Pulsed and CW measurement configuration</div>
                <div>LIV and FTIR file upload with trace assignment</div>
                <div>Interactive plots and LaTeX-style report generation</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
