// LIV text files are turned into sorted numeric traces here.
import type { LivTrace, UploadedMeasurementFile } from "@/types/contracts";
import { splitNumericFields } from "./shared";

export function parseLivFile(file: UploadedMeasurementFile): LivTrace {
  const points = file.rawContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      const fields = splitNumericFields(line);
      if (fields.length !== 3) return [];

      const [currentMa, electricalValue, opticalValue] = fields.map(Number);
      if ([currentMa, electricalValue, opticalValue].some((value) => Number.isNaN(value))) {
        return [];
      }

      // Tiny or zero current rows are usually header junk or bad data.
      if (currentMa <= 0.005) return [];

      return [{ currentMa, electricalValue, opticalValue }];
    })
    .sort((left, right) => left.currentMa - right.currentMa);

  return {
    traceValue: file.traceValue,
    fileName: file.fileName,
    points,
  };
}
