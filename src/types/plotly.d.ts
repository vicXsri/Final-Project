// This fills the small Plotly type gaps the app relies on.
declare module "plotly.js" {
  export interface PlotData {
    type?: string;
    mode?: string;
    name?: string;
    x?: Array<number | string>;
    y?: Array<number | string>;
    line?: {
      width?: number;
    };
  }

  export interface Layout {
    title?: string;
    paper_bgcolor?: string;
    plot_bgcolor?: string;
    xaxis?: {
      title?: string;
    };
    yaxis?: {
      title?: string;
    };
    legend?: {
      orientation?: string;
    };
    margin?: {
      t?: number;
      r?: number;
      l?: number;
      b?: number;
    };
  }
}

declare module "react-plotly.js" {
  import type { ComponentType } from "react";

  const Plot: ComponentType<Record<string, unknown>>;
  export default Plot;
}

declare module "react-plotly.js/factory" {
  import type { ComponentType } from "react";

  export default function createPlotlyComponent(plotly: unknown): ComponentType<Record<string, unknown>>;
}

declare module "plotly.js-dist-min" {
  const Plotly: unknown;
  export default Plotly;
}
