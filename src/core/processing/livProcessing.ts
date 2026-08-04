// Parsed LIV traces are normalized and given plotting ranges here.
import type { LivDataset, ProcessedLivResult } from "@/types/contracts";

export function processLivDataset(
  dataset: LivDataset,
  powerScale: number,
  dimensions?: { width: number; length: number },
): ProcessedLivResult {
  const traces = [...dataset.traces].sort((left, right) => left.traceValue - right.traceValue);
  const opticalValues = traces.flatMap((trace) => trace.points.map((point) => point.opticalValue));
  const currentValues = traces.flatMap((trace) => trace.points.map((point) => point.currentMa));
  const voltageValues = traces.flatMap((trace) => trace.points.map((point) => point.electricalValue));
  const rawReference = Math.max(...opticalValues);
  // Normalization should never divide by zero, even with flat or broken data.
  const reference = rawReference > 0 ? rawReference : 1;
  const width = dimensions?.width && dimensions.width > 0 ? dimensions.width : 150;
  const length = dimensions?.length && dimensions.length > 0 ? dimensions.length : 2;
  const currentDensityScale = 100000 / (width * length);

  return {
    datasetName: dataset.datasetName,
    traceVariableLabel: dataset.traceVariableLabel,
    traces: traces.map((trace) => ({
      ...trace,
      normalizedOpticalValues: trace.points.map((point) => (point.opticalValue / reference) * powerScale),
    })),
    currentRange: {
      min: Math.min(...currentValues),
      max: Math.max(...currentValues),
    },
    currentDensityRange: {
      // Current density is derived from the device dimensions entered in setup.
      min: Math.min(...currentValues) * currentDensityScale,
      max: Math.max(...currentValues) * currentDensityScale,
    },
    voltageRange: {
      min: Math.min(...voltageValues),
      max: Math.max(...voltageValues),
    },
    opticalRange: {
      min: 0,
      max: powerScale,
    },
    opticalDisplayRange: {
      min: 0.0001,
      max: powerScale * 1.75,
    },
    opticalUnit: powerScale === 100 ? "a.u." : "mW",
  };
}
