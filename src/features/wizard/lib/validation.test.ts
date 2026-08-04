// Route validation tests make sure the wizard only unlocks steps at the right time.
import { createInitialDraft } from "@/core/domain/defaults";
import { getFirstBlockedWizardPath, isMeasurementModeValid } from "./validation";

function createConfiguredDraft() {
  const draft = createInitialDraft();

  draft.projectMetadata.author = "viswa";
  draft.projectMetadata.date = "2026-07-30";
  draft.projectMetadata.device.waferNumber = "L2000";
  draft.projectMetadata.device.deviceName = "TOP2346";

  draft.measurementSetup.pulsed = {
    ...draft.measurementSetup.pulsed,
    cryostat: "C1",
    livDetector: "QMC superconducting TES",
    spectraDetector: "DTGS",
    powerSupply: "Agilent 8114A",
    spectrometer: "IFS66",
    enabledSections: ["liv"],
    powerScale: 10,
    driveFrequency: 10,
    dutyCycle: 2,
    gateFrequency: 167,
    tMax: 70,
  };

  draft.measurementSetup.cw = {
    ...draft.measurementSetup.cw,
    cryostat: "C1",
    livDetector: "QMC superconducting TES",
    spectraDetector: "DTGS",
    powerSupply: "Agilent E3634 (default)",
    spectrometer: "IFS66",
    enabledSections: [],
    powerScale: 100,
    tFix: 20,
    fMin: 3,
    fMax: 5,
  };

  return draft;
}

describe("wizard validation", () => {
  it("treats cw measurement as incomplete until cw sections are selected", () => {
    const draft = createConfiguredDraft();

    expect(isMeasurementModeValid(draft, "pulsed")).toBe(true);
    expect(isMeasurementModeValid(draft, "cw")).toBe(false);
  });

  it("redirects direct cw file access back to cw measurement setup when cw files are not enabled yet", () => {
    const draft = createConfiguredDraft();

    expect(getFirstBlockedWizardPath(draft, "/wizard/files/cw-liv")).toBe("/wizard/measurement-cw");
    expect(getFirstBlockedWizardPath(draft, "/results")).toBe("/wizard/measurement-cw");
  });
});
