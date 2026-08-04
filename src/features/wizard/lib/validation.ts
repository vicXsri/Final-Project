// Wizard validation rules are kept here so pages can stay fairly lean.
import { measurementSchema, setupSchema } from "@/features/measurement-setup/forms/schemas";
import { getEnabledFileSteps, getMeasurementKindForPath } from "@/features/wizard/lib/wizardSteps";
import type { WizardDraft } from "@/types/contracts";

function isPulsedEnabled(draft: WizardDraft) {
  return draft.projectMetadata.workflows.pulsed;
}

function isCwEnabled(draft: WizardDraft) {
  return draft.projectMetadata.workflows.cw;
}

export function isSetupStepValid(draft: WizardDraft) {
  return setupSchema.safeParse({
    author: draft.projectMetadata.author,
    date: draft.projectMetadata.date,
    pulsedEnabled: draft.projectMetadata.workflows.pulsed,
    cwEnabled: draft.projectMetadata.workflows.cw,
    waferNumber: draft.projectMetadata.device.waferNumber,
    deviceName: draft.projectMetadata.device.deviceName,
    design: draft.projectMetadata.device.design,
    waveguide: draft.projectMetadata.device.waveguide,
    approxEmissionFrequencyThz: draft.projectMetadata.device.approxEmissionFrequencyThz,
    width: draft.projectMetadata.device.dimensions.width,
    length: draft.projectMetadata.device.dimensions.length,
    height: draft.projectMetadata.device.dimensions.height,
  }).success;
}

export function isMeasurementModeValid(draft: WizardDraft, mode: "pulsed" | "cw") {
  const hasEnabledSections = draft.measurementSetup[mode].enabledSections.length > 0;

  return measurementSchema.safeParse({
    pulsedCryostat: draft.measurementSetup.pulsed.cryostat,
    pulsedLivDetector: draft.measurementSetup.pulsed.livDetector,
    pulsedSpectraDetector: draft.measurementSetup.pulsed.spectraDetector,
    pulsedPowerSupply: draft.measurementSetup.pulsed.powerSupply,
    pulsedSpectrometer: draft.measurementSetup.pulsed.spectrometer,
    pulsedPowerScale: draft.measurementSetup.pulsed.powerScale,
    pulsedDriveFrequency: draft.measurementSetup.pulsed.driveFrequency,
    pulsedDutyCycle: draft.measurementSetup.pulsed.dutyCycle,
    pulsedGateFrequency: draft.measurementSetup.pulsed.gateFrequency,
    pulsedTMax: draft.measurementSetup.pulsed.tMax,
    pulsedFMin: draft.measurementSetup.pulsed.fMin,
    pulsedFMax: draft.measurementSetup.pulsed.fMax,
    pulsedTFix: draft.measurementSetup.pulsed.tFix,
    pulsedIFix: draft.measurementSetup.pulsed.iFix,
    cwCryostat: draft.measurementSetup.cw.cryostat,
    cwLivDetector: draft.measurementSetup.cw.livDetector,
    cwSpectraDetector: draft.measurementSetup.cw.spectraDetector,
    cwPowerSupply: draft.measurementSetup.cw.powerSupply,
    cwSpectrometer: draft.measurementSetup.cw.spectrometer,
    cwPowerScale: draft.measurementSetup.cw.powerScale,
    cwDriveFrequency: draft.measurementSetup.cw.driveFrequency,
    cwDutyCycle: draft.measurementSetup.cw.dutyCycle,
    cwGateFrequency: draft.measurementSetup.cw.gateFrequency,
    cwTMax: draft.measurementSetup.cw.tMax,
    cwFMin: draft.measurementSetup.cw.fMin,
    cwFMax: draft.measurementSetup.cw.fMax,
    cwTFix: draft.measurementSetup.cw.tFix,
    cwIFix: draft.measurementSetup.cw.iFix,
  }).success && hasEnabledSections && (mode === "pulsed" ? true : draft.measurementSetup.cw.powerScale > 0);
}

export function getFirstBlockedWizardPath(draft: WizardDraft, targetPath: string) {
  const setupValid = isSetupStepValid(draft);
  const pulsedValid = isMeasurementModeValid(draft, "pulsed");
  const cwValid = isMeasurementModeValid(draft, "cw");
  const pulsedEnabled = isPulsedEnabled(draft);
  const cwEnabled = isCwEnabled(draft);

  if (targetPath === "/" || targetPath === "/wizard/setup") {
    return null;
  }

  if (!setupValid) {
    return "/wizard/setup";
  }

  const requestedKind = getMeasurementKindForPath(targetPath);
  if (requestedKind && !getEnabledFileSteps(draft).includes(requestedKind)) {
    if (requestedKind.startsWith("pulsed")) {
      return pulsedEnabled ? "/wizard/measurement-pulsed" : cwEnabled ? "/wizard/measurement-cw" : "/wizard/setup";
    }

    return cwEnabled ? "/wizard/measurement-cw" : pulsedEnabled ? "/results" : "/wizard/setup";
  }

  if (targetPath === "/wizard/measurement-pulsed") {
    return pulsedEnabled ? null : cwEnabled ? "/wizard/measurement-cw" : "/wizard/setup";
  }

  if (targetPath.startsWith("/wizard/files/pulsed-ftir") || targetPath.startsWith("/wizard/files/pulsed-liv")) {
    if (!pulsedEnabled) {
      return cwEnabled ? "/wizard/measurement-cw" : "/wizard/setup";
    }
    return null;
  }

  const pulsedAndForwardPaths = [
    "/wizard/files/pulsed-liv",
    "/wizard/files/pulsed-ftir-fixed-temperature",
    "/wizard/files/pulsed-ftir-fixed-current",
    ...(cwEnabled
      ? [
          "/wizard/measurement-cw",
          "/wizard/files/cw-liv",
          "/wizard/files/cw-ftir-fixed-temperature",
          "/wizard/files/cw-ftir-fixed-current",
        ]
      : []),
    "/results",
    "/report",
  ];

  if (pulsedEnabled && pulsedAndForwardPaths.some((path) => targetPath.startsWith(path)) && !pulsedValid) {
    return "/wizard/measurement-pulsed";
  }

  if (targetPath === "/wizard/measurement-cw") {
    return cwEnabled ? null : pulsedEnabled ? "/results" : "/wizard/setup";
  }

  if (targetPath.startsWith("/wizard/files/cw-ftir") || targetPath.startsWith("/wizard/files/cw-liv")) {
    if (!cwEnabled) {
      return pulsedEnabled ? "/results" : "/wizard/setup";
    }
    if (pulsedEnabled && !pulsedValid) {
      return "/wizard/measurement-pulsed";
    }
  }

  const cwAndForwardPaths = [
    "/wizard/files/cw-liv",
    "/wizard/files/cw-ftir-fixed-temperature",
    "/wizard/files/cw-ftir-fixed-current",
    "/results",
    "/report",
  ];

  if (cwEnabled && cwAndForwardPaths.some((path) => targetPath.startsWith(path)) && !cwValid) {
    return "/wizard/measurement-cw";
  }

  return null;
}
