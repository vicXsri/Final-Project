// Parsed spectra traces are cleaned, normalized, and prepared for plotting here.
import type { ProcessedSpectraResult, SpectraDataset } from "@/types/contracts";

export function processSpectraDataset(dataset: SpectraDataset): ProcessedSpectraResult {
  const traces = [...dataset.traces]
    .map((trace) => ({
      ...trace,
      points: trace.points.filter(
        (point) => Number.isFinite(point.frequencyThz) && Number.isFinite(point.intensity),
      ),
    }))
    .filter((trace) => trace.points.length > 0)
    .sort((left, right) => left.traceValue - right.traceValue);

  if (traces.length === 0) {
    // Return a harmless empty shape so the UI can render without special casing.
    return {
      datasetName: dataset.datasetName,
      traceVariableLabel: dataset.traceVariableLabel,
      traces: [],
      frequencyRange: {
        min: 0,
        max: 1,
      },
    };
  }

  const frequencies = traces.flatMap((trace) => trace.points.map((point) => point.frequencyThz));

  return {
    datasetName: dataset.datasetName,
    traceVariableLabel: dataset.traceVariableLabel,
    traces: traces.map((trace) => {
      const rawPeak = Math.max(...trace.points.map((point) => point.intensity));
      const peak = rawPeak > 0 ? rawPeak : 1;
      // Peak frequency is useful later for summary/report-style views.
      const peakPoint = trace.points.reduce(
        (best, current) => (current.intensity > best.intensity ? current : best),
        trace.points[0],
      );

      return {
        ...trace,
        normalizedIntensities: trace.points.map((point) => point.intensity / peak),
        peakFrequencyThz: peakPoint.frequencyThz,
      };
    }),
    frequencyRange: {
      min: Math.min(...frequencies),
      max: Math.max(...frequencies),
    },
  };
}
