// Spectra text files are parsed and converted into THz-based traces here.
import type { SpectraTrace, UploadedMeasurementFile } from "@/types/contracts";
import { splitNumericFields } from "./shared";

const WAVENUMBER_TO_THZ = 0.0299792458;

export function parseSpectraFile(file: UploadedMeasurementFile): SpectraTrace {
  const points = file.rawContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      const fields = splitNumericFields(line);
      if (fields.length !== 2) return [];

      const [rawFrequency, intensity] = fields.map(Number);
      if ([rawFrequency, intensity].some((value) => Number.isNaN(value))) {
        return [];
      }

      const frequencyThz = rawFrequency * WAVENUMBER_TO_THZ;
      if (frequencyThz <= 0.005) return [];

      return [{ frequencyThz, intensity }];
    });

  const ascendingPoints =
    // Some FTIR exports run high-to-low, so flip them once for plotting.
    points.length > 1 && points[0].frequencyThz > points[points.length - 1].frequencyThz
      ? [...points].reverse()
      : points;

  return {
    traceValue: file.traceValue,
    fileName: file.fileName,
    points: ascendingPoints,
  };
}
