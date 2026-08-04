// Basic interactive Plotly config for spectra views inside the app.
import type { Layout, PlotData } from "plotly.js";
import type { ProcessedSpectraResult } from "@/types/contracts";

export function createSpectraPlotConfig(result: ProcessedSpectraResult): {
  data: PlotData[];
  layout: Partial<Layout>;
} {
  return {
    data: result.traces.map((trace) => ({
      type: "scatter",
      mode: "lines",
      name: `${trace.traceValue} ${result.traceVariableLabel}`,
      x: trace.points.map((point) => point.frequencyThz),
      y: trace.normalizedIntensities,
      line: { width: 2.5 },
    })),
    layout: {
      title: result.datasetName,
      paper_bgcolor: "white",
      plot_bgcolor: "white",
      xaxis: { title: "Frequency (THz)" },
      yaxis: { title: "Normalized intensity" },
      legend: { orientation: "h" },
      margin: { t: 56, r: 24, l: 56, b: 56 },
    },
  };
}
