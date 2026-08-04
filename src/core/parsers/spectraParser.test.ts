// These tests cover the expected spectra parsing behaviour.
import { parseSpectraFile } from "./spectraParser";

describe("parseSpectraFile", () => {
  it("converts wavenumber input to thz", () => {
    const result = parseSpectraFile({
      id: "1",
      datasetName: "CW FTIR - fixed temperature",
      fileName: "Spectra.dat",
      traceValue: 500,
      rawContent: "100.0 0.5\n101.0 0.8",
    });

    expect(result.points[0].frequencyThz).toBeCloseTo(2.9979, 3);
    expect(result.points[1].intensity).toBeCloseTo(0.8);
  });
});
