// Step definitions and visibility rules for the whole wizard live here.
import type { MeasurementKind } from "@/types/contracts";
import type { WizardDraft } from "@/types/contracts";
export type WizardFlow = "pulsed" | "cw";

export type WizardStep = {
  label: string;
  href: string;
  match?: string[];
  kind?: MeasurementKind;
  flow?: "pulsed" | "cw" | "shared";
};

export const wizardSteps: WizardStep[] = [
  { label: "Setup Parameters", href: "/wizard/setup", match: ["/wizard/setup"], flow: "shared" },
  {
    label: "Measurement Setup (pulsed)",
    href: "/wizard/measurement-pulsed",
    match: ["/wizard/measurement-pulsed"],
    flow: "pulsed",
  },
  {
    label: "Pulsed LIV",
    href: "/wizard/files/pulsed-liv",
    match: ["/wizard/files/pulsed-liv"],
    kind: "pulsedLiv",
    flow: "pulsed",
  },
  {
    label: "Pulsed FTIR - fixed temperature",
    href: "/wizard/files/pulsed-ftir-fixed-temperature",
    match: ["/wizard/files/pulsed-ftir-fixed-temperature"],
    kind: "pulsedSpectraFixedTemperature",
    flow: "pulsed",
  },
  {
    label: "Pulsed FTIR - fixed current",
    href: "/wizard/files/pulsed-ftir-fixed-current",
    match: ["/wizard/files/pulsed-ftir-fixed-current"],
    kind: "pulsedSpectraFixedCurrent",
    flow: "pulsed",
  },
  {
    label: "Measurement Setup (CW)",
    href: "/wizard/measurement-cw",
    match: ["/wizard/measurement-cw"],
    flow: "cw",
  },
  {
    label: "CW LIV",
    href: "/wizard/files/cw-liv",
    match: ["/wizard/files/cw-liv"],
    kind: "cwLiv",
    flow: "cw",
  },
  {
    label: "CW FTIR - fixed temperature",
    href: "/wizard/files/cw-ftir-fixed-temperature",
    match: ["/wizard/files/cw-ftir-fixed-temperature"],
    kind: "cwSpectraFixedTemperature",
    flow: "cw",
  },
  {
    label: "CW FTIR - fixed current",
    href: "/wizard/files/cw-ftir-fixed-current",
    match: ["/wizard/files/cw-ftir-fixed-current"],
    kind: "cwSpectraFixedCurrent",
    flow: "cw",
  },
  { label: "Generate Image File", href: "/results", match: ["/results"], flow: "shared" },
  { label: "Generate Report", href: "/report", match: ["/report"], flow: "shared" },
];

export const fileStepOrder: MeasurementKind[] = [
  "pulsedLiv",
  "pulsedSpectraFixedTemperature",
  "pulsedSpectraFixedCurrent",
  "cwLiv",
  "cwSpectraFixedTemperature",
  "cwSpectraFixedCurrent",
];

const sectionToKindMap = {
  pulsed: {
    liv: "pulsedLiv",
    fixedTemperature: "pulsedSpectraFixedTemperature",
    fixedCurrent: "pulsedSpectraFixedCurrent",
  },
  cw: {
    liv: "cwLiv",
    fixedTemperature: "cwSpectraFixedTemperature",
    fixedCurrent: "cwSpectraFixedCurrent",
  },
} as const;

const measurementSetupHrefByFlow: Record<WizardFlow, string> = {
  pulsed: "/wizard/measurement-pulsed",
  cw: "/wizard/measurement-cw",
};

export function getFileStepHref(kind: MeasurementKind) {
  const step = wizardSteps.find((item) => item.kind === kind);
  return step?.href ?? "/wizard/files/pulsed-liv";
}

export function getFlowForKind(kind: MeasurementKind): WizardFlow {
  return kind.startsWith("pulsed") ? "pulsed" : "cw";
}

export function getMeasurementSetupHref(flow: WizardFlow) {
  return measurementSetupHrefByFlow[flow];
}

export function getMeasurementKindForPath(pathname: string) {
  return wizardSteps.find((step) => step.kind && step.match?.some((prefix) => pathname.startsWith(prefix)))?.kind;
}

export function getVisibleWizardSteps(draft: WizardDraft) {
  return wizardSteps.filter((step) => {
    if (step.flow === "shared" || !step.flow) {
      return true;
    }

     if (step.kind) {
      return getEnabledFileSteps(draft).includes(step.kind);
    }

    if (step.flow === "pulsed") {
      return draft.projectMetadata.workflows.pulsed;
    }

    return draft.projectMetadata.workflows.cw;
  });
}

export function getEnabledFileSteps(draft: WizardDraft, flow?: WizardFlow) {
  const enabledKinds: MeasurementKind[] = [];

  if (draft.projectMetadata.workflows.pulsed) {
    for (const section of draft.measurementSetup.pulsed.enabledSections) {
      enabledKinds.push(sectionToKindMap.pulsed[section]);
    }
  }

  if (draft.projectMetadata.workflows.cw) {
    for (const section of draft.measurementSetup.cw.enabledSections) {
      enabledKinds.push(sectionToKindMap.cw[section]);
    }
  }

  return flow ? enabledKinds.filter((kind) => getFlowForKind(kind) === flow) : enabledKinds;
}

export function getFileStepNavigation(draft: WizardDraft, kind: MeasurementKind) {
  const flow = getFlowForKind(kind);
  const enabledKinds = getEnabledFileSteps(draft, flow);
  const currentIndex = enabledKinds.indexOf(kind);
  const previousHref =
    currentIndex > 0 ? getFileStepHref(enabledKinds[currentIndex - 1]) : getMeasurementSetupHref(flow);

  if (currentIndex >= 0 && currentIndex < enabledKinds.length - 1) {
    return {
      previousHref,
      nextHref: getFileStepHref(enabledKinds[currentIndex + 1]),
      nextLabel: "Next",
    };
  }

  if (flow === "pulsed" && draft.projectMetadata.workflows.cw) {
    return {
      previousHref,
      nextHref: getMeasurementSetupHref("cw"),
      nextLabel: "Continue to CW Setup",
    };
  }

  return {
    previousHref,
    nextHref: "/results",
    nextLabel: "Generate Image File",
  };
}

export function getWizardStepIndex(pathname: string) {
  return wizardSteps.findIndex((step) => step.match?.some((prefix) => pathname.startsWith(prefix)));
}
