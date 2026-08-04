// The report screen manages PDF preview, download actions, and section readiness.
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buildBrowserReportPdf, downloadBrowserReportPdf } from "@/core/export/browserPdfReport";
import { exportFigureSet } from "@/core/export/figureExport";
import { compileReportPdfBlob, downloadCompiledPdfReport, downloadLatexReport } from "@/core/export/reportLatex";
import { useProcessedResults } from "@/features/plot-viewer/lib/useProcessedResults";
import { useWizard } from "@/features/wizard/context/WizardContext";

function SectionStatus({ label, ready }: { label: string; ready: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3">
      <span className="font-medium text-[var(--color-ink)]">{label}</span>
      <span className={ready ? "text-sm font-semibold text-emerald-700" : "text-sm font-semibold text-slate-500"}>
        {ready ? "Ready" : "Missing data"}
      </span>
    </div>
  );
}

async function buildPreviewBlob(
  draft: ReturnType<typeof useWizard>["draft"],
  livResults: ReturnType<typeof useProcessedResults>["livResults"],
  spectraResults: ReturnType<typeof useProcessedResults>["spectraResults"],
) {
  try {
    const latexResult = await compileReportPdfBlob(draft, { livResults, spectraResults });
    return latexResult.blob;
  } catch (latexError) {
    // If LaTeX compilation is unavailable, keep the preview alive with the browser renderer.
    console.warn("LaTeX API preview failed, using browser PDF preview.", latexError);
    const browserResult = await buildBrowserReportPdf(draft, { livResults, spectraResults });
    return browserResult.blob;
  }
}

export function ReportSummaryPanel() {
  const { draft } = useWizard();
  const { livResults, spectraResults } = useProcessedResults();
  const [isCompilingPdf, setIsCompilingPdf] = useState(false);
  const [isRenderingPreview, setIsRenderingPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const currentReportDate = useMemo(() => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = String(now.getFullYear());
    return `${day}-${month}-${year}`;
  }, []);

  async function handlePdfDownload() {
    setIsCompilingPdf(true);
    try {
      try {
        await downloadCompiledPdfReport(draft, { livResults, spectraResults });
      } catch (latexError) {
        // Download follows the same fallback path as the preview.
        console.warn("Falling back to browser PDF generation.", latexError);
        await downloadBrowserReportPdf(draft, { livResults, spectraResults });
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Failed to compile PDF report.");
    } finally {
      setIsCompilingPdf(false);
    }
  }

  async function renderPdfPreview() {
    setIsRenderingPreview(true);
    setPreviewError(null);

    try {
      const blob = await buildPreviewBlob(draft, livResults, spectraResults);
      const nextUrl = URL.createObjectURL(blob);
      setPreviewUrl((currentUrl) => {
        if (currentUrl) {
          URL.revokeObjectURL(currentUrl);
        }
        return nextUrl;
      });
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : "Failed to render PDF preview.");
    } finally {
      setIsRenderingPreview(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsRenderingPreview(true);
      setPreviewError(null);

      void buildPreviewBlob(draft, livResults, spectraResults)
        .then((blob) => {
          const nextUrl = URL.createObjectURL(blob);
          setPreviewUrl((currentUrl) => {
            // Revoke the previous blob URL so preview refreshes do not leak memory.
            if (currentUrl) {
              URL.revokeObjectURL(currentUrl);
            }
            return nextUrl;
          });
        })
        .catch((error) => {
          setPreviewError(error instanceof Error ? error.message : "Failed to render PDF preview.");
        })
        .finally(() => {
          setIsRenderingPreview(false);
        });
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [draft, livResults, spectraResults]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const sectionStates = [
    { label: "Performance Summary", ready: true },
    { label: "Pulsed LIV", ready: livResults.some((result) => result.datasetName === "Pulsed LIV") },
    {
      label: "Pulsed FTIR - fixed temperature",
      ready: spectraResults.some((result) => result.datasetName === "Pulsed FTIR - fixed temperature"),
    },
    {
      label: "Pulsed FTIR - fixed current",
      ready: spectraResults.some((result) => result.datasetName === "Pulsed FTIR - fixed current"),
    },
    { label: "CW LIV", ready: livResults.some((result) => result.datasetName === "CW LIV") },
    {
      label: "CW FTIR - fixed temperature",
      ready: spectraResults.some((result) => result.datasetName === "CW FTIR - fixed temperature"),
    },
    {
      label: "CW FTIR - fixed current",
      ready: spectraResults.some((result) => result.datasetName === "CW FTIR - fixed current"),
    },
  ];

  return (
    <div className="grid gap-6">
      <Card className="bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_55%,#f0fdfa_100%)]">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold">Report Generation</h2>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={() => void handlePdfDownload()} disabled={isCompilingPdf}>
                {isCompilingPdf ? "Compiling PDF..." : "Download PDF"}
              </Button>
              <Button variant="outline" onClick={() => downloadLatexReport(draft, { livResults, spectraResults })}>
                Export TEX
              </Button>
              <Button variant="outline" onClick={() => void renderPdfPreview()} disabled={isRenderingPreview}>
                {isRenderingPreview ? "Rendering preview..." : "Refresh PDF Preview"}
              </Button>
              <Button variant="outline" onClick={() => void exportFigureSet(livResults, spectraResults, "png")}>
                Export Plot PNGs
              </Button>
              <Button variant="outline" onClick={() => void exportFigureSet(livResults, spectraResults, "pdf")}>
                Export Plot PDFs
              </Button>
            </div>
          </div>
          <div className="grid min-w-[260px] gap-2 text-sm text-[var(--color-slate)] sm:text-right">
            <p><strong className="text-[var(--color-ink)]">Author:</strong> {draft.projectMetadata.author || "Unspecified"}</p>
            <p><strong className="text-[var(--color-ink)]">Date:</strong> {currentReportDate}</p>
            <p><strong className="text-[var(--color-ink)]">Wafer:</strong> {draft.projectMetadata.device.waferNumber || "Unspecified"}</p>
            <p><strong className="text-[var(--color-ink)]">Device:</strong> {draft.projectMetadata.device.deviceName || "Unspecified"}</p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap gap-3">
          {sectionStates.map((section) => (
            <div key={section.label} className="min-w-[210px] flex-1">
              <SectionStatus label={section.label} ready={section.ready} />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="border-b border-[var(--color-line)] bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_55%,#f0fdfa_100%)] px-6 py-4">
          <h3 className="text-lg font-semibold">PDF Viewer</h3>
        </div>
        <div className="bg-white">
          {previewError ? (
            <div className="flex min-h-[75vh] items-center justify-center p-6 text-center text-sm text-rose-700">
              {previewError}
            </div>
          ) : previewUrl ? (
            <iframe
              title="Rendered PDF preview"
              src={`${previewUrl}#toolbar=1&navpanes=0&view=FitH`}
              className="min-h-[82vh] w-full bg-white"
            />
          ) : (
            <div className="flex min-h-[75vh] items-center justify-center p-6 text-sm text-[var(--color-slate)]">
              {isRenderingPreview ? "Rendering report preview..." : "No preview available yet."}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
