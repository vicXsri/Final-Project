// Basic interactive Plotly config for the on-screen LIV chart.
import type { Layout, PlotData } from "plotly.js";
import type { ProcessedLivResult } from "@/types/contracts";

export function createLivPlotConfig(result: ProcessedLivResult): {
  data: PlotData[];
  layout: Partial<Layout>;
} {
  return {
    data: result.traces.map((trace) => ({
      type: "scatter",
      mode: "lines",
      name: `${trace.traceValue} ${result.traceVariableLabel}`,
      x: trace.points.map((point) => point.currentMa),
      y: trace.normalizedOpticalValues,
      line: { width: 2.5 },
    })),
    layout: {
      title: result.datasetName,
      paper_bgcolor: "white",
      plot_bgcolor: "white",
      xaxis: { title: "Current (mA)" },
      yaxis: { title: "Normalized optical output" },
      legend: { orientation: "h" },
      margin: { t: 56, r: 24, l: 56, b: 56 },
    },
  };
}
