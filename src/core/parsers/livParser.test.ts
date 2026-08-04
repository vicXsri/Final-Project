// These tests cover the main LIV text-file parsing assumptions.
import { parseLivFile } from "./livParser";

describe("parseLivFile", () => {
  it("parses a three-column liv file", () => {
    const result = parseLivFile({
      id: "1",
      datasetName: "Pulsed LIV",
      fileName: "LIV_20K.dat",
      traceValue: 20,
      rawContent: "0.015 1.699 0.000\n0.030 2.070 0.100",
    });

    expect(result.points).toHaveLength(2);
    expect(result.points[1].opticalValue).toBeCloseTo(0.1);
  });
});
