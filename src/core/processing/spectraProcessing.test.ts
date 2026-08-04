// Processing tests for spectra focus on normalization and peak detection.
import { processSpectraDataset } from "./spectraProcessing";

describe("processSpectraDataset", () => {
  it("returns a safe empty result when every trace has no valid points", () => {
    const result = processSpectraDataset({
      kind: "spectra",
      datasetName: "Pulsed FTIR - fixed current",
      traceVariableLabel: "Temperature (K)",
      traces: [
        {
          traceValue: 10,
          fileName: "empty-a.dat",
          points: [],
        },
        {
          traceValue: 20,
          fileName: "empty-b.dat",
          points: [
            { frequencyThz: Number.NaN, intensity: 0.5 },
            { frequencyThz: 3.2, intensity: Number.NaN },
          ],
        },
      ],
    });

    expect(result.traces).toEqual([]);
    expect(result.frequencyRange).toEqual({ min: 0, max: 1 });
  });
});
