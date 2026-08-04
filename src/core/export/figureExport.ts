// Plot exports are generated here so both the report and manual downloads reuse them.
import Plotly from "plotly.js-dist-min";
import { createLivReportPlotConfig, createSpectraReportPlotConfig } from "@/core/plotting/reportPlotConfig";
import type { ProcessedLivResult, ProcessedSpectraResult } from "@/types/contracts";

const plotlyApi = Plotly as {
  newPlot: (element: HTMLDivElement, data: Record<string, unknown>[], layout: Record<string, unknown>, config?: Record<string, unknown>) => Promise<void>;
  toImage: (element: HTMLDivElement, options: Record<string, unknown>) => Promise<string>;
  purge: (element: HTMLDivElement) => void;
};

type PlotArtifact = {
  fileName: string;
  kind: "liv" | "spectra";
  result: ProcessedLivResult | ProcessedSpectraResult;
};

type FigureFormat = "png" | "svg" | "pdf";
type FigureBlobArtifact = {
  fileName: string;
  blob: Blob;
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

async function saveBlob(blob: Blob, fileName: string, mimeType: string) {
  const pickerWindow = window as SaveFilePickerWindow;
  if (typeof pickerWindow.showSaveFilePicker === "function") {
    const extension = fileName.split(".").pop() ?? "";
    const handle = await pickerWindow.showSaveFilePicker({
      suggestedName: fileName,
      types: [
        {
          description: `${extension.toUpperCase()} file`,
          accept: { [mimeType]: [`.${extension}`] },
        },
      ],
    });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
    return;
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function base64ToUint8Array(base64: string) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function buildSingleImagePdf(jpegBytes: Uint8Array, width: number, height: number) {
  const pdfWidth = Math.max(width * 0.75, 100);
  const pdfHeight = Math.max(height * 0.75, 100);
  const imageObject = 5;
  const contentStream = `q\n${pdfWidth} 0 0 ${pdfHeight} 0 0 cm\n/Im0 Do\nQ\n`;
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n",
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pdfWidth} ${pdfHeight}] /Resources << /XObject << /Im0 ${imageObject} 0 R >> >> /Contents 4 0 R >>\nendobj\n`,
    `4 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream\nendobj\n`,
  ];

  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [encoder.encode("%PDF-1.4\n")];
  const offsets = [0];
  let length = chunks[0].length;

  for (const object of objects) {
    offsets.push(length);
    const bytes = encoder.encode(object);
    chunks.push(bytes);
    length += bytes.length;
  }

  offsets.push(length);
  const imageHeader =
    `${imageObject} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${Math.round(width)} /Height ${Math.round(height)} ` +
    `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`;
  const imageFooter = "\nendstream\nendobj\n";
  const imageHeaderBytes = encoder.encode(imageHeader);
  const imageFooterBytes = encoder.encode(imageFooter);
  chunks.push(imageHeaderBytes, jpegBytes, imageFooterBytes);
  length += imageHeaderBytes.length + jpegBytes.length + imageFooterBytes.length;

  const xrefOffset = length;
  const xrefEntries = ["0000000000 65535 f "]
    .concat(offsets.slice(1).map((offset) => `${offset.toString().padStart(10, "0")} 00000 n `))
    .join("\n");
  const xref = `xref\n0 ${offsets.length}\n${xrefEntries}\n`;
  const trailer = `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  chunks.push(encoder.encode(xref), encoder.encode(trailer));

  return new Blob(chunks as BlobPart[], { type: "application/pdf" });
}

async function svgToPdfBlob(svgUrl: string) {
  const image = new Image();
  image.decoding = "async";
  image.src = svgUrl;
  await image.decode();

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(image.width, 1200);
  canvas.height = Math.max(image.height, 800);
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas export is not available in this browser.");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.95);
  const base64 = jpegDataUrl.split(",")[1] ?? "";
  const jpegBytes = base64ToUint8Array(base64);

  return buildSingleImagePdf(jpegBytes, canvas.width, canvas.height);
}

function getFigureArtifacts(livResults: ProcessedLivResult[], spectraResults: ProcessedSpectraResult[]): PlotArtifact[] {
  const artifactNames: Record<string, string> = {
    "Pulsed LIV": "pulsed_liv",
    "Pulsed FTIR - fixed temperature": "pulsed_ftir_vs_I",
    "Pulsed FTIR - fixed current": "pulsed_ftir_vs_T",
    "CW LIV": "cw_liv",
    "CW FTIR - fixed temperature": "cw_ftir_vs_I",
    "CW FTIR - fixed current": "cw_ftir_vs_T",
  };

  return [
    ...livResults
      .filter((result) => artifactNames[result.datasetName])
      .map((result) => ({ fileName: artifactNames[result.datasetName], kind: "liv" as const, result })),
    ...spectraResults
      .filter((result) => artifactNames[result.datasetName])
      .map((result) => ({ fileName: artifactNames[result.datasetName], kind: "spectra" as const, result })),
  ];
}

async function exportArtifact(artifact: PlotArtifact, format: FigureFormat) {
  const blob = await renderArtifactBlob(artifact, format);
  const mimeType = format === "png" ? "image/png" : format === "svg" ? "image/svg+xml" : "application/pdf";
  await saveBlob(blob, `${artifact.fileName}.${format}`, mimeType);
}

async function renderArtifactBlob(artifact: PlotArtifact, format: FigureFormat) {
  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-10000px";
  host.style.top = "0";
  host.style.width = "1200px";
  host.style.height = "800px";
  document.body.appendChild(host);

  try {
    const config =
      artifact.kind === "liv"
        ? createLivReportPlotConfig(artifact.result as ProcessedLivResult)
        : createSpectraReportPlotConfig(artifact.result as ProcessedSpectraResult);

    await plotlyApi.newPlot(host, config.data as Record<string, unknown>[], {
      ...config.layout,
      autosize: false,
      width: 1200,
      height: 800,
      paper_bgcolor: "#ffffff",
      plot_bgcolor: "#ffffff",
    }, { displaylogo: false, responsive: false });

    if (format === "png") {
      const url = await plotlyApi.toImage(host, { format: "png", width: 1200, height: 800, scale: 2 });
      const response = await fetch(url);
      return await response.blob();
    }

    const svgUrl = await plotlyApi.toImage(host, { format: "svg", width: 1200, height: 800, scale: 1 });
    if (format === "svg") {
      const response = await fetch(svgUrl);
      return await response.blob();
    }

    return await svgToPdfBlob(svgUrl);
  } finally {
    plotlyApi.purge(host);
    host.remove();
  }
}

export async function exportFigureSet(
  livResults: ProcessedLivResult[],
  spectraResults: ProcessedSpectraResult[],
  format: FigureFormat,
) {
  const artifacts = getFigureArtifacts(livResults, spectraResults);

  for (const artifact of artifacts) {
    await exportArtifact(artifact, format);
  }
}

export async function buildFigureBlobArtifacts(
  livResults: ProcessedLivResult[],
  spectraResults: ProcessedSpectraResult[],
  format: Exclude<FigureFormat, "svg"> = "pdf",
): Promise<FigureBlobArtifact[]> {
  const artifacts = getFigureArtifacts(livResults, spectraResults);
  const blobs: FigureBlobArtifact[] = [];

  for (const artifact of artifacts) {
    blobs.push({
      fileName: `${artifact.fileName}.${format}`,
      blob: await renderArtifactBlob(artifact, format),
    });
  }

  return blobs;
}
