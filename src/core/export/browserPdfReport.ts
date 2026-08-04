// Browser-side PDF generation lives here when the local LaTeX route is not used.
import { jsPDF } from "jspdf";
import { buildFigureBlobArtifacts } from "@/core/export/figureExport";
import type { ProcessedLivResult, ProcessedSpectraResult, WizardDraft } from "@/types/contracts";

type ReportArtifacts = {
  livResults: ProcessedLivResult[];
  spectraResults: ProcessedSpectraResult[];
};

type GeneratedBrowserReport = {
  blob: Blob;
  fileName: string;
};

type SaveFilePickerWindow = Window & {
  showSaveFilePicker?: (options?: {
    suggestedName?: string;
    types?: Array<{
      description?: string;
      accept: Record<string, string[]>;
    }>;
  }) => Promise<{
    createWritable: () => Promise<{
      write: (data: Blob) => Promise<void>;
      close: () => Promise<void>;
    }>;
  }>;
};

function getCurrentReportDate() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear());
  return `${day}-${month}-${year}`;
}

function sanitizeStem(value: string) {
  return value.trim().replace(/[^A-Za-z0-9._-]/g, "_");
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read image blob."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}

function addWrappedText(pdf: jsPDF, text: string, x: number, y: number, maxWidth: number, lineHeight = 6) {
  const lines = pdf.splitTextToSize(text, maxWidth);
  pdf.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function addLabelValue(pdf: jsPDF, label: string, value: string, x: number, y: number, maxWidth: number) {
  pdf.setFont("helvetica", "bold");
  pdf.text(label, x, y);
  pdf.setFont("helvetica", "normal");
  return addWrappedText(pdf, value, x + 38, y, maxWidth - 38);
}

function getFigureLabel(fileName: string) {
  const labels: Record<string, string> = {
    "pulsed_liv.png": "Pulsed LIV",
    "pulsed_ftir_vs_I.png": "Pulsed FTIR - fixed temperature",
    "pulsed_ftir_vs_T.png": "Pulsed FTIR - fixed current",
    "cw_liv.png": "CW LIV",
    "cw_ftir_vs_I.png": "CW FTIR - fixed temperature",
    "cw_ftir_vs_T.png": "CW FTIR - fixed current",
  };

  return labels[fileName] ?? fileName.replace(/_/g, " ").replace(/\.png$/i, "");
}

export async function buildBrowserReportPdf(
  draft: WizardDraft,
  artifacts: ReportArtifacts,
): Promise<GeneratedBrowserReport> {
  const waferNumber = draft.projectMetadata.device.waferNumber.trim() || "qcl-report";
  const deviceName = draft.projectMetadata.device.deviceName.trim() || "device";
  const fileName = `${sanitizeStem(waferNumber)}_${sanitizeStem(deviceName)}.pdf`;
  const figures = await buildFigureBlobArtifacts(artifacts.livResults, artifacts.spectraResults, "png");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  pdf.setTextColor(12, 20, 42);
  pdf.setFont("times", "bold");
  pdf.setFontSize(24);
  pdf.text("THz Quantum Cascade Laser Characterisation", margin, 35);
  pdf.setFontSize(18);
  pdf.text("Device Datasheet", margin, 48);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  let y = 68;
  y = addLabelValue(pdf, "Author", draft.projectMetadata.author || "Unspecified", margin, y, contentWidth);
  y = addLabelValue(pdf, "Date", getCurrentReportDate(), margin, y + 3, contentWidth);
  y = addLabelValue(pdf, "Wafer", draft.projectMetadata.device.waferNumber || "Unspecified", margin, y + 3, contentWidth);
  y = addLabelValue(pdf, "Device", draft.projectMetadata.device.deviceName || "Unspecified", margin, y + 3, contentWidth);
  y = addLabelValue(pdf, "Design", draft.projectMetadata.device.design || "Unspecified", margin, y + 3, contentWidth);
  y = addLabelValue(pdf, "Waveguide", draft.projectMetadata.device.waveguide || "Unspecified", margin, y + 3, contentWidth);
  y = addLabelValue(
    pdf,
    "Dimensions",
    `${draft.projectMetadata.device.dimensions.length || 0} mm x ${draft.projectMetadata.device.dimensions.width || 0} um x ${draft.projectMetadata.device.dimensions.height || 0} um`,
    margin,
    y + 3,
    contentWidth,
  );

  y += 10;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.text("Included plots", margin, y);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  y += 8;

  if (figures.length === 0) {
    pdf.text("No plot figures available yet.", margin, y);
  } else {
    // The first page acts like a cover plus a quick contents list.
    for (const figure of figures) {
      y = addWrappedText(pdf, `- ${getFigureLabel(figure.fileName)}`, margin, y, contentWidth, 6);
    }
  }

  for (const figure of figures) {
    // Each figure gets its own page so the export stays readable when printed.
    pdf.addPage();
    pdf.setTextColor(12, 20, 42);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text(getFigureLabel(figure.fileName), margin, 18);

    const imageUrl = await blobToDataUrl(figure.blob);
    const imageWidth = contentWidth;
    const imageHeight = Math.min(pageHeight - 38, imageWidth * 0.72);
    pdf.addImage(imageUrl, "PNG", margin, 28, imageWidth, imageHeight, undefined, "FAST");
  }

  return {
    blob: pdf.output("blob"),
    fileName,
  };
}

export async function downloadBrowserReportPdf(draft: WizardDraft, artifacts: ReportArtifacts) {
  const { blob, fileName } = await buildBrowserReportPdf(draft, artifacts);
  const pickerWindow = window as SaveFilePickerWindow;

  if (typeof pickerWindow.showSaveFilePicker === "function") {
    const handle = await pickerWindow.showSaveFilePicker({
      suggestedName: fileName,
      types: [
        {
          description: "PDF file",
          accept: { "application/pdf": [".pdf"] },
        },
      ],
    });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
    return;
  }

  // Fallback for browsers without the file picker API.
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
