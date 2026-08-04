// Plot cards wrap the interactive viewer controls around each chart.
import {
  useEffect,
  useId,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";
import Plotly from "plotly.js-dist-min";
import { Download, Expand, RefreshCcw, Shrink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatNumber } from "@/lib/utils";
import type { ProcessedLivResult, ProcessedSpectraResult } from "@/types/contracts";

const plotlyApi = Plotly as {
  react: (element: HTMLDivElement, data: Record<string, unknown>[], layout: Record<string, unknown>, config?: Record<string, unknown>) => Promise<void>;
  purge: (element: HTMLDivElement) => void;
  downloadImage: (element: HTMLDivElement, options: Record<string, unknown>) => Promise<void>;
  relayout: (element: HTMLDivElement, update: Record<string, unknown>) => Promise<void>;
  Plots: {
    resize: (element: HTMLDivElement) => Promise<void> | void;
  };
};

const chartColors = ["#1d4ed8", "#ea580c", "#16a34a", "#7c3aed", "#dc2626", "#0f766e"];

type PlotlyFigure = {
  data: Record<string, unknown>[];
  layout: Record<string, unknown>;
  config?: Record<string, unknown>;
};

type AxisRangeValues = {
  xMin: string;
  xMax: string;
  yMin: string;
  yMax: string;
  y2Min: string;
  y2Max: string;
};

type PlotlyPanelProps = {
  figure: PlotlyFigure;
  title: string;
  badge?: string;
  plotRef: MutableRefObject<HTMLDivElement | null>;
  toolbar?: ReactNode;
  expanded?: boolean;
};

type LivDisplayMode = "combined" | "voltage" | "light";
const spectraLayerSpacing = 1.2;

function buildTickValues(min: number, max: number, count = 5) {
  const safeRange = max - min || 1;
  return Array.from({ length: count }, (_, index) => min + (safeRange * index) / (count - 1));
}

function parseRangeValue(value: string) {
  if (value.trim() === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function createInitialAxisRanges(result: ProcessedLivResult): AxisRangeValues {
  return {
    xMin: formatNumber(result.currentRange.min, 4),
    xMax: formatNumber(result.currentRange.max, 4),
    yMin: formatNumber(result.voltageRange.min, 3),
    yMax: formatNumber(result.voltageRange.max, 3),
    y2Min: formatNumber(result.opticalDisplayRange.min, 3),
    y2Max: formatNumber(result.opticalDisplayRange.max, 3),
  };
}

function PlotlyPanel({ figure, title, badge, plotRef, toolbar, expanded = false }: PlotlyPanelProps) {
  const plotId = useId();

  useEffect(() => {
    let isMounted = true;
    const plotElement = plotRef.current;

    async function renderPlot() {
      if (!plotElement || !isMounted) {
        return;
      }

      await plotlyApi.react(plotElement, figure.data, figure.layout, figure.config);
    }

    void renderPlot();

    function handleResize() {
      if (plotElement) {
        void plotlyApi.Plots.resize(plotElement);
      }
    }

    window.addEventListener("resize", handleResize);

    return () => {
      isMounted = false;
      window.removeEventListener("resize", handleResize);
      if (plotElement) {
        plotlyApi.purge(plotElement);
      }
    };
  }, [figure, plotRef]);

  return (
    <div
      className={
        expanded
          ? "overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_32px_100px_rgba(15,23,42,0.18)]"
          : "overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]"
      }
    >
      <div className="border-b border-slate-100 bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_42%,#f0fdfa_100%)] px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h4 className="text-lg font-semibold text-slate-900">{title}</h4>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {badge ? (
              <div className="rounded-full bg-slate-950 px-3 py-1 text-xs font-medium text-white">{badge}</div>
            ) : null}
            {toolbar}
          </div>
        </div>
      </div>
      <div className="bg-[radial-gradient(circle_at_top_left,rgba(29,78,216,0.08),transparent_24%),linear-gradient(180deg,#fcfdff_0%,#f8fafc_100%)] p-4">
        <div id={plotId} ref={plotRef} className={expanded ? "h-[72vh] w-full rounded-2xl bg-white" : "h-[520px] w-full rounded-2xl bg-white"} />
      </div>
    </div>
  );
}

function ControlGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-3">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function RangeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
}) {
  return (
    <label className="grid min-w-[112px] gap-1 text-[11px] font-medium text-slate-600">
      <span>{label}</span>
      <Input value={value} onChange={(event) => onChange(event.target.value)} className="h-9 bg-white px-3 py-2 text-sm" />
    </label>
  );
}

function createLivFigure(
  result: ProcessedLivResult,
  visibleTraces: Record<string, boolean>,
  displayMode: LivDisplayMode,
  axisRanges: AxisRangeValues,
): PlotlyFigure {
  const densityScale =
    (result.currentDensityRange.max - result.currentDensityRange.min) / (result.currentRange.max - result.currentRange.min || 1);
  const bottomTicks = buildTickValues(
    parseRangeValue(axisRanges.xMin) ?? result.currentRange.min,
    parseRangeValue(axisRanges.xMax) ?? result.currentRange.max,
  );

  const livData = result.traces
    .filter((trace) => visibleTraces[trace.fileName] !== false)
    .flatMap((trace, index) => {
      const color = chartColors[index % chartColors.length];
      const label = `${formatNumber(trace.traceValue, 0)} [K]`;
      const lightValues = trace.normalizedOpticalValues;

      const traces: Record<string, unknown>[] = [];

      if (displayMode === "combined" || displayMode === "voltage") {
        traces.push({
          x: trace.points.map((point) => point.currentMa),
          y: trace.points.map((point) => point.electricalValue),
          type: "scatter",
          mode: "lines",
          name: label,
          line: {
            color,
            width: 3.2,
          },
          hovertemplate: "I: %{x:.4f} A<br>V: %{y:.3f} V<extra>" + label + "</extra>",
          xaxis: "x",
          yaxis: "y",
        });
      }

      if (displayMode === "combined" || displayMode === "light") {
        traces.push({
          x: trace.points.map((point) => point.currentMa),
          y: lightValues,
          type: "scatter",
          mode: "lines",
          name: label,
          showlegend: displayMode !== "combined",
          line: {
            color,
            width: 3.2,
          },
          hovertemplate: `I: %{x:.4f} A<br>L: %{y:.3f} ${result.opticalUnit}<extra>${label}</extra>`,
          xaxis: "x",
          yaxis: displayMode === "light" ? "y" : "y2",
        });
      }

      return traces;
    });

  const voltageTitle = displayMode === "light" ? `L [${result.opticalUnit}]` : "V [V]";
  const voltageRange =
    displayMode === "light"
      ? [parseRangeValue(axisRanges.y2Min) ?? result.opticalDisplayRange.min, parseRangeValue(axisRanges.y2Max) ?? result.opticalDisplayRange.max]
      : [parseRangeValue(axisRanges.yMin) ?? result.voltageRange.min, parseRangeValue(axisRanges.yMax) ?? result.voltageRange.max];

  return {
    data: livData,
    layout: {
      autosize: true,
      paper_bgcolor: "#ffffff",
      plot_bgcolor: "#ffffff",
      margin: { t: 64, r: displayMode === "combined" ? 96 : 48, b: 96, l: 96 },
      legend: {
        orientation: "v",
        yanchor: "top",
        y: 0.98,
        xanchor: "left",
        x: 0.02,
        bgcolor: "rgba(255,255,255,0.94)",
        bordercolor: "rgba(15,23,42,0.28)",
        borderwidth: 1,
        font: {
          size: 12,
          color: "#0f172a",
        },
      },
      font: {
        family: "Segoe UI, sans-serif",
        color: "#0f172a",
      },
      hovermode: "x unified",
      dragmode: "zoom",
      xaxis: {
        title: {
          text: "I [A]",
          standoff: 18,
        },
        automargin: true,
        range: [parseRangeValue(axisRanges.xMin) ?? result.currentRange.min, parseRangeValue(axisRanges.xMax) ?? result.currentRange.max],
        showgrid: true,
        gridcolor: "rgba(148,163,184,0.18)",
        zeroline: false,
        mirror: true,
        linecolor: "#0f172a",
        tickfont: { size: 12 },
      },
      xaxis2: {
        title: {
          text: "J [A cm^-2]",
          standoff: 14,
        },
        automargin: true,
        overlaying: "x",
        side: "top",
        range: [parseRangeValue(axisRanges.xMin) ?? result.currentRange.min, parseRangeValue(axisRanges.xMax) ?? result.currentRange.max],
        tickvals: bottomTicks,
        ticktext: bottomTicks.map((tick) => formatNumber(tick * densityScale, 0)),
        showgrid: false,
        zeroline: false,
        mirror: true,
        linecolor: "#0f172a",
        tickfont: { size: 12 },
      },
      yaxis: {
        title: {
          text: voltageTitle,
          standoff: 18,
        },
        automargin: true,
        range: voltageRange,
        showgrid: true,
        gridcolor: "rgba(148,163,184,0.18)",
        zeroline: false,
        mirror: true,
        linecolor: "#0f172a",
        tickfont: { size: 12 },
      },
      ...(displayMode === "combined"
        ? {
            yaxis2: {
              title: {
                text: `L [${result.opticalUnit}]`,
                standoff: 18,
              },
              automargin: true,
              range: [parseRangeValue(axisRanges.y2Min) ?? result.opticalDisplayRange.min, parseRangeValue(axisRanges.y2Max) ?? result.opticalDisplayRange.max],
              overlaying: "y",
              side: "right",
              showgrid: false,
              zeroline: false,
              mirror: true,
              linecolor: "#0f172a",
              tickfont: { size: 12 },
            },
          }
        : {}),
    },
    config: {
      responsive: true,
      displaylogo: false,
      doubleClick: "reset",
      scrollZoom: true,
      modeBarButtonsToRemove: ["lasso2d", "select2d", "toImage"],
      toImageButtonOptions: {
        format: "png",
        filename: result.datasetName.replace(/\s+/g, "_").toLowerCase(),
        scale: 2,
      },
    },
  };
}

function createSpectraFigure(result: ProcessedSpectraResult): PlotlyFigure {
  const layeredTraces = result.traces.map((trace, index) => {
    const offset = index * spectraLayerSpacing;
    return {
      ...trace,
      offset,
      layeredValues: trace.normalizedIntensities.map((value) => value + offset),
    };
  });

  return {
    data: layeredTraces.map((trace, index) => ({
      x: trace.points.map((point) => point.frequencyThz),
      y: trace.layeredValues,
      customdata: trace.normalizedIntensities,
      type: "scatter",
      mode: "lines",
      name: `${result.traceVariableLabel}: ${formatNumber(trace.traceValue, 1)}`,
      line: {
        color: chartColors[index % chartColors.length],
        width: 3,
      },
      hovertemplate: "f: %{x:.3f} THz<br>I: %{customdata:.3f}<extra></extra>",
    })),
    layout: {
      autosize: true,
      paper_bgcolor: "#ffffff",
      plot_bgcolor: "#ffffff",
      margin: { t: 36, r: 48, b: 96, l: 96 },
      legend: {
        orientation: "v",
        yanchor: "top",
        y: 0.98,
        xanchor: "left",
        x: 0.02,
        bgcolor: "rgba(255,255,255,0.92)",
        bordercolor: "rgba(15,23,42,0.25)",
        borderwidth: 1,
      },
      font: {
        family: "Segoe UI, sans-serif",
        color: "#0f172a",
      },
      xaxis: {
        title: {
          text: "Frequency (THz)",
          standoff: 18,
        },
        automargin: true,
        showgrid: true,
        gridcolor: "rgba(148,163,184,0.18)",
        zeroline: false,
        mirror: true,
        linecolor: "#0f172a",
      },
      yaxis: {
        title: {
          text: "Intensity (a.u.)",
          standoff: 18,
        },
        automargin: true,
        range: [-0.05, Math.max(1.2, layeredTraces.length * spectraLayerSpacing)],
        showgrid: false,
        zeroline: false,
        mirror: true,
        linecolor: "#0f172a",
        tickmode: "array",
        tickvals: layeredTraces.map((trace) => trace.offset + 0.5),
        ticktext: layeredTraces.map((trace) => formatNumber(trace.traceValue, 1)),
      },
      shapes: layeredTraces.map((trace) => ({
        type: "line",
        xref: "x",
        yref: "y",
        x0: result.frequencyRange.min,
        x1: result.frequencyRange.max,
        y0: trace.offset,
        y1: trace.offset,
        line: {
          color: "rgba(148,163,184,0.45)",
          width: 1,
        },
      })),
      hovermode: "x unified",
    },
    config: {
      responsive: true,
      displaylogo: false,
      doubleClick: "reset",
      scrollZoom: true,
      modeBarButtonsToRemove: ["lasso2d", "select2d", "toImage"],
    },
  };
}

function LivInteractiveViewer({ result }: { result: ProcessedLivResult }) {
  const plotRef = useRef<HTMLDivElement | null>(null);
  const fullscreenPlotRef = useRef<HTMLDivElement | null>(null);
  const [displayMode, setDisplayMode] = useState<LivDisplayMode>("combined");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [axisRanges, setAxisRanges] = useState<AxisRangeValues>(() => createInitialAxisRanges(result));
  const [visibleTraces, setVisibleTraces] = useState<Record<string, boolean>>(
    Object.fromEntries(result.traces.map((trace) => [trace.fileName, true])),
  );

  const figure = createLivFigure(result, visibleTraces, displayMode, axisRanges);

  function toggleTrace(fileName: string) {
    setVisibleTraces((current) => ({
      ...current,
      [fileName]: !current[fileName],
    }));
  }

  function resetView() {
    setAxisRanges(createInitialAxisRanges(result));
    const activePlot = isFullscreen ? fullscreenPlotRef.current : plotRef.current;
    if (activePlot) {
      void plotlyApi.relayout(activePlot, {
        "xaxis.autorange": true,
        "yaxis.autorange": true,
        "yaxis2.autorange": true,
      });
    }
  }

  function downloadCurrentPlot(format: "png" | "svg") {
    const activePlot = isFullscreen ? fullscreenPlotRef.current : plotRef.current;
    if (!activePlot) {
      return;
    }

    void plotlyApi.downloadImage(activePlot, {
      format,
      filename: `${result.datasetName.replace(/\s+/g, "_").toLowerCase()}_${displayMode}`,
      scale: format === "png" ? 2 : 1,
    });
  }

  function renderToolbar() {
    return (
    <>
      <Button type="button" variant="outline" onClick={() => downloadCurrentPlot("svg")}>
        <Download className="mr-2 h-4 w-4" />
        SVG
      </Button>
      <Button type="button" variant="outline" onClick={() => setIsFullscreen((current) => !current)}>
        {isFullscreen ? <Shrink className="mr-2 h-4 w-4" /> : <Expand className="mr-2 h-4 w-4" />}
        {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
      </Button>
      </>
    );
  }

  function renderControls() {
    return (
      <div className="grid gap-3 lg:grid-cols-[0.85fr_1.15fr]">
      <ControlGroup label="Display Mode">
        {[
          { id: "combined", label: "Combined" },
          { id: "voltage", label: "Voltage only" },
          { id: "light", label: "Light only" },
        ].map((option) => (
          <Button
            key={option.id}
            type="button"
            variant={displayMode === option.id ? "default" : "outline"}
            onClick={() => setDisplayMode(option.id as LivDisplayMode)}
            className="px-3 py-2"
          >
            {option.label}
          </Button>
        ))}
      </ControlGroup>
      <ControlGroup label="Axis Range Controls">
        <RangeField label="X min" value={axisRanges.xMin} onChange={(value) => setAxisRanges((current) => ({ ...current, xMin: value }))} />
        <RangeField label="X max" value={axisRanges.xMax} onChange={(value) => setAxisRanges((current) => ({ ...current, xMax: value }))} />
        <RangeField label="Y min" value={axisRanges.yMin} onChange={(value) => setAxisRanges((current) => ({ ...current, yMin: value }))} />
        <RangeField label="Y max" value={axisRanges.yMax} onChange={(value) => setAxisRanges((current) => ({ ...current, yMax: value }))} />
        <RangeField label="Y2 min" value={axisRanges.y2Min} onChange={(value) => setAxisRanges((current) => ({ ...current, y2Min: value }))} />
        <RangeField label="Y2 max" value={axisRanges.y2Max} onChange={(value) => setAxisRanges((current) => ({ ...current, y2Max: value }))} />
      </ControlGroup>
    </div>
    );
  }

  function renderTraceVisibility() {
    return (
      <ControlGroup label="Trace Visibility">
        {result.traces.map((trace, index) => (
          <button
            key={trace.fileName}
            type="button"
            onClick={() => toggleTrace(trace.fileName)}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
              visibleTraces[trace.fileName] !== false
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-500"
            }`}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
            {formatNumber(trace.traceValue, 0)} K
          </button>
        ))}
      </ControlGroup>
    );
  }

  return (
    <>
      <Card className="border-none bg-transparent p-0 shadow-none">
        <div className="mb-5">
          <h3 className="text-2xl font-semibold text-slate-900">{result.datasetName}</h3>
        </div>
        <div className="grid gap-5">
          {renderControls()}
          {renderTraceVisibility()}
          <PlotlyPanel
            figure={figure}
            title="LIV Figure"
            plotRef={plotRef}
            toolbar={renderToolbar()}
          />
        </div>
      </Card>
      {isFullscreen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm lg:p-6">
          <div className="mx-auto flex min-h-full max-w-7xl flex-col gap-5 rounded-[32px] border border-slate-200 bg-white p-4 shadow-2xl lg:p-6">
            <div className="sticky top-0 z-10 -mx-4 -mt-4 flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 bg-white/95 px-4 py-4 backdrop-blur lg:-mx-6 lg:-mt-6 lg:px-6">
              <div>
                <h3 className="text-2xl font-semibold text-slate-900">{result.datasetName}</h3>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={resetView}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
                <Button type="button" variant="outline" onClick={() => downloadCurrentPlot("svg")}>
                  <Download className="mr-2 h-4 w-4" />
                  SVG
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsFullscreen(false)}>
                  <Shrink className="mr-2 h-4 w-4" />
                  Close
                </Button>
              </div>
            </div>
            <div className="grid gap-5">
              {renderControls()}
              {renderTraceVisibility()}
              <PlotlyPanel
                figure={figure}
                title="LIV Figure"
                plotRef={fullscreenPlotRef}
                expanded
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function LivPlotCard({ result }: { result: ProcessedLivResult }) {
  const viewerKey = `${result.datasetName}-${result.traces.map((trace) => trace.fileName).join("|")}`;
  return <LivInteractiveViewer key={viewerKey} result={result} />;
}

export function SpectraPlotCard({ result }: { result: ProcessedSpectraResult }) {
  const plotRef = useRef<HTMLDivElement | null>(null);
  const fullscreenPlotRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const figure = createSpectraFigure(result);

  function downloadCurrentPlot(format: "png" | "svg") {
    const activePlot = isFullscreen ? fullscreenPlotRef.current : plotRef.current;
    if (!activePlot) {
      return;
    }

    void plotlyApi.downloadImage(activePlot, {
      format,
      filename: result.datasetName.replace(/\s+/g, "_").toLowerCase(),
      scale: format === "png" ? 2 : 1,
    });
  }

  function renderToolbar() {
    return (
      <>
      <Button type="button" variant="outline" onClick={() => downloadCurrentPlot("svg")}>
        <Download className="mr-2 h-4 w-4" />
        SVG
      </Button>
      <Button type="button" variant="outline" onClick={() => setIsFullscreen((current) => !current)}>
        {isFullscreen ? <Shrink className="mr-2 h-4 w-4" /> : <Expand className="mr-2 h-4 w-4" />}
        {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
      </Button>
      </>
    );
  }

  return (
    <>
      <Card className="border-none bg-transparent p-0 shadow-none">
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-slate-900">{result.datasetName}</h3>
        </div>
        <PlotlyPanel
          figure={figure}
          title="Spectra Figure"
          plotRef={plotRef}
          toolbar={renderToolbar()}
        />
      </Card>
      {isFullscreen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm lg:p-6">
          <div className="mx-auto flex min-h-full max-w-7xl flex-col gap-5 rounded-[32px] border border-slate-200 bg-white p-4 shadow-2xl lg:p-6">
            <div className="sticky top-0 z-10 -mx-4 -mt-4 flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 bg-white/95 px-4 py-4 backdrop-blur lg:-mx-6 lg:-mt-6 lg:px-6">
              <div>
                <h3 className="text-2xl font-semibold text-slate-900">{result.datasetName}</h3>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => downloadCurrentPlot("svg")}>
                  <Download className="mr-2 h-4 w-4" />
                  SVG
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsFullscreen(false)}>
                  <Shrink className="mr-2 h-4 w-4" />
                  Close
                </Button>
              </div>
            </div>
            <PlotlyPanel
              figure={figure}
              title="Spectra Figure"
              plotRef={fullscreenPlotRef}
              expanded
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
