// Processing tests make sure LIV normalization still behaves as expected.
import { processLivDataset } from "./livProcessing";
import { processSpectraDataset } from "./spectraProcessing";

describe("processing", () => {
  it("normalizes liv traces", () => {
    const result = processLivDataset(
      {
        kind: "liv",
        datasetName: "Pulsed LIV",
        traceVariableLabel: "Temperature (K)",
        traces: [
          {
            traceValue: 20,
            fileName: "LIV_20K.dat",
            points: [
              { currentMa: 0.01, electricalValue: 1, opticalValue: 0.2 },
              { currentMa: 0.02, electricalValue: 2, opticalValue: 0.4 },
            ],
          },
        ],
      },
      100,
    );

    expect(result.traces[0].normalizedOpticalValues[1]).toBeCloseTo(100);
  });

  it("normalizes spectra traces", () => {
    const result = processSpectraDataset({
      kind: "spectra",
      datasetName: "CW FTIR - fixed temperature",
      traceVariableLabel: "Current (mA)",
      traces: [
        {
          traceValue: 500,
          fileName: "Spectra.dat",
          points: [
            { frequencyThz: 3.0, intensity: 0.1 },
            { frequencyThz: 3.1, intensity: 0.5 },
          ],
        },
      ],
    });

    expect(result.traces[0].normalizedIntensities[1]).toBe(1);
    expect(result.traces[0].peakFrequencyThz).toBe(3.1);
  });
});
