// Report plot configs mimic the cleaner journal-style figures used in exports.
import type { Layout, PlotData } from "plotly.js";
import { formatNumber } from "@/lib/utils";
import type { ProcessedLivResult, ProcessedSpectraResult } from "@/types/contracts";

const reportColors = ["#000000", "#dc2626", "#1d4ed8", "#16a34a", "#f59e0b", "#7c3aed"];
const spectraLayerSpacing = 1.2;

function buildTickValues(min: number, max: number, count = 6) {
  const safeRange = max - min || 1;
  return Array.from({ length: count }, (_, index) => min + (safeRange * index) / (count - 1));
}

export function createLivReportPlotConfig(result: ProcessedLivResult): {
  data: PlotData[];
  layout: Partial<Layout>;
} {
  const xTicks = buildTickValues(result.currentRange.min, result.currentRange.max);
  const densityScale =
    (result.currentDensityRange.max - result.currentDensityRange.min) / (result.currentRange.max - result.currentRange.min || 1);

  const data = result.traces.flatMap((trace, index) => {
    const color = reportColors[index % reportColors.length];
    const label = `${formatNumber(trace.traceValue, 0)} [K]`;

    return [
      // Voltage and optical power share the same current axis but different y-axes.
      ({
        type: "scatter",
        mode: "lines",
        name: label,
        x: trace.points.map((point) => point.currentMa),
        y: trace.points.map((point) => point.electricalValue),
        line: { width: 3, color },
        xaxis: "x",
        yaxis: "y",
      } as PlotData),
      ({
        type: "scatter",
        mode: "lines",
        name: label,
        showlegend: false,
        x: trace.points.map((point) => point.currentMa),
        y: trace.normalizedOpticalValues,
        line: { width: 3, color },
        xaxis: "x",
        yaxis: "y2",
      } as PlotData),
    ];
  });

  return {
    data,
    layout: ({
      paper_bgcolor: "#ffffff",
      plot_bgcolor: "#ffffff",
      font: {
        family: "Times New Roman, Georgia, serif",
        size: 22,
        color: "#111111",
      },
      margin: { t: 52, r: 116, b: 116, l: 120 },
      showlegend: true,
      legend: {
        x: 0.04,
        y: 0.98,
        xanchor: "left",
        yanchor: "top",
        bgcolor: "rgba(255,255,255,0.96)",
        bordercolor: "#111111",
        borderwidth: 1,
        font: {
          family: "Times New Roman, Georgia, serif",
          size: 18,
          color: "#111111",
        },
      } as Partial<Layout["legend"]>,
      xaxis: ({
        title: {
          text: "<i>I</i> [A]",
          standoff: 24,
        },
        automargin: true,
        range: [0, Math.max(1, result.currentRange.max)],
        showgrid: true,
        gridcolor: "rgba(0,0,0,0.4)",
        griddash: "dot",
        zeroline: false,
        mirror: "allticks",
        showline: true,
        linecolor: "#111111",
        linewidth: 2,
        ticks: "inside",
        ticklen: 8,
        tickwidth: 1.5,
        tickfont: { family: "Times New Roman, Georgia, serif", size: 20 },
      } as unknown) as Partial<Layout["xaxis"]>,
      xaxis2: ({
        title: {
          text: "<i>J</i> [A cm<sup>-2</sup>]",
          standoff: 18,
        },
        automargin: true,
        overlaying: "x",
        side: "top",
        tickvals: xTicks,
        ticktext: xTicks.map((tick) => formatNumber(tick * densityScale, 0)),
        showgrid: false,
        zeroline: false,
        mirror: "allticks",
        showline: true,
        linecolor: "#111111",
        linewidth: 2,
        ticks: "inside",
        ticklen: 8,
        tickwidth: 1.5,
        tickfont: { family: "Times New Roman, Georgia, serif", size: 20 },
      } as unknown) as Partial<Layout["xaxis"]>,
      yaxis: ({
        title: {
          text: "<i>V</i> [V]",
          standoff: 26,
        },
        automargin: true,
        range: [Math.min(1.1, result.voltageRange.min - 0.2), Math.max(9, result.voltageRange.max + 0.3)],
        showgrid: true,
        gridcolor: "rgba(0,0,0,0.4)",
        griddash: "dot",
        zeroline: false,
        mirror: "allticks",
        showline: true,
        linecolor: "#111111",
        linewidth: 2,
        ticks: "inside",
        ticklen: 8,
        tickwidth: 1.5,
        tickfont: { family: "Times New Roman, Georgia, serif", size: 20 },
      } as unknown) as Partial<Layout["yaxis"]>,
      yaxis2: ({
        title: {
          text: `<i>L</i> [${result.opticalUnit}]`,
          standoff: 26,
        },
        automargin: true,
        range: [0, Math.max(result.opticalDisplayRange.max, result.opticalRange.max)],
        overlaying: "y",
        side: "right",
        showgrid: false,
        zeroline: false,
        mirror: "allticks",
        showline: true,
        linecolor: "#111111",
        linewidth: 2,
        ticks: "inside",
        ticklen: 8,
        tickwidth: 1.5,
        tickfont: { family: "Times New Roman, Georgia, serif", size: 20 },
      } as unknown) as Partial<Layout["yaxis"]>,
    }) as Partial<Layout>,
  };
}

export function createSpectraReportPlotConfig(result: ProcessedSpectraResult): {
  data: PlotData[];
  layout: Partial<Layout>;
} {
  const layeredTraces = result.traces.map((trace, index) => {
    // Each trace is nudged upward to get the stacked FTIR look from the sample reports.
    const offset = index * spectraLayerSpacing;
    return {
      ...trace,
      offset,
      layeredValues: trace.normalizedIntensities.map((value) => value + offset),
    };
  });

  return {
    data: layeredTraces.map((trace, index) => ({
      type: "scatter",
      mode: "lines",
      name: `${formatNumber(trace.traceValue, 0)} [${result.traceVariableLabel.includes("Current") ? "mA" : "K"}]`,
      x: trace.points.map((point) => point.frequencyThz),
      y: trace.layeredValues,
      line: { width: 3, color: reportColors[index % reportColors.length] },
    }) as PlotData),
    layout: ({
      paper_bgcolor: "#ffffff",
      plot_bgcolor: "#ffffff",
      font: {
        family: "Times New Roman, Georgia, serif",
        size: 22,
        color: "#111111",
      },
      margin: { t: 48, r: 72, b: 116, l: 120 },
      legend: {
        x: 0.03,
        y: 0.98,
        xanchor: "left",
        yanchor: "top",
        bgcolor: "rgba(255,255,255,0.96)",
        bordercolor: "#111111",
        borderwidth: 1,
        font: {
          family: "Times New Roman, Georgia, serif",
          size: 18,
          color: "#111111",
        },
      } as Partial<Layout["legend"]>,
      xaxis: ({
        title: {
          text: "<i>f</i> [THz]",
          standoff: 24,
        },
        automargin: true,
        range: [result.frequencyRange.min, result.frequencyRange.max],
        showgrid: true,
        gridcolor: "rgba(0,0,0,0.4)",
        griddash: "dot",
        zeroline: false,
        mirror: "allticks",
        showline: true,
        linecolor: "#111111",
        linewidth: 2,
        ticks: "inside",
        ticklen: 8,
        tickwidth: 1.5,
        tickfont: { family: "Times New Roman, Georgia, serif", size: 20 },
      } as unknown) as Partial<Layout["xaxis"]>,
      yaxis: ({
        title: {
          text: "Intensity (a.u.)",
          standoff: 26,
        },
        automargin: true,
        range: [-0.05, Math.max(1.2, layeredTraces.length * spectraLayerSpacing)],
        showgrid: false,
        zeroline: false,
        mirror: "allticks",
        showline: true,
        linecolor: "#111111",
        linewidth: 2,
        ticks: "inside",
        ticklen: 8,
        tickwidth: 1.5,
        tickmode: "array",
        tickvals: layeredTraces.map((trace) => trace.offset + 0.5),
        ticktext: layeredTraces.map((trace) => formatNumber(trace.traceValue, 0)),
        tickfont: { family: "Times New Roman, Georgia, serif", size: 20 },
      } as unknown) as Partial<Layout["yaxis"]>,
      shapes: layeredTraces.map((trace) => ({
        type: "line",
        xref: "x",
        yref: "y",
        x0: result.frequencyRange.min,
        x1: result.frequencyRange.max,
        y0: trace.offset,
        y1: trace.offset,
        line: {
          color: "rgba(0,0,0,0.35)",
          width: 1,
        },
      })),
    }) as Partial<Layout> & { shapes?: Array<Record<string, unknown>> },
  };
}
