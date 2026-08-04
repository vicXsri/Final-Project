// The report LaTeX source, export bundle, and PDF compilation helpers live here.
import JSZip from "jszip";
import { formatNumber } from "@/lib/utils";
import type { ProcessedLivResult, ProcessedSpectraResult, WizardDraft } from "@/types/contracts";

type ReportArtifacts = {
  livResults: ProcessedLivResult[];
  spectraResults: ProcessedSpectraResult[];
};

const LATEX_ONLINE_ENDPOINT = "https://texlive2020.latexonline.cc/data";
const LATEX_ONLINE_TIMEOUT_MS = 120000;

function getCurrentReportDate() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear());
  return `${day}-${month}-${year}`;
}

function escapeLatex(value: string) {
  // LaTeX is picky, so text values need to be escaped before they are injected.
  return value
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/{/g, "\\{")
    .replace(/}/g, "\\}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}")
    .replace(/\r?\n/g, " ")
    .trim();
}

function texValue(value: string | number | undefined | null, fallback = "N/A") {
  if (value === undefined || value === null) {
    return fallback;
  }

  const normalized = String(value).trim();
  return normalized === "" ? fallback : escapeLatex(normalized);
}

function texLine(label: string, value: string) {
  return `\\textbf{${escapeLatex(label)}} & ${value} \\\\\n\\hline\n`;
}

function measurementTable(rows: Array<[string, string]>) {
  return [
    "\\begin{tabularx}{\\textwidth}{|X|X|}",
    "\\hline",
    ...rows.map(([label, value]) => texLine(label, value)),
    "\\end{tabularx}",
    "\\vspace{0.5cm}",
    "",
  ].join("\n");
}

function formatNotes(notes: string) {
  const trimmed = notes.trim();
  if (!trimmed) {
    return "";
  }

  return [
    "\\vspace{0.5cm}",
    "\\subsubsection*{Experimental Notes}",
    escapeLatex(trimmed),
    "",
  ].join("\n");
}

function combineNotes(first: string, second: string) {
  const firstTrimmed = first.trim();
  const secondTrimmed = second.trim();

  if (firstTrimmed && secondTrimmed) {
    return `a) ${firstTrimmed}\n\nb) ${secondTrimmed}`;
  }

  return firstTrimmed || secondTrimmed;
}

function getSpectraRange(result: ProcessedSpectraResult | undefined) {
  if (!result) {
    return "N/A";
  }

  return `${formatNumber(result.frequencyRange.min, 3)} THz - ${formatNumber(result.frequencyRange.max, 3)} THz`;
}

function hasDataset(items: Array<{ datasetName: string }>, datasetName: string) {
  return items.some((item) => item.datasetName === datasetName);
}

function hasFigure(figureNames: Set<string>, figureName: string) {
  return figureNames.has(`${figureName}.pdf`) || figureNames.has(`${figureName}.png`);
}

function includeFigure(figureBaseName: string, width = "0.7\\textwidth", figureDirectory = "../Figures") {
  return [
    `\\IfFileExists{${figureDirectory}/${figureBaseName}.pdf}{`,
    `\\includegraphics[width=${width}]{${figureDirectory}/${figureBaseName}.pdf}`,
    `}{\\includegraphics[width=${width}]{${figureDirectory}/${figureBaseName}.png}}`,
  ].join("\n");
}

function toTarOctal(value: number, length: number) {
  const octal = value.toString(8);
  return `${octal}`.padStart(length - 1, "0").slice(-(length - 1)) + "\0";
}

function writeAscii(target: Uint8Array, offset: number, length: number, value: string) {
  const encoded = new TextEncoder().encode(value);
  target.set(encoded.slice(0, length), offset);
}

function createTarEntry(name: string, data: Uint8Array) {
  // The public API wants a tar upload, so we build the archive manually.
  const header = new Uint8Array(512);
  writeAscii(header, 0, 100, name);
  writeAscii(header, 100, 8, "0000777\0");
  writeAscii(header, 108, 8, "0000000\0");
  writeAscii(header, 116, 8, "0000000\0");
  writeAscii(header, 124, 12, toTarOctal(data.byteLength, 12));
  writeAscii(header, 136, 12, toTarOctal(Math.floor(Date.now() / 1000), 12));

  for (let index = 148; index < 156; index += 1) {
    header[index] = 32;
  }

  header[156] = "0".charCodeAt(0);
  writeAscii(header, 257, 6, "ustar\0");
  writeAscii(header, 263, 2, "00");

  let checksum = 0;
  for (const byte of header) {
    checksum += byte;
  }

  writeAscii(header, 148, 8, `${checksum.toString(8).padStart(6, "0")}\0 `);

  const padding = (512 - (data.byteLength % 512)) % 512;
  const entry = new Uint8Array(512 + data.byteLength + padding);
  entry.set(header, 0);
  entry.set(data, 512);
  return entry;
}

function buildTarArchive(files: Array<{ name: string; data: Uint8Array }>) {
  const entries = files.map((file) => createTarEntry(file.name, file.data));
  const totalLength = entries.reduce((sum, entry) => sum + entry.byteLength, 0) + 1024;
  const archive = new Uint8Array(totalLength);

  let offset = 0;
  for (const entry of entries) {
    archive.set(entry, offset);
    offset += entry.byteLength;
  }

  return new Blob([archive], { type: "application/x-tar" });
}

async function buildLatexCompilationPayload(draft: WizardDraft, artifacts: ReportArtifacts) {
  const waferNumber = draft.projectMetadata.device.waferNumber.trim() || "qcl-report";
  const deviceName = draft.projectMetadata.device.deviceName.trim() || "device";
  const safeWafer = waferNumber.replace(/[^A-Za-z0-9._-]/g, "_");
  const safeDevice = deviceName.replace(/[^A-Za-z0-9._-]/g, "_");
  const fileStem = `${safeWafer}_${safeDevice}`;
  const mainFileName = `${fileStem}.tex`;
  const { buildFigureBlobArtifacts } = await import("@/core/export/figureExport");
  const figures = await buildFigureBlobArtifacts(artifacts.livResults, artifacts.spectraResults, "pdf");
  const texSource = buildDesktopStyleReportLatex(
    draft,
    artifacts,
    figures.map((figure) => figure.fileName),
    "Figures",
  );

  const tarFiles = [
    {
      name: mainFileName,
      data: new TextEncoder().encode(texSource),
    },
    // Figures travel with the TEX source so the remote compiler sees the same report assets.
    ...(await Promise.all(
      figures.map(async (figure) => ({
        name: `Figures/${figure.fileName}`,
        data: new Uint8Array(await figure.blob.arrayBuffer()),
      })),
    )),
  ];

  return {
    fileStem,
    tarBlob: buildTarArchive(tarFiles),
  };
}

function buildPerformanceSummary(draft: WizardDraft, artifacts: ReportArtifacts) {
  const device = draft.projectMetadata.device;
  const reportDate = getCurrentReportDate();
  const dimensions = `$${formatNumber(device.dimensions.length, 1)}~\\mathrm{mm}~\\times~${formatNumber(device.dimensions.width, 0)}~\\mathrm{\\mu m}~\\times~${formatNumber(device.dimensions.height, 0)}~\\mathrm{\\mu m}$`;
  const pulsedPower =
    draft.measurementSetup.pulsed.powerScale === 100
      ? "N/A"
      : `$${formatNumber(draft.measurementSetup.pulsed.powerScale, 0)}~\\mathrm{mW}~(${texValue(draft.measurementSetup.pulsed.dutyCycle, "N/A")}\\%~\\mathrm{d.c.},~20~\\mathrm{K})$`;
  const cwPower =
    draft.measurementSetup.cw.powerScale === 100
      ? "N/A"
      : `$${formatNumber(draft.measurementSetup.cw.powerScale, 0)}~\\mathrm{mW}~(20~\\mathrm{K})$`;

  const pulsedFixedTemp = artifacts.spectraResults.find((result) => result.datasetName === "Pulsed FTIR - fixed temperature");
  const cwFixedTemp = artifacts.spectraResults.find((result) => result.datasetName === "CW FTIR - fixed temperature");

  return [
    "\\section*{Performance Summary}",
    "\\begin{tabularx}{\\textwidth}{|>{\\raggedright\\arraybackslash}p{0.6\\textwidth}|X|}",
    "\\hline",
    texLine("Characterised by:", texValue(draft.projectMetadata.author)),
    texLine("Date of completion:", texValue(reportDate)),
    texLine("Wafer number:", texValue(device.waferNumber)),
    texLine("Heterostructure design:", texValue(device.design)),
    texLine("Approx. Emission Freq.:", device.approxEmissionFrequencyThz ? `${formatNumber(device.approxEmissionFrequencyThz, 3)} [THz]` : "N/A~"),
    texLine("Ridge dimensions:", dimensions),
    texLine("Peak output power (pulsed):", pulsedPower),
    texLine("Emission frequency range (pulsed):", getSpectraRange(pulsedFixedTemp)),
    texLine(
      "Maximum operating temperature (pulsed):",
      draft.measurementSetup.pulsed.tMax
        ? `$${formatNumber(draft.measurementSetup.pulsed.tMax, 0)}~\\mathrm{K}~(${texValue(draft.measurementSetup.pulsed.dutyCycle, "N/A")}\\%~\\mathrm{d.c.})$`
        : "N/A",
    ),
    texLine("Peak output power (c.w.):", cwPower),
    texLine("Emission frequency range (c.w.):", getSpectraRange(cwFixedTemp)),
    texLine(
      "Maximum operating temperature (c.w.):",
      draft.measurementSetup.cw.tMax ? `$${formatNumber(draft.measurementSetup.cw.tMax, 0)}~\\mathrm{K}$` : "N/A",
    ),
    "\\end{tabularx}",
    "\\clearpage",
    "",
  ].join("\n");
}

function buildPulsedLivSection(
  draft: WizardDraft,
  artifacts: ReportArtifacts,
  figureNames: Set<string>,
  figureDirectory: string,
) {
  if (!hasDataset(artifacts.livResults, "Pulsed LIV")) {
    return "";
  }

  const pulsed = draft.measurementSetup.pulsed;
  const rows: Array<[string, string]> = [
    ["Cryostat:", texValue(pulsed.cryostat)],
    ["Detector:", texValue(pulsed.livDetector)],
    ["Power Supply:", texValue(pulsed.powerSupply)],
    ["Drive Frequency:", pulsed.driveFrequency ? `${formatNumber(pulsed.driveFrequency, 0)} kHz` : "N/A"],
    ["Duty Cycle:", pulsed.dutyCycle ? formatNumber(pulsed.dutyCycle, 0) : "N/A"],
    ["Gate Frequency:", pulsed.gateFrequency ? `${formatNumber(pulsed.gateFrequency, 0)} Hz` : "N/A"],
    ["Power Scale:", pulsed.powerScale === 100 ? "N/A" : `${formatNumber(pulsed.powerScale, 0)} mW`],
  ];

  if (pulsed.tMax) {
    rows.push(["Max Temperature:", `${formatNumber(pulsed.tMax, 0)} K`]);
  }

  const hasLivFigure = hasFigure(figureNames, "pulsed_liv");
  const figureBlock = hasLivFigure
    ? [
        "\\begin{figure}[h!]",
        "\\centering",
        includeFigure("pulsed_liv", "0.7\\textwidth", figureDirectory),
        "\\caption{\\small Pulsed L-I-V characteristics driven by "
          + `${formatNumber(pulsed.driveFrequency ?? 0, 0)}\\,kHz, ${formatNumber(pulsed.dutyCycle ?? 0, 0)}\\% duty cycle pulses gated by a ${formatNumber(pulsed.gateFrequency ?? 0, 0)}\\,Hz square-wave.}`,
        "\\end{figure}",
        "",
      ].join("\n")
    : "";

  return [
    "\\subsection*{L-I-V Characteristics}",
    measurementTable(rows),
    figureBlock,
    formatNotes(draft.traceAssignments.pulsedLiv.notes),
    "\\clearpage",
    "",
  ].join("\n");
}

function buildPulsedSpectraSection(
  draft: WizardDraft,
  artifacts: ReportArtifacts,
  figureNames: Set<string>,
  figureDirectory: string,
) {
  const hasFixedTemperature = hasDataset(artifacts.spectraResults, "Pulsed FTIR - fixed temperature");
  const hasFixedCurrent = hasDataset(artifacts.spectraResults, "Pulsed FTIR - fixed current");

  if (!hasFixedTemperature && !hasFixedCurrent) {
    return "";
  }

  const pulsed = draft.measurementSetup.pulsed;
  const hasVsI = hasFixedTemperature && hasFigure(figureNames, "pulsed_ftir_vs_I");
  const hasVsT = hasFixedCurrent && hasFigure(figureNames, "pulsed_ftir_vs_T");
  const figureBlock =
    hasVsI && hasVsT
      ? [
          "\\begin{figure}[h!]",
          "\\centering",
          "\\begin{subfigure}{0.48\\textwidth}",
          includeFigure("pulsed_ftir_vs_I", "\\linewidth", figureDirectory),
          `\\caption{\\small Spectra at different currents (at T = ${formatNumber(pulsed.tFix ?? 20, 0)} K).}`,
          "\\end{subfigure}",
          "\\hfill",
          "\\begin{subfigure}{0.48\\textwidth}",
          includeFigure("pulsed_ftir_vs_T", "\\linewidth", figureDirectory),
          "\\caption{\\small Spectra at different temperatures.}",
          "\\end{subfigure}",
          `\\caption{\\small Pulsed FTIR emission spectra driven by ${formatNumber(pulsed.driveFrequency ?? 0, 0)}\\,kHz, ${formatNumber(pulsed.dutyCycle ?? 0, 0)}\\% duty cycle pulses gated by a ${formatNumber(pulsed.gateFrequency ?? 0, 0)}\\,Hz square-wave.}`,
          "\\end{figure}",
          "",
        ].join("\n")
      : hasVsI
        ? [
            "\\begin{figure}[h!]",
            "\\centering",
            includeFigure("pulsed_ftir_vs_I", "0.7\\textwidth", figureDirectory),
            `\\caption{\\small Pulsed FTIR emission spectra driven by ${formatNumber(pulsed.driveFrequency ?? 0, 0)}\\,kHz, ${formatNumber(pulsed.dutyCycle ?? 0, 0)}\\% duty cycle pulses gated by a ${formatNumber(pulsed.gateFrequency ?? 0, 0)}\\,Hz square-wave. Spectra at different currents (at T = ${formatNumber(pulsed.tFix ?? 20, 0)} K).}`,
            "\\end{figure}",
            "",
          ].join("\n")
        : hasVsT
          ? [
              "\\begin{figure}[h!]",
              "\\centering",
              includeFigure("pulsed_ftir_vs_T", "0.7\\textwidth", figureDirectory),
              `\\caption{\\small Pulsed FTIR emission spectra driven by ${formatNumber(pulsed.driveFrequency ?? 0, 0)}\\,kHz, ${formatNumber(pulsed.dutyCycle ?? 0, 0)}\\% duty cycle pulses gated by a ${formatNumber(pulsed.gateFrequency ?? 0, 0)}\\,Hz square-wave. Spectra at different temperatures.}`,
              "\\end{figure}",
              "",
            ].join("\n")
          : "";

  return [
    "\\subsection*{Spectra Characteristics}",
    measurementTable([
      ["Cryostat:", texValue(pulsed.cryostat)],
      ["Detector:", texValue(pulsed.spectraDetector)],
      ["Spectrometer:", texValue(pulsed.spectrometer)],
      ["Power Supply:", texValue(pulsed.powerSupply)],
      ["Drive Frequency:", pulsed.driveFrequency ? `${formatNumber(pulsed.driveFrequency, 0)} kHz` : "N/A"],
      ["Duty Cycle:", pulsed.dutyCycle ? formatNumber(pulsed.dutyCycle, 0) : "N/A"],
      ["Gate Frequency:", pulsed.gateFrequency ? `${formatNumber(pulsed.gateFrequency, 0)} Hz` : "N/A"],
    ]),
    figureBlock,
    formatNotes(
      combineNotes(
        draft.traceAssignments.pulsedSpectraFixedTemperature.notes,
        draft.traceAssignments.pulsedSpectraFixedCurrent.notes,
      ),
    ),
    "\\clearpage",
    "",
  ].join("\n");
}

function buildCwLivSection(
  draft: WizardDraft,
  artifacts: ReportArtifacts,
  figureNames: Set<string>,
  figureDirectory: string,
) {
  if (!hasDataset(artifacts.livResults, "CW LIV")) {
    return "";
  }

  const cw = draft.measurementSetup.cw;
  const rows: Array<[string, string]> = [
    ["Cryostat:", texValue(cw.cryostat)],
    ["Detector:", texValue(cw.livDetector)],
    ["Power Supply:", texValue(cw.powerSupply)],
    ["Power Scale:", cw.powerScale === 100 ? "N/A" : `${formatNumber(cw.powerScale, 0)} mW`],
  ];

  if (cw.tMax) {
    rows.push(["Max Temperature:", `${formatNumber(cw.tMax, 0)} K`]);
  }

  const hasLivFigure = hasFigure(figureNames, "cw_liv");
  const figureBlock = hasLivFigure
    ? [
        "\\begin{figure}[h!]",
        "\\centering",
        includeFigure("cw_liv", "0.7\\textwidth", figureDirectory),
        "\\caption{\\small CW L-I-V characteristics.}",
        "\\end{figure}",
        "",
      ].join("\n")
    : "";

  return [
    "\\subsection*{L-I-V Characteristics}",
    measurementTable(rows),
    figureBlock,
    formatNotes(draft.traceAssignments.cwLiv.notes),
    "\\clearpage",
    "",
  ].join("\n");
}

function buildCwSpectraSection(
  draft: WizardDraft,
  artifacts: ReportArtifacts,
  figureNames: Set<string>,
  figureDirectory: string,
) {
  const hasFixedTemperature = hasDataset(artifacts.spectraResults, "CW FTIR - fixed temperature");
  const hasFixedCurrent = hasDataset(artifacts.spectraResults, "CW FTIR - fixed current");

  if (!hasFixedTemperature && !hasFixedCurrent) {
    return "";
  }

  const cw = draft.measurementSetup.cw;
  const hasVsI = hasFixedTemperature && hasFigure(figureNames, "cw_ftir_vs_I");
  const hasVsT = hasFixedCurrent && hasFigure(figureNames, "cw_ftir_vs_T");
  const figureBlock =
    hasVsI && hasVsT
      ? [
          "\\begin{figure}[h!]",
          "\\centering",
          "\\begin{subfigure}{0.48\\textwidth}",
          includeFigure("cw_ftir_vs_I", "\\linewidth", figureDirectory),
          `\\caption{\\small Spectra at different currents (at T = ${formatNumber(cw.tFix ?? 20, 0)} K).}`,
          "\\end{subfigure}",
          "\\hfill",
          "\\begin{subfigure}{0.48\\textwidth}",
          includeFigure("cw_ftir_vs_T", "\\linewidth", figureDirectory),
          "\\caption{\\small Spectra at different temperatures.}",
          "\\end{subfigure}",
          "\\caption{\\small CW FTIR emission spectra.}",
          "\\end{figure}",
          "",
        ].join("\n")
      : hasVsI
        ? [
            "\\begin{figure}[h!]",
            "\\centering",
            includeFigure("cw_ftir_vs_I", "0.7\\textwidth", figureDirectory),
            `\\caption{\\small CW FTIR emission spectra. Spectra at different currents (at T = ${formatNumber(cw.tFix ?? 20, 0)} K).}`,
            "\\end{figure}",
            "",
          ].join("\n")
        : hasVsT
          ? [
              "\\begin{figure}[h!]",
              "\\centering",
              includeFigure("cw_ftir_vs_T", "0.7\\textwidth", figureDirectory),
              "\\caption{\\small CW FTIR emission spectra. Spectra at different temperatures.}",
              "\\end{figure}",
              "",
            ].join("\n")
          : "";

  return [
    "\\subsection*{Spectra Characteristics}",
    measurementTable([
      ["Cryostat:", texValue(cw.cryostat)],
      ["Detector:", texValue(cw.spectraDetector)],
      ["Spectrometer:", texValue(cw.spectrometer)],
      ["Power Supply:", texValue(cw.powerSupply)],
    ]),
    figureBlock,
    formatNotes(
      combineNotes(
        draft.traceAssignments.cwSpectraFixedTemperature.notes,
        draft.traceAssignments.cwSpectraFixedCurrent.notes,
      ),
    ),
    "\\clearpage",
    "",
  ].join("\n");
}

function buildSection(title: string, content: string[]) {
  const filtered = content.filter(Boolean);
  if (filtered.length === 0) {
    return "";
  }

  return [`\\section*{${title}}`, ...filtered, ""].join("\n");
}

export function buildDesktopStyleReportLatex(
  draft: WizardDraft,
  artifacts: ReportArtifacts,
  figureFileNames: string[] = [],
  figureDirectory = "../Figures",
) {
  const title = `Datasheet: device ${texValue(draft.projectMetadata.device.waferNumber, "Unnamed Sample")} -- ${texValue(draft.projectMetadata.device.deviceName, "Unnamed Device")}`;
  const figureNames = new Set(figureFileNames);
  const reportDate = getCurrentReportDate();

  const pulsedSection = buildSection("Pulsed Characteristics", [
    buildPulsedLivSection(draft, artifacts, figureNames, figureDirectory),
    buildPulsedSpectraSection(draft, artifacts, figureNames, figureDirectory),
  ]);

  const cwSection = buildSection("CW Characteristics", [
    buildCwLivSection(draft, artifacts, figureNames, figureDirectory),
    buildCwSpectraSection(draft, artifacts, figureNames, figureDirectory),
  ]);

  return [
    // Keep the document plain enough that it compiles both locally and on Overleaf.
    "\\documentclass[12pt]{article}",
    "\\usepackage[utf8]{inputenc}",
    "\\usepackage{graphicx}",
    "\\usepackage{geometry}",
    "\\usepackage{tabularx}",
    "\\usepackage{subcaption}",
    "\\usepackage{caption}",
    "\\usepackage{amsmath}",
    "\\usepackage{array}",
    "\\newcolumntype{Y}{>{\\raggedright\\arraybackslash}p{0.6\\textwidth}}",
    "\\geometry{margin=2cm}",
    "",
    "\\begin{document}",
    "\\thispagestyle{empty}",
    "",
    "\\vspace*{4cm}",
    "\\begin{center}",
    `{\\Huge \\textbf{${title}}} \\\\[1ex]`,
    `{\\small \\textit{Characterised by: ${texValue(draft.projectMetadata.author, "Unknown Author")}}} \\\\[2ex]`,
    `{\\large ${texValue(reportDate)}}`,
    "\\end{center}",
    "",
    "\\vspace{5cm}",
    buildPerformanceSummary(draft, artifacts),
    pulsedSection,
    cwSection,
    "\\end{document}",
    "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function downloadLatexReport(draft: WizardDraft, artifacts: ReportArtifacts) {
  const waferNumber = draft.projectMetadata.device.waferNumber.trim() || "qcl-report";
  const deviceName = draft.projectMetadata.device.deviceName.trim() || "device";
  const safeWafer = waferNumber.replace(/[^A-Za-z0-9._-]/g, "_");
  const safeDevice = deviceName.replace(/[^A-Za-z0-9._-]/g, "_");
  const fileStem = `${safeWafer}_${safeDevice}`;
  const bundleFolder = `${fileStem}_datasheet`;
  const { buildFigureBlobArtifacts } = await import("@/core/export/figureExport");
  const figures = await buildFigureBlobArtifacts(artifacts.livResults, artifacts.spectraResults, "pdf");
  const texSource = buildDesktopStyleReportLatex(
    draft,
    artifacts,
    figures.map((figure) => figure.fileName),
    "Figures",
  );

  const zip = new JSZip();
  zip.file(`${bundleFolder}/${fileStem}.tex`, texSource);

  for (const figure of figures) {
    // Overleaf needs the figure files beside the TEX source, not just referenced names.
    zip.file(`Figures/${figure.fileName}`, figure.blob);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  const pickerWindow = window as Window & {
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

  if (typeof pickerWindow.showSaveFilePicker === "function") {
    try {
      const handle = await pickerWindow.showSaveFilePicker({
        suggestedName: `${fileStem}.zip`,
        types: [
          {
            description: "ZIP archive",
            accept: { "application/zip": [".zip"] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(zipBlob);
      await writable.close();
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      throw error;
    }
    return;
  }

  const url = URL.createObjectURL(zipBlob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${fileStem}.zip`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function compileReportPdfBlob(draft: WizardDraft, artifacts: ReportArtifacts) {
  const { fileStem, tarBlob } = await buildLatexCompilationPayload(draft, artifacts);
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), LATEX_ONLINE_TIMEOUT_MS);

  const response = await fetch(
    `${LATEX_ONLINE_ENDPOINT}?target=${encodeURIComponent(`${fileStem}.tex`)}&command=pdflatex&force=true`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-tar",
      },
      body: tarBlob,
      signal: controller.signal,
    },
  ).finally(() => {
    window.clearTimeout(timeoutId);
  });

  if (!response.ok) {
    const details = (await response.text()).trim();
    throw new Error(details ? `LaTeX API compilation failed: ${details}` : "LaTeX API compilation failed.");
  }

  return {
    blob: await response.blob(),
    fileStem,
  };
}

export async function downloadCompiledPdfReport(draft: WizardDraft, artifacts: ReportArtifacts) {
  const { blob, fileStem } = await compileReportPdfBlob(draft, artifacts);
  const pickerWindow = window as Window & {
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

  if (typeof pickerWindow.showSaveFilePicker === "function") {
    try {
      const handle = await pickerWindow.showSaveFilePicker({
        suggestedName: `${fileStem}.pdf`,
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
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      throw error;
    }
    return;
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${fileStem}.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);
}
