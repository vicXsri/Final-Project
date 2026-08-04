// These tests lock down which wizard steps should appear for each workflow choice.
import { createInitialDraft } from "@/core/domain/defaults";
import { getEnabledFileSteps, getFileStepNavigation, getVisibleWizardSteps } from "./wizardSteps";

describe("wizard step visibility", () => {
  it("keeps cw file steps hidden until cw setup sections are selected", () => {
    const draft = createInitialDraft();

    expect(getEnabledFileSteps(draft)).toEqual(["pulsedLiv"]);
    expect(getVisibleWizardSteps(draft).map((step) => step.label)).toEqual([
      "Setup Parameters",
      "Measurement Setup (pulsed)",
      "Pulsed LIV",
      "Measurement Setup (CW)",
      "Generate Image File",
      "Generate Report",
    ]);
  });

  it("shows only the selected pulsed file step when LIV alone is enabled", () => {
    const draft = createInitialDraft();
    draft.projectMetadata.workflows.pulsed = true;
    draft.projectMetadata.workflows.cw = false;
    draft.measurementSetup.pulsed.enabledSections = ["liv"];

    expect(getEnabledFileSteps(draft)).toEqual(["pulsedLiv"]);
    expect(getVisibleWizardSteps(draft).map((step) => step.label)).toEqual([
      "Setup Parameters",
      "Measurement Setup (pulsed)",
      "Pulsed LIV",
      "Generate Image File",
      "Generate Report",
    ]);
  });

  it("shows all selected pulsed and cw file steps in workflow order", () => {
    const draft = createInitialDraft();
    draft.projectMetadata.workflows.pulsed = true;
    draft.projectMetadata.workflows.cw = true;
    draft.measurementSetup.pulsed.enabledSections = ["liv", "fixedTemperature"];
    draft.measurementSetup.cw.enabledSections = ["fixedCurrent"];

    expect(getEnabledFileSteps(draft)).toEqual([
      "pulsedLiv",
      "pulsedSpectraFixedTemperature",
      "cwSpectraFixedCurrent",
    ]);

    expect(getVisibleWizardSteps(draft).map((step) => step.label)).toEqual([
      "Setup Parameters",
      "Measurement Setup (pulsed)",
      "Pulsed LIV",
      "Pulsed FTIR - fixed temperature",
      "Measurement Setup (CW)",
      "CW FTIR - fixed current",
      "Generate Image File",
      "Generate Report",
    ]);
  });

  it("hands the last pulsed file step over to cw setup when cw workflow is enabled", () => {
    const draft = createInitialDraft();

    expect(getFileStepNavigation(draft, "pulsedLiv")).toEqual({
      previousHref: "/wizard/measurement-pulsed",
      nextHref: "/wizard/measurement-cw",
      nextLabel: "Continue to CW Setup",
    });
  });

  it("keeps cw file navigation inside the cw flow", () => {
    const draft = createInitialDraft();
    draft.measurementSetup.cw.enabledSections = ["liv"];

    expect(getFileStepNavigation(draft, "cwLiv")).toEqual({
      previousHref: "/wizard/measurement-cw",
      nextHref: "/results",
      nextLabel: "Generate Image File",
    });
  });
});
