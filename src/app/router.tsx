// All public pages and wizard routes are declared in one place here.
// All public pages and wizard routes are declared in one place here.
import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { LandingPage } from "@/pages/LandingPage";
import { AboutPage } from "@/pages/AboutPage";
import { ProjectPage } from "@/pages/ProjectPage";

const SetupPage = lazy(() => import("@/pages/SetupPage").then((module) => ({ default: module.SetupPage })));
const MeasurementPulsedPage = lazy(() =>
  import("@/pages/MeasurementPulsedPage").then((module) => ({ default: module.MeasurementPulsedPage })),
);
const MeasurementCwPage = lazy(() =>
  import("@/pages/MeasurementCwPage").then((module) => ({ default: module.MeasurementCwPage })),
);
const FilesPage = lazy(() => import("@/pages/FilesPage").then((module) => ({ default: module.FilesPage })));
const ResultsPage = lazy(() => import("@/pages/ResultsPage").then((module) => ({ default: module.ResultsPage })));
const ReportPage = lazy(() => import("@/pages/ReportPage").then((module) => ({ default: module.ReportPage })));

function PageLoader() {
  return <div className="rounded-2xl border border-[var(--color-line)] bg-white/80 p-6">Loading page...</div>;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<LandingPage />} />
            <Route path="project" element={<ProjectPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="wizard/setup" element={<SetupPage />} />
            <Route path="wizard/measurement-pulsed" element={<MeasurementPulsedPage />} />
            <Route path="wizard/measurement-cw" element={<MeasurementCwPage />} />
            <Route path="wizard/files/pulsed-liv" element={<FilesPage kind="pulsedLiv" />} />
            <Route
              path="wizard/files/pulsed-ftir-fixed-temperature"
              element={<FilesPage kind="pulsedSpectraFixedTemperature" />}
            />
            <Route
              path="wizard/files/pulsed-ftir-fixed-current"
              element={<FilesPage kind="pulsedSpectraFixedCurrent" />}
            />
            <Route path="wizard/files/cw-liv" element={<FilesPage kind="cwLiv" />} />
            <Route
              path="wizard/files/cw-ftir-fixed-temperature"
              element={<FilesPage kind="cwSpectraFixedTemperature" />}
            />
            <Route
              path="wizard/files/cw-ftir-fixed-current"
              element={<FilesPage kind="cwSpectraFixedCurrent" />}
            />
            <Route path="results" element={<ResultsPage />} />
            <Route path="report" element={<ReportPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
